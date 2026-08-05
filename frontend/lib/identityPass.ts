import type { Address } from 'viem'

export const IDENTITY_PASS_ADDRESS = process.env.NEXT_PUBLIC_IDENTITY_PASS_ADDRESS as Address | undefined

export const IDENTITY_PASS_ABI = [
  { type: 'function', name: 'hasPass', stateMutability: 'view', inputs: [{ name: 'wallet', type: 'address' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'tokenIdOf', stateMutability: 'view', inputs: [{ name: 'wallet', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'passIdOf', stateMutability: 'view', inputs: [{ name: 'wallet', type: 'address' }], outputs: [{ type: 'bytes32' }] },
  { type: 'function', name: 'mint', stateMutability: 'nonpayable', inputs: [], outputs: [{ name: 'tokenId', type: 'uint256' }, { name: 'passId', type: 'bytes32' }] }
] as const
