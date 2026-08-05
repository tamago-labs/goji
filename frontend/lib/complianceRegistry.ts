export const COMPLIANCE_REGISTRY_ABI = [
  { type: 'function', name: 'approveIdentity', stateMutability: 'nonpayable', inputs: [{ type: 'address' }, { type: 'uint8' }, { type: 'bytes2' }, { type: 'uint64' }], outputs: [] },
  { type: 'function', name: 'isEligible', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint8' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'countryOf', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'bytes2' }] },
  { type: 'function', name: 'isEligibleForCountry', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint8' }, { type: 'bytes2' }], outputs: [{ type: 'bool' }] }
] as const

export const COMPLIANCE_REGISTRY_ADDRESS = '0x31289306250CeB6dC5Bb78A32AC2393Dab250b22' as `0x${string}`
