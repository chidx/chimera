import { useReadContract, useWriteContract } from 'wagmi';

const VAULT_ADDRESS = process.env.NEXT_PUBLIC_MISSION_VAULT as `0x${string}`;

const abi = [
  {
    name: 'missions',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'missionId', type: 'uint256' }],
    outputs: [
      { name: 'client', type: 'address' },
      { name: 'agentTokenId', type: 'uint256' },
      { name: 'reward', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'metadataURI', type: 'string' },
    ],
  },
  {
    name: 'createMission',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'agentTokenId', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'metadataURI', type: 'string' },
    ],
    outputs: [{ name: 'missionId', type: 'uint256' }],
  },
  {
    name: 'completeMission',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'missionId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'cancelMission',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'missionId', type: 'uint256' }],
    outputs: [],
  },
] as const;

export function useMission(missionId: bigint) {
  return useReadContract({
    address: VAULT_ADDRESS,
    abi,
    functionName: 'missions',
    args: [missionId],
  });
}

export function useCreateMission() {
  return useWriteContract();
}

export function useCompleteMission() {
  return useWriteContract();
}

export function useCancelMission() {
  return useWriteContract();
}
