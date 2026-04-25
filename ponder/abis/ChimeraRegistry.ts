export const ChimeraRegistryAbi = [
  {
    type: "event",
    name: "AgentMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "agentWallet", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CapabilityGranted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "capabilityId", type: "bytes32", indexed: true },
    ],
  },
  {
    type: "event",
    name: "CapabilityRevoked",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "capabilityId", type: "bytes32", indexed: true },
    ],
  },
  {
    type: "event",
    name: "FranchiseOpened",
    inputs: [{ name: "tokenId", type: "uint256", indexed: true }],
  },
  {
    type: "function",
    name: "getAgentURI",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
] as const;
