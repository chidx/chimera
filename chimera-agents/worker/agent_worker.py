"""
Python BullMQ-compatible agent worker.

Polls the Redis `bull:agent-tasks:wait` list for jobs, runs the LangGraph
agent via agent_runner, then writes results to PostgreSQL.

Usage:
    cd chimera-agents && python worker/agent_worker.py
"""

import json
import logging
import os
import sys
from pathlib import Path

import psycopg2
import redis as redis_lib
from dotenv import load_dotenv

# Allow importing from the parent package (chimera-agents/)
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from agents.agent_runner import agent_runner, AgentState  # noqa: E402

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://chimera:chimera@localhost:5432/chimera")
QUEUE_NAME = os.getenv("AGENT_QUEUE_NAME", "agent-tasks-local")
QUEUE_WAIT_KEY = f"bull:{QUEUE_NAME}:wait"
QUEUE_ACTIVE_KEY = f"bull:{QUEUE_NAME}:active"

r = redis_lib.from_url(REDIS_URL, decode_responses=True)
db_conn = psycopg2.connect(DATABASE_URL)
db_conn.autocommit = True


def _parse_job(raw: str) -> dict:
    """Parse a job payload.

    BullMQ stores job IDs in the wait list; the full job is at
    `bull:agent-tasks:{id}` as a hash.  For the simple test-push case
    (where the full JSON is pushed directly into the list) we fall back to
    treating the raw value as the job data.
    """
    data = json.loads(raw)

    # Standard BullMQ: the list contains a numeric job ID string
    if isinstance(data, (int, str)) and str(data).isdigit():
        job_hash = r.hgetall(f"bull:agent-tasks:{data}")
        if job_hash and "data" in job_hash:
            return json.loads(job_hash["data"])
        log.warning("Could not find job hash for id=%s", data)
        return {}

    # Non-standard / test push: the full job object is in the list
    # Accept both `{"tokenId": 1, ...}` and `{"name": "...", "data": {...}}`
    if "data" in data and isinstance(data["data"], dict):
        return data["data"]
    return data


def _run_agent(job: dict) -> dict:
    token_id = int(job.get("tokenId", 0))
    mission_id = str(job.get("missionId", ""))
    mission_params = job.get("missionParams") or {}
    next_agent_token_id = int(job.get("nextAgentTokenId", 0))

    log.info("Running agent: tokenId=%s missionId=%s", token_id, mission_id)

    initial_state: AgentState = {
        "token_id": token_id,
        "mission_id": mission_id,
        "mission_params": mission_params,
        "next_agent_token_id": next_agent_token_id,
        "agent_wallet": "",
        "capability_labels": [],
        "capability_descriptions": [],
        "on_chain_data": {},
        "analysis": "",
        "decision": {},
        "message_to_next": {},
        "tx_hash": "",
        "task_complete": False,
    }

    return agent_runner.invoke(initial_state)


def _persist_result(job: dict, result: dict) -> None:
    token_id = int(job.get("tokenId", 0))
    mission_id = str(job.get("missionId", ""))
    tx_hash = result.get("tx_hash") or None

    with db_conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO agent_tasks (token_id, mission_id, output_data, success, tx_hash)
            VALUES (%s, %s, %s, %s, %s)
            """,
            [
                token_id,
                mission_id,
                json.dumps(result.get("decision", {})),
                result.get("task_complete", False),
                tx_hash,
            ],
        )
    log.info(
        "Persisted result: tokenId=%s missionId=%s success=%s",
        token_id,
        mission_id,
        result.get("task_complete"),
    )


def main() -> None:
    log.info("Python agent worker started (local mode) — listening on %s", QUEUE_WAIT_KEY)
    while True:
        try:
            # Block up to 5 s waiting for a job, then loop (allows clean Ctrl-C)
            item = r.brpoplpush(QUEUE_WAIT_KEY, QUEUE_ACTIVE_KEY, timeout=5)
            if item is None:
                continue

            try:
                job = _parse_job(item)
            except (json.JSONDecodeError, Exception) as exc:
                log.error("Failed to parse job payload: %s — raw: %.200s", exc, item)
                continue

            if not job:
                log.warning("Empty job payload, skipping")
                continue

            result = _run_agent(job)
            _persist_result(job, result)

            # Remove from active list once done
            r.lrem(QUEUE_ACTIVE_KEY, 1, item)

        except KeyboardInterrupt:
            log.info("Worker stopped by user")
            break
        except Exception as exc:
            log.error("Unhandled error processing job: %s", exc, exc_info=True)


if __name__ == "__main__":
    main()
