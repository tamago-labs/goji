export const RECEIVABLE_POOL_ABI = [
  { type: 'function', name: 'name', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'owner', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'complianceRegistry', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'requiredComplianceTier', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'targetApyBps', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'depositsOpen', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'redemptionsOpen', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'receivableCount', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'allowedCountries', stateMutability: 'view', inputs: [{ type: 'bytes2' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'getReceivables', stateMutability: 'view', inputs: [], outputs: [{ type: 'address[]' }] },
  { type: 'function', name: 'deposit', stateMutability: 'payable', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'addReceivable', stateMutability: 'nonpayable', inputs: [{ type: 'address' }], outputs: [] },
  { type: 'function', name: 'removeReceivable', stateMutability: 'nonpayable', inputs: [{ type: 'address' }], outputs: [] },
  { type: 'function', name: 'setAllowedCountry', stateMutability: 'nonpayable', inputs: [{ type: 'bytes2' }, { type: 'bool' }], outputs: [] },
  { type: 'function', name: 'setPoolPolicy', stateMutability: 'nonpayable', inputs: [{ type: 'uint256' }, { type: 'string' }], outputs: [] },
  { type: 'function', name: 'closeDeposits', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'openRedemptions', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'redeem', stateMutability: 'nonpayable', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'totalSupply', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }
] as const

export const RECEIVABLE_POOL_FACTORY_ABI = [
  { type: 'function', name: 'getPools', stateMutability: 'view', inputs: [], outputs: [{ type: 'address[]' }] },
  { type: 'function', name: 'getPoolsByManager', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'address[]' }] },
  { type: 'function', name: 'createPool', stateMutability: 'nonpayable', inputs: [{ type: 'string' }, { type: 'string' }, { type: 'address' }, { type: 'uint8' }], outputs: [{ type: 'address' }] }
] as const

export const RECEIVABLE_POOL_FACTORY_ADDRESS = '0xc4d91B769f0bD8aF2BF7F02862Cd233e62C139d4' as `0x${string}`
