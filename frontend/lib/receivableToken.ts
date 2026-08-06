// ReceivableToken ABI - from contracts/src/ReceivableToken.sol
export const RECEIVABLE_TOKEN_ABI = [
  // Write functions
  {
    "type": "function",
    "name": "finance",
    "inputs": [],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "claimRepayment",
    "inputs": [],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "redeem",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  // View functions - Token info
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "symbol",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalSupply",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "account", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  // View functions - Receivable info
  {
    "type": "function",
    "name": "receivableType",
    "inputs": [],
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "issuer",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalReceivable",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "interestRate",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "minInvestment",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "maxSupply",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "issuedAt",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "expiresAt",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "fundedAmount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalRedeemable",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "status",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view"
  },
  // View functions - Pro-rata interest
  {
    "type": "function",
    "name": "fundingDate",
    "inputs": [{ "name": "", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "investedAmount",
    "inputs": [{ "name": "", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  // View functions - Calculations
  {
    "type": "function",
    "name": "calculateShare",
    "inputs": [{ "name": "investor", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "calculateInvestorInterest",
    "inputs": [{ "name": "investor", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalInterest",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalRepayment",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProofCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProofHashes",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bytes32[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "complianceRegistry",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "requiredComplianceTier",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAllowedCountries",
    "inputs": [],
    "outputs": [{ "name": "", "type": "bytes2[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getReceivableInfo",
    "inputs": [],
    "outputs": [
      { "name": "_type", "type": "string" },
      { "name": "_issuer", "type": "address" },
      { "name": "_totalReceivable", "type": "uint256" },
      { "name": "_interestRate", "type": "uint256" },
      { "name": "_minInvestment", "type": "uint256" },
      { "name": "_issuedAt", "type": "uint256" },
      { "name": "_expiresAt", "type": "uint256" },
      { "name": "_fundedAmount", "type": "uint256" },
      { "name": "_status", "type": "uint8" }
    ],
    "stateMutability": "view"
  },
  // Events
  {
    "type": "event",
    "name": "ReceivableFunded",
    "inputs": [
      { "name": "investor", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false },
      { "name": "tokens", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "RepaymentClaimed",
    "inputs": [
      { "name": "company", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "Redeemed",
    "inputs": [
      { "name": "investor", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  }
] as const

// Token status enum
export const TokenStatus = {
  Active: 0,
  Funded: 1,
  Expired: 2,
  Redeemed: 3,
  Defaulted: 4
} as const

export type TokenStatusType = typeof TokenStatus[keyof typeof TokenStatus]

export function getTokenStatusLabel(status: number): string {
  switch (status) {
    case 0: return 'Active'
    case 1: return 'Funded'
    case 2: return 'Expired'
    case 3: return 'Redeemed'
    case 4: return 'Defaulted'
    default: return 'Unknown'
  }
}

export function getTokenStatusColor(status: number): string {
  switch (status) {
    case 0: return 'bg-blue-100 text-blue-700'
    case 1: return 'bg-mint/15 text-[#1B7A50]'
    case 2: return 'bg-amber-100 text-amber-700'
    case 3: return 'bg-mint/15 text-[#1B7A50]'
    case 4: return 'bg-coral/15 text-coral'
    default: return 'bg-ink/10 text-ink/50'
  }
}
