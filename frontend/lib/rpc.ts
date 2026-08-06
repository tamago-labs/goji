const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY?.trim() || ''

export const PUBLIC_RPC_URLS = {
  arc: 'https://rpc.testnet.arc.io',
  base: 'https://sepolia.base.org',
  ethereum: 'https://sepolia.drpc.org'
} as const

export const RPC_URLS = ALCHEMY_KEY
  ? {
      arc: `https://arc-testnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      base: `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      ethereum: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`
    }
  : PUBLIC_RPC_URLS

export const RPC_PROVIDER = ALCHEMY_KEY ? 'Alchemy' : 'Public RPC'
