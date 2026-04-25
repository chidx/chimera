# chimera-agents

Python worker that polls Redis for BullMQ-style agent jobs, runs the LangGraph flow in [`agents/agent_runner.py`](./agents/agent_runner.py), and writes results to PostgreSQL. The backend can enqueue work; this process consumes it.

## Prerequisites

- Python 3.11+ recommended
- Same PostgreSQL and Redis as [`chimera-backend`](../chimera-backend) (see that package’s `.env.example` for typical URLs)
- OpenAI and related keys if your graph uses them

## Setup

```bash
cd chimera-agents
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: BACKEND_URL must match chimera-backend host/port, DATABASE_URL, REDIS_URL, OPENAI_*
```

## Run

From the `chimera-agents` directory:

```bash
python worker/agent_worker.py
```

Ensure Redis has the expected queue (see `AGENT_QUEUE_NAME` in the worker, default `agent-tasks-local`) and that `chimera-backend` is up if the agent needs API calls via `BACKEND_URL`.

## Environment

See [`.env.example`](./.env.example). `BACKEND_URL` must match the URL where [`chimera-backend`](../chimera-backend) is listening (including port).
