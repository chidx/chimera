import 'dotenv/config';
import { Worker } from 'bullmq';
import { Sandbox } from '@e2b/code-interpreter';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { connection } from '../lib/redis';
import { agentQueue, QUEUE_NAME } from '../lib/agentQueue';
import { query } from '../lib/db';
import { getNatsClient } from '../lib/nats';
import { StringCodec } from 'nats';
import { getAblyClient } from '../lib/ably';

const AGENT_MODE = process.env.AGENT_MODE ?? 'e2b';

const AGENT_RUNNER_SOURCE = fs.readFileSync(
  path.resolve(__dirname, '../../../chimera-agents/agents/agent_runner.py'),
  'utf-8'
);

if (AGENT_MODE === 'e2b') {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      console.log(`[agentWorker] Raw job.data:`, JSON.stringify(job.data));
      const { tokenId, missionId, missionParams, nextAgentTokenId } = job.data;

      console.log(`[agentWorker] Starting job ${job.id}: tokenId=${tokenId}, missionId=${missionId}`);

      const sandbox = await Sandbox.create({
        template: 'base',
        timeoutMs: 600_000,
        envVars: {
          BACKEND_URL: process.env.BACKEND_URL!,
          OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
          OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-5-nano',
        },
      });

      try {
        console.log(`[agentWorker] Job ${job.id}: starting pip install...`);
        const pipResult = await sandbox.commands.run(
          'pip install langgraph openai httpx python-dotenv --quiet',
          {
            timeoutMs: 0,
            onStdout: (line) => console.log(`[pip] ${line}`),
            onStderr: (line) => console.error(`[pip] ${line}`),
          }
        );
        if (pipResult.exitCode !== 0) {
          throw new Error(`pip install failed (exit ${pipResult.exitCode}): ${pipResult.stderr}`);
        }
        console.log(`[agentWorker] Job ${job.id}: pip install done`);

        await sandbox.files.write('/home/user/agent_runner.py', AGENT_RUNNER_SOURCE);

        await sandbox.files.write(
          '/tmp/job_input.json',
          JSON.stringify({
            tokenId,
            missionId,
            missionParams,
            nextAgentTokenId: nextAgentTokenId ?? 0,
          })
        );

        const diagScript = `
import sys, os
def step(msg):
    print(msg, flush=True)

step("diag: start")
from typing import TypedDict
from openai import OpenAI
from langgraph.graph import END, StateGraph
import httpx

step("diag: imports ok")

class AgentState(TypedDict):
    token_id: int
    agent_wallet: str
    capability_labels: list
    capability_descriptions: list
    mission_id: str
    mission_params: dict
    next_agent_token_id: int
    on_chain_data: dict
    analysis: str
    decision: dict
    message_to_next: dict
    tx_hash: str
    task_complete: bool

step("diag: AgentState defined")
workflow = StateGraph(AgentState)
step("diag: StateGraph created")

workflow.add_node("dummy", lambda s: s)
workflow.set_entry_point("dummy")
workflow.add_edge("dummy", END)
compiled = workflow.compile()
step("diag: workflow.compile() ok")

step("diag: testing HTTP to BACKEND_URL...")
try:
    resp = httpx.get(os.getenv("BACKEND_URL") + "/api/agents/1/identity",
                     headers={"ngrok-skip-browser-warning": "true"}, timeout=10)
    step(f"diag: HTTP status={resp.status_code}")
except Exception as e:
    step(f"diag: HTTP error={type(e).__name__}: {e}")

step("diag: all done")
`;
        await sandbox.files.write('/tmp/diag.py', diagScript);
        const diag = await sandbox.commands.run('python -u /tmp/diag.py', {
          timeoutMs: 0,
          envs: {
            OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
            BACKEND_URL: process.env.BACKEND_URL!,
          },
          onStdout: (line) => console.log(`[diag] ${line}`),
          onStderr: (line) => console.error(`[diag-err] ${line}`),
        });
        console.log(`[agentWorker] diag exit=${diag.exitCode}`);

        console.log(`[agentWorker] Job ${job.id}: running agent_runner.py...`);
        let result;
        try {
          result = await sandbox.commands.run('python -u /home/user/agent_runner.py', {
            timeoutMs: 0,
            envs: {
              OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
              OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-5-nano',
              BACKEND_URL: process.env.BACKEND_URL!,
            },
            onStdout: (line) => console.log(`[python] ${line}`),
            onStderr: (line) => console.error(`[python-err] ${line}`),
          });
        } catch (cmdErr: any) {
          console.error(`[agentWorker] python crashed:`, cmdErr);
          throw cmdErr;
        }
        if (result.exitCode !== 0) {
          throw new Error(`agent_runner.py failed (exit ${result.exitCode}): ${result.stderr}`);
        }

        const outputRaw = await sandbox.files.read('/tmp/job_output.json');
        const output = JSON.parse(outputRaw);

        await query(
          `INSERT INTO agent_tasks (token_id, mission_id, output_data, success, tx_hash)
           VALUES ($1, $2, $3, $4, $5)`,
          [tokenId, missionId, JSON.stringify(output.decision), output.success, output.txHash]
        );

        if (output.messageToNext?.to_token_id) {
          const toTokenId = output.messageToNext.to_token_id;
          const nats = await getNatsClient();
          const sc = StringCodec();

          const agentMessage = {
            messageId: randomUUID(),
            fromTokenId: tokenId,
            toTokenId,
            missionId,
            payload: output.messageToNext.payload,
            timestamp: new Date().toISOString(),
          };

          nats.publish(
            `chimera.mission.${missionId}.${tokenId}.${toTokenId}`,
            sc.encode(JSON.stringify(agentMessage))
          );

          const ably = getAblyClient();
          const channel = ably.channels.get(`mission:${missionId}`);
          await channel.publish('agent-message', {
            id: randomUUID(),
            fromTokenId: tokenId,
            fromCapabilityIds: [],
            messageType: output.messageToNext?.payload?.messageType ?? 'TASK_COMPLETE',
            summary: output.decision?.reasoning ?? 'Task completed',
            txHash: output.txHash,
            timestamp: Date.now(),
          });

          await agentQueue.add('agent-task', {
            tokenId: toTokenId,
            missionId,
            missionParams,
            nextAgentTokenId: 0,
          });
        }

        await fetch(`${process.env.BACKEND_URL}/api/agents/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId, missionId, success: output.success }),
        });
      } finally {
        await sandbox.kill();
        console.log(`[agentWorker] Sandbox destroyed for job ${job.id}`);
      }
    },
    {
      connection,
      concurrency: 10,
      lockDuration: 300_000,
      stalledInterval: 60_000,
    }
  );

  worker.on('ready', () => {
    console.log('[agentWorker] Worker ready, listening for jobs...');
  });

  worker.on('failed', (job, err) => {
    console.error(`[agentWorker] Job ${job?.id} failed:`, err.message);
  });
} else {
  console.log(`[agentWorker] AGENT_MODE=${AGENT_MODE} — E2B worker disabled, queue=${QUEUE_NAME}`);
}
