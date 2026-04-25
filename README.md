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

## Deployed Contracts (Monad Testnet)

| Contract | Address |
|----------|---------|
| ChimeraRegistry (proxy) | `0x704ed0b93aE2f62A8186Cd0DF7E2900AB28EC722` |
| ReputationRegistry (proxy) | `0x18f9577C0588E1a94b518C0BEE431BD92C106a71` |
| ValidationRegistry (proxy) | `0x07d8B64BbC600eA8960FAec393448E36309781dC` |
| MissionVault (proxy) | `0xd18c7d7d750324775B288d4C3451165109FFECA6` |
| FranchiseLicense (proxy) | `0xC23f571611d0e5E6481e93e6CEA7EbA9a2F26091` |
| AgentComposer (proxy) | `0x4Fd923620866Ee5377Cb072Fd8A2C449a397b264` |
| AgentMessenger (proxy) | `0x6831062bb9c1FDFcB5B4618cf1462041178B8197` |
| USDC | `0x534b2f3A21130d7a60830c2Df862319e593943A3` |

All contracts are upgradeable proxies (ERC-1967) deployed via `forge script script/Deploy.s.sol:Deploy`.

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

## How to run

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Docker](https://docs.docker.com/get-docker/) | any recent | Postgres, Redis, NATS |
| [Node.js](https://nodejs.org/) | 20+ | Backend, frontend, Ponder |
| [Foundry](https://book.getfoundry.sh/getting-started/installation) | latest | Contract build & deploy |
| [Python](https://www.python.org/) | 3.11+ | Agent worker |

---

### 1. Start infrastructure

```bash
docker compose up -d
```

| Service | Address | Notes |
|---------|---------|-------|
| PostgreSQL | `localhost:5432` | db/user/pass all `chimera` |
| Redis | `localhost:6379` | BullMQ queues |
| NATS | `localhost:4222` | client · `8222` HTTP monitoring |
| Adminer | [http://localhost:8080](http://localhost:8080) | DB UI |

Stop: `docker compose down` (add `-v` to wipe Postgres data).

---

### 2. Deploy contracts (Monad testnet)

```bash
cd chimera-contracts
cp .env.example .env          # fill MONAD_TESTNET_RPC, DEPLOYER_PRIVATE_KEY, USDC_ADDRESS
forge build
forge script script/Deploy.s.sol:Deploy --rpc-url monad_testnet --broadcast
```

Copy the deployed `ChimeraRegistry` and `MissionVault` addresses into the `.env` files of `chimera-backend`, `ponder`, and `chimera-frontend`.

---

### 3. Backend API

```bash
cd chimera-backend
cp .env.example .env          # fill DATABASE_URL, REDIS_URL, contract addresses, API keys
npm install
npm run dev                   # API on http://localhost:3000
```

To run the BullMQ worker in a second terminal:

```bash
npm run worker
```

Health check: `GET http://localhost:3000/health`

---

### 4. Agent worker (Python)

```bash
cd chimera-agents
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # fill BACKEND_URL, DATABASE_URL, REDIS_URL, ANTHROPIC_API_KEY
python worker/agent_worker.py
```

`BACKEND_URL` must point at the running `chimera-backend` instance.

---

### 5. Ponder indexer (optional)

Ponder watches on-chain events and writes indexed data to Postgres. Skip this step if you use direct DB writes from the backend instead.

```bash
cd ponder
cp .env.local.example .env.local   # fill MONAD_TESTNET_RPC, contract addresses, DATABASE_URL
npm install
npm run dev
```

---

### 6. Frontend

```bash
cd chimera-frontend
cp .env.local.example .env.local   # fill NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WALLETCONNECT_ID, NEXT_PUBLIC_ABLY_KEY
npm install
npm run dev                         # UI on http://localhost:3001
```

`NEXT_PUBLIC_API_URL` must match the URL where `chimera-backend` is listening (e.g. `http://localhost:3000`).

---

### Port reference

| Service | Default port |
|---------|-------------|
| chimera-backend | `3000` |
| chimera-frontend | `3001` |
| Ponder | `42069` |
| PostgreSQL | `5432` |
| Redis | `6379` |
| NATS | `4222` |
| Adminer | `8080` |
