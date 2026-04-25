# chimera-ponder

[Ponder](https://ponder.sh) indexer for Chimera: indexes ChimeraRegistry, ReputationRegistry, AgentMessenger, and MissionVault on the Monad testnet (chain id `10143` per `ponder.config.ts`).

## Prerequisites

- Node.js 20+ recommended
- PostgreSQL (Ponder uses `DATABASE_URL` for its database)
- A Monad testnet RPC and deployed contract addresses

## Setup

```bash
cd ponder
cp .env.local.example .env.local
# Set MONAD_TESTNET_RPC, contract addresses, DATABASE_URL
npm install
```

## Run

**Development (indexing with dev UX):**

```bash
npm run dev
```

**Production-style:**

```bash
npm start
```

After changing the schema or config, you may need:

```bash
npm run codegen
```

## Environment

See [`.env.local.example`](./.env.local.example). `MONAD_TESTNET_RPC` and all `*_ADDRESS` values must match your deployment. `DATABASE_URL` is the Postgres connection Ponder uses.
