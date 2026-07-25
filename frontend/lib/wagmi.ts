import { arcTestnet, baseSepolia, sepolia } from 'viem/chains'
import { http, createConfig, injected } from 'wagmi'
// import { getDefaultConfig } from '@rainbow-me/rainbowkit'

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_KEY || ''


// export const config = getDefaultConfig({
//   appName: 'Goji',
//   projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
//   chains: [arcTestnet, baseSepolia, sepolia],
//   transports: {
//     [arcTestnet.id]: http(`https://arc-testnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
//     [baseSepolia.id]: http(`https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`),
//     [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`)
//   },
//   ssr: true
// })


export const config = createConfig({
  chains: [arcTestnet, baseSepolia, sepolia],
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: http(`https://arc-testnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    [baseSepolia.id]: http(`https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`)
  },
  ssr: true
})
