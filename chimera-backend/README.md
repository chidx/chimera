# chimera-backend

Hono API server for Chimera: agents, auth, capabilities, leaderboard, marketplace, and missions. Optional BullMQ worker process talks to Redis and the agent stack.

## Prerequisites

- Node.js 20+ (recommended)
- [PostgreSQL](https://www.postgresql.org/), [Redis](https://redis.io/), and [NATS](https://nats.io/) reachable from this machine (local or Docker) when using features that need them

## Setup

```bash
cd chimera-backend
cp .env.example .env
# Edit .env: DATABASE_URL, REDIS_URL, NATS_URL, contract addresses, API keys, etc.
npm install
```

`PORT` defaults to `3000` if unset (`src/index.ts`). If you use another port, set it in `.env` and point other services (frontend, `chimera-agents`) at the same base URL.

## Run

**API (development, with reload):**

```bash
npm run dev
```

**Background worker (BullMQ + agent jobs):** run in a second terminal if you use queued agent work.

```bash
npm run worker
```

Health check: `GET http://localhost:<PORT>/health` (use your `PORT` from `.env`).

## Environment

See [`.env.example`](./.env.example) for all variables. At minimum, configure database, Redis, and any features you use (Pinata, Ably, E2B, OpenAI, chain RPC, deployed contract addresses).
