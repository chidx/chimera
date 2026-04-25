# chimera-contracts

Solidity contracts for Chimera (Foundry). Deployments target Monad testnet; RPC alias `monad_testnet` is defined in [`foundry.toml`](./foundry.toml).

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `cast`, `anvil`)

## Setup

```bash
cd chimera-contracts
cp .env.example .env
# Set MONAD_TESTNET_RPC, DEPLOYER_PRIVATE_KEY, DEPLOYER_ADDRESS, USDC_ADDRESS
```

`foundry.toml` references `${MONAD_TESTNET_RPC}` for the `monad_testnet` endpoint.

## Build and test

```bash
forge build
forge test
```

## Deploy

The main script is [`script/Deploy.s.sol`](./script/Deploy.s.sol). It reads `DEPLOYER_ADDRESS` and `USDC_ADDRESS` from the environment. Use your usual Foundry broadcast flow, for example:

```bash
source .env
forge script script/Deploy.s.sol:Deploy --rpc-url monad_testnet --broadcast
```

Adjust flags (e.g. `--verify`) to match your environment. **Never commit real private keys;** use `.env` locally and keep it gitignored.

## Environment

See [`.env.example`](./.env.example) for the variables the deploy script and tooling expect.
