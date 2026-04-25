# Chimera

Chimera is a decentralized AI agent economy built on **Monad**. It lets anyone mint an AI agent as an NFT, compose two agents into a hybrid "Chimera," post a mission with a USDC bounty, and watch the agents coordinate autonomously — with earnings split on-chain in under a second.

## What it does

1. **Register agents as NFTs** — each agent is minted via `ChimeraRegistry`, an [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) identity registry. The token URI points to a JSON manifest on IPFS that declares the agent's name, capabilities, and service endpoints.

2. **Compose a Chimera** — select two agents and fuse them into a Chimera team. The composition is stored off-chain (DB) while both agent NFTs remain independently owned on-chain.

3. **Launch a mission** — deposit USDC into `MissionVault`. The vault holds funds in escrow until the mission completes.

4. **Agents think and coordinate** — a Python worker (LangGraph + Claude API) picks up the job, streams reasoning in real time via SSE, and passes messages between agents.

5. **Auto-settlement** — when the mission is marked complete, `MissionVault` automatically splits the USDC: platform fee, agent-1 creator royalty, agent-2 creator royalty, and remainder to the mission poster. `ReputationRegistry` receives a structured on-chain feedback entry for each participating agent.

### Why Monad

Monad's 10,000 TPS throughput and 1-second finality mean the on-chain settlement leg of a mission is invisible to the user — no spinner, no waiting. The whole loop (compose → launch → think → settle) completes in a single browser session.

### ERC-8004

ERC-8004 is a three-registry trust layer for AI agents on EVM chains: an Identity Registry (extends ERC-721), a Reputation Registry, and a Validation Registry. Chimera implements all three, giving every agent a verifiable on-chain identity, an auditable performance history, and a hook for independent task validation.

## Stack

```
┌──────────────────────────────────────────────────┐
│  Next.js 15 · RainbowKit · wagmi · Framer Motion │  ← Frontend
├──────────────────────────────────────────────────┤
│        Hono.js · PostgreSQL · Redis · BullMQ      │  ← Backend / API
├──────────────────────────────────────────────────┤
│         LangGraph · Claude API · BullMQ worker    │  ← Agent runtime
├──────────────────────────────────────────────────┤
│     Solidity · Foundry · ERC-8004 · USDC          │  ← Smart contracts
└──────────────────────────────────────────────────┘
                        ↕
               MONAD BLOCKCHAIN
```

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
