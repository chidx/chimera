export const MissionVaultAbi = [
  {
    type: "event",
    name: "MissionCreated",
    inputs: [
      { name: "missionId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "budget", type: "uint128", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MissionCompleted",
    inputs: [
      { name: "missionId", type: "uint256", indexed: true },
      { name: "earned", type: "uint128", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MissionCancelled",
    inputs: [
      { name: "missionId", type: "uint256", indexed: true },
    ],
  },
] as const;
