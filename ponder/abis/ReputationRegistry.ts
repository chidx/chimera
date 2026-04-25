export const ReputationRegistryAbi = [
  {
    type: "event",
    name: "FeedbackSubmitted",
    inputs: [
      { name: "agentTokenId", type: "uint256", indexed: true },
      { name: "submitter", type: "address", indexed: true },
      { name: "score", type: "uint8", indexed: false },
      { name: "taskRef", type: "bytes32", indexed: false },
      { name: "evidenceURI", type: "string", indexed: false },
    ],
  },
] as const;
