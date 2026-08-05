import { arcTestnet, baseSepolia, sepolia } from 'viem/chains'
import { http, createConfig, injected } from 'wagmi'
import { RPC_URLS } from './rpc'

export const config = createConfig({
  chains: [arcTestnet, baseSepolia, sepolia],
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: http(RPC_URLS.arc),
    [baseSepolia.id]: http(RPC_URLS.base),
    [sepolia.id]: http(RPC_URLS.ethereum)
  },
  ssr: true
})
