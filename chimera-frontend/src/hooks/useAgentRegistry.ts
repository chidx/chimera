import { useReadContract } from 'wagmi';

const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_CHIMERA_REGISTRY as `0x${string}`;

const abi = [
  {
    name: 'agentWalletOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'capabilitiesOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'bytes32[]' }],
  },
  {
    name: 'hasCapability',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'capabilityId', type: 'bytes32' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'agents',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'wallet', type: 'address' },
      { name: 'metadataURI', type: 'string' },
      { name: 'active', type: 'bool' },
    ],
  },
] as const;

export function useAgentWallet(tokenId: number) {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi,
    functionName: 'agentWalletOf',
    args: [BigInt(tokenId)],
  });
}

export function useAgentCapabilities(tokenId: number) {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi,
    functionName: 'capabilitiesOf',
    args: [BigInt(tokenId)],
  });
}

export function useHasCapability(tokenId: number, capabilityId: `0x${string}`) {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi,
    functionName: 'hasCapability',
    args: [BigInt(tokenId), capabilityId as `0x${string}` & { length: 66 }],
  });
}

export function useAgent(tokenId: number) {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi,
    functionName: 'agents',
    args: [BigInt(tokenId)],
  });
}
