// ReceivableFactory ABI - from contracts/out/ReceivableFactory.sol/ReceivableFactory.json
export const RECEIVABLE_FACTORY_ABI = [
  {
    "type": "constructor",
    "inputs": [
      { "name": "_treasury", "type": "address" },
      { "name": "_feeAmount", "type": "uint256" }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createReceivableWithCompliance",
    "inputs": [
      { "name": "name", "type": "string" },
      { "name": "receivableType", "type": "string" },
      { "name": "amount", "type": "uint256" },
      { "name": "interestRate", "type": "uint256" },
      { "name": "minInvestment", "type": "uint256" },
      { "name": "expiresAt", "type": "uint256" },
      { "name": "proofs", "type": "bytes32[]" },
      { "name": "complianceRegistry", "type": "address" },
      { "name": "requiredTier", "type": "uint8" },
      { "name": "allowedCountries", "type": "bytes2[]" }
    ],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "createReceivable",
    "inputs": [
      { "name": "name", "type": "string" },
      { "name": "receivableType", "type": "string" },
      { "name": "amount", "type": "uint256" },
      { "name": "interestRate", "type": "uint256" },
      { "name": "minInvestment", "type": "uint256" },
      { "name": "expiresAt", "type": "uint256" },
      { "name": "proofs", "type": "bytes32[]" }
    ],
    "outputs": [
      { "name": "", "type": "address" }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "setFee",
    "inputs": [
      { "name": "_feeAmount", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setTreasury",
    "inputs": [
      { "name": "_treasury", "type": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "withdrawFees",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getReceivables",
    "inputs": [
      { "name": "issuer", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "address[]" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getReceivablesCount",
    "inputs": [
      { "name": "issuer", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalValue",
    "inputs": [
      { "name": "issuer", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCollectedFees",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isReceivableToken",
    "inputs": [
      { "name": "token", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "feeAmount",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "treasury",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "address" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "address" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "collectedFees",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "ReceivableCreated",
    "inputs": [
      { "name": "token", "type": "address", "indexed": true },
      { "name": "issuer", "type": "address", "indexed": true },
      { "name": "name", "type": "string", "indexed": false },
      { "name": "amount", "type": "uint256", "indexed": false },
      { "name": "interestRate", "type": "uint256", "indexed": false },
      { "name": "expiresAt", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "FeeUpdated",
    "inputs": [
      { "name": "oldFee", "type": "uint256", "indexed": false },
      { "name": "newFee", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "TreasuryUpdated",
    "inputs": [
      { "name": "oldTreasury", "type": "address", "indexed": true },
      { "name": "newTreasury", "type": "address", "indexed": true }
    ]
  },
  {
    "type": "event",
    "name": "FeesWithdrawn",
    "inputs": [
      { "name": "treasury", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  }
] as const

export const RECEIVABLE_FACTORY_ADDRESS = '0x53F71eC10939d4aD243903B496E403B3C27784Ae'
