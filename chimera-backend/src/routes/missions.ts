import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  createWalletClient,
  createPublicClient,
  http,
  defineChain,
  decodeEventLog,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { query } from '../lib/db';
import { requireAuth } from '../middleware/auth';
import { agentQueue } from '../lib/agentQueue';

// -----------------------------------------------------------------------
// Chain
// -----------------------------------------------------------------------

const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
});

// -----------------------------------------------------------------------
// Viem clients (lazy-initialised so env is read at runtime)
// -----------------------------------------------------------------------

function getClients() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY as Hex | undefined;
  if (!privateKey) throw new Error('DEPLOYER_PRIVATE_KEY not set');

  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });

  return { walletClient, publicClient, account };
}

// -----------------------------------------------------------------------
// MissionVault ABI (only the functions / events we need)
// -----------------------------------------------------------------------

const missionVaultAbi = [
  {
    type: 'function',
    name: 'createMission',
    inputs: [
      { name: 'budget', type: 'uint128' },
      { name: 'agentTokenIds', type: 'uint256[]' },
      { name: 'agentCreators', type: 'address[]' },
      { name: 'royaltyBps', type: 'uint16[]' },
    ],
    outputs: [{ name: 'missionId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'completeMission',
    inputs: [
      { name: 'missionId', type: 'uint256' },
      { name: 'totalEarned', type: 'uint128' },
      { name: 'agentScores', type: 'uint8[]' },
      { name: 'taskRef', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'MissionCreated',
    inputs: [
      { name: 'missionId', type: 'uint256', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'budget', type: 'uint128', indexed: false },
    ],
  },
] as const;

// -----------------------------------------------------------------------
// onlyOwner middleware — caller must be the DEPLOYER_ADDRESS
// -----------------------------------------------------------------------

const onlyOwner = requireAuth; // re-use auth, then gate below in handler

function assertDeployer(wallet: string): boolean {
  const deployer = process.env.DEPLOYER_ADDRESS?.toLowerCase();
  return !!deployer && wallet.toLowerCase() === deployer;
}

// -----------------------------------------------------------------------
// Router
// -----------------------------------------------------------------------

const missions = new Hono();

// POST / — create a new mission
const createMissionSchema = z.object({
  budget: z.string(),
  agentTokenIds: z.array(z.number().int().nonnegative()),
  agentCreators: z.array(z.string().regex(/^0x[0-9a-fA-F]{40}$/)),
  royaltyBps: z.array(z.number().int().min(0).max(10000)),
  missionParams: z.record(z.string(), z.unknown()),
});

missions.post('/', requireAuth, zValidator('json', createMissionSchema), async (c) => {
  const { budget, agentTokenIds, agentCreators, royaltyBps, missionParams } =
    c.req.valid('json');

  if (agentCreators.length !== royaltyBps.length) {
    return c.json({ error: 'agentCreators and royaltyBps must have the same length' }, 400);
  }

  const totalRoyaltyBps = royaltyBps.reduce((sum, bps) => sum + bps, 0);
  if (totalRoyaltyBps > 5000) {
    return c.json({ error: 'sum(royaltyBps) must not exceed 5000 (50%)' }, 400);
  }

  const contractAddress = process.env.MISSION_VAULT_ADDRESS as Hex | undefined;
  if (!contractAddress) {
    return c.json({ error: 'MISSION_VAULT_ADDRESS not configured' }, 500);
  }

  const { walletClient, publicClient } = getClients();

  const txHash = await walletClient.writeContract({
    address: contractAddress,
    abi: missionVaultAbi,
    functionName: 'createMission',
    args: [
      BigInt(budget),
      agentTokenIds.map(BigInt),
      agentCreators as Hex[],
      royaltyBps.map((bps) => bps as number),
    ],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  // Parse missionId from the MissionCreated event log
  let missionId: bigint | undefined;
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: missionVaultAbi,
        eventName: 'MissionCreated',
        topics: log.topics,
        data: log.data,
      });
      missionId = decoded.args.missionId;
      break;
    } catch {
      // not the event we're looking for
    }
  }

  if (missionId === undefined) {
    return c.json({ error: 'Could not parse missionId from transaction receipt' }, 500);
  }

  const missionIdStr = missionId.toString();

  await query(
    `INSERT INTO missions (id, budget, agent_token_ids, agent_creators, royalty_bps, mission_params, status, tx_hash, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, NOW())`,
    [
      missionIdStr,
      budget,
      agentTokenIds,
      agentCreators,
      royaltyBps,
      JSON.stringify(missionParams),
      txHash,
    ]
  );

  await agentQueue.add('agent-task', {
    tokenId: agentTokenIds[0],
    missionId: missionIdStr,
    missionParams,
    nextAgentTokenId: agentTokenIds[1] ?? 0,
  });

  return c.json({ missionId: missionIdStr, txHash }, 201);
});

// GET /:id — fetch mission record
missions.get('/:id', async (c) => {
  const id = c.req.param('id');

  const rows = await query<{
    id: string;
    budget: string;
    agent_token_ids: number[];
    agent_creators: string[];
    royalty_bps: number[];
    mission_params: object;
    status: string;
    tx_hash: string;
    created_at: string;
  }>('SELECT * FROM missions WHERE id = $1', [id]);

  if (rows.length === 0) {
    return c.json({ error: 'Mission not found' }, 404);
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const m = rows[0]!;
  return c.json({
    id: m.id,
    budget: m.budget,
    agentTokenIds: m.agent_token_ids,
    agentCreators: m.agent_creators,
    royaltyBps: m.royalty_bps,
    missionParams: m.mission_params,
    status: m.status,
    txHash: m.tx_hash,
    createdAt: m.created_at,
  });
});

// GET /:id/context — SENSE step endpoint for agent_runner.py
missions.get('/:id/context', async (c) => {
  const id = c.req.param('id');

  const rows = await query<{ mission_params: object }>(
    'SELECT mission_params FROM missions WHERE id = $1',
    [id]
  );

  if (rows.length === 0) {
    return c.json({ error: 'Mission not found' }, 404);
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return c.json({
    missionParams: rows[0]!.mission_params,
    timestamp: Date.now(),
  });
});

// GET /:id/messages — message log for a mission
missions.get('/:id/messages', async (c) => {
  const id = c.req.param('id');

  const rows = await query<{
    id: string;
    mission_id: string;
    from_token_id: string;
    to_token_id: string;
    payload: object;
    timestamp: string;
  }>('SELECT * FROM message_logs WHERE mission_id = $1 ORDER BY timestamp DESC', [id]);

  return c.json(rows);
});

// POST /:id/complete — onlyOwner (DEPLOYER_ADDRESS)
const completeMissionSchema = z.object({
  totalEarned: z.string(),
  agentScores: z.array(z.number().int().min(0).max(255)),
});

missions.post(
  '/:id/complete',
  onlyOwner,
  zValidator('json', completeMissionSchema),
  async (c) => {
    const wallet = c.get('wallet') as string;
    if (!assertDeployer(wallet)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const id = c.req.param('id');
    const { totalEarned, agentScores } = c.req.valid('json');

    const contractAddress = process.env.MISSION_VAULT_ADDRESS as Hex | undefined;
    if (!contractAddress) {
      return c.json({ error: 'MISSION_VAULT_ADDRESS not configured' }, 500);
    }

    // taskRef: bytes32 derived from missionId
    const taskRef = ('0x' + BigInt(id).toString(16).padStart(64, '0')) as Hex;

    const { walletClient } = getClients();

    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: missionVaultAbi,
      functionName: 'completeMission',
      args: [BigInt(id), BigInt(totalEarned), agentScores, taskRef],
    });

    return c.json({ txHash });
  }
);

export default missions;
