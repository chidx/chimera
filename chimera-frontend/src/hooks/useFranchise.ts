import { useReadContract, useWriteContract } from 'wagmi';

const FRANCHISE_ADDRESS = process.env.NEXT_PUBLIC_FRANCHISE_LICENSE as `0x${string}`;

const abi = [
  {
    name: 'terms',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'fee', type: 'uint256' },
      { name: 'maxLicensees', type: 'uint256' },
      { name: 'activeLicensees', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    name: 'licenses',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'licensee', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'purchaseLicense',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },
] as const;

export function useFranchiseTerms(tokenId: number) {
  return useReadContract({
    address: FRANCHISE_ADDRESS,
    abi,
    functionName: 'terms',
    args: [BigInt(tokenId)],
  });
}

export function useHasLicense(address: string, tokenId: number) {
  return useReadContract({
    address: FRANCHISE_ADDRESS,
    abi,
    functionName: 'licenses',
    args: [address as `0x${string}`, BigInt(tokenId)],
  });
}

export function usePurchaseLicense() {
  return useWriteContract();
}
