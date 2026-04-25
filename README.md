# Chimera

Monorepo for the Chimera stack: on-chain contracts, indexer, API, agent workers, and web app.

## Packages

| Directory | Role | Details |
|-----------|------|---------|
| [`chimera-contracts/`](./chimera-contracts/) | Solidity (Foundry) | Build, test, deploy |
| [`ponder/`](./ponder/) | On-chain indexer (Ponder) | Index events to Postgres |
| [`chimera-backend/`](./chimera-backend/) | REST API (Hono) | Core backend and optional worker |
| [`chimera-agents/`](./chimera-agents/) | Python agent worker | BullMQ / LangGraph jobs |
| [`chimera-frontend/`](./chimera-frontend/) | Web UI (Next.js) | Browser client |

Each folder has its own README with setup and run commands.

## Local infrastructure (Docker)

Postgres (with pgvector), Redis, NATS, and Adminer are defined in [`docker-compose.yml`](./docker-compose.yml).

```bash
docker compose up -d
```

- **PostgreSQL:** `localhost:5432`, database `chimera`, user/password `chimera` / `chimera` (match `DATABASE_URL` in app `.env` files if you use these defaults).
- **Redis:** `localhost:6379`
- **NATS:** `4222` (client), `8222` (HTTP monitoring when using the compose command)
- **Adminer:** [http://localhost:8080](http://localhost:8080) (DB UI)

Stop and remove containers: `docker compose down` (add `-v` to drop the named volume and reset Postgres data).

## Typical flow

1. Start infrastructure: `docker compose up -d`
2. Configure and run [`chimera-contracts`](./chimera-contracts/) if you need a fresh deploy; copy addresses into backend, Ponder, and frontend env files
3. Run [`ponder`](./ponder/), [`chimera-backend`](./chimera-backend/), [`chimera-agents`](./chimera-agents/) (if you use the queue), and [`chimera-frontend`](./chimera-frontend/) as described in each README

Align `PORT` / `BACKEND_URL` / `NEXT_PUBLIC_API_URL` across backend, agents, and frontend so every service points at the same API base URL.
