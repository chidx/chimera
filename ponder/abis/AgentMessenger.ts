export const AgentMessengerAbi = [
  {
    type: "event",
    name: "AgentMessageLogged",
    inputs: [
      { name: "logId", type: "uint256", indexed: true },
      { name: "missionId", type: "uint32", indexed: true },
      { name: "fromTokenId", type: "uint32", indexed: true },
      { name: "toTokenId", type: "uint32", indexed: false },
      { name: "messageType", type: "string", indexed: false },
      { name: "payloadHash", type: "bytes32", indexed: false },
      { name: "timestamp", type: "uint32", indexed: false },
    ],
  },
] as const;
