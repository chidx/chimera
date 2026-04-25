import { createConfig } from "@ponder/core";
import { http } from "viem";

import { ChimeraRegistryAbi } from "./abis/ChimeraRegistry";
import { ReputationRegistryAbi } from "./abis/ReputationRegistry";
import { AgentMessengerAbi } from "./abis/AgentMessenger";
import { MissionVaultAbi } from "./abis/MissionVault";

export default createConfig({
  networks: {
    monad: {
      chainId: 10143,
      transport: http(process.env.MONAD_TESTNET_RPC),
    },
  },
  contracts: {
    ChimeraRegistry: {
      network: "monad",
      abi: ChimeraRegistryAbi,
      address: process.env.CHIMERA_REGISTRY_ADDRESS as `0x${string}`,
      startBlock: 27706000, // Redeploy Apr-25-2026 (block of first Create tx, chain 10143)
    },
    ReputationRegistry: {
      network: "monad",
      abi: ReputationRegistryAbi,
      address: process.env.REPUTATION_REGISTRY_ADDRESS as `0x${string}`,
      startBlock: 27707600,
    },
    AgentMessenger: {
      network: "monad",
      abi: AgentMessengerAbi,
      address: process.env.AGENT_MESSENGER_ADDRESS as `0x${string}`,
      startBlock: 27707600,
    },
    MissionVault: {
      network: "monad",
      abi: MissionVaultAbi,
      address: process.env.MISSION_VAULT_ADDRESS as `0x${string}`,
      startBlock: 27707600,
    },
  },
});
