'use client'

import { createContext, useContext, useReducer, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { NetworkArc, NetworkBase, NetworkEthereum } from '@web3icons/react'
import { ArcTestnet, BaseSepolia, EthereumSepolia } from '@circle-fin/app-kit/chains'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import { fetchBalances } from '../../lib/unified-balance'
import { useInterval } from 'usehooks-ts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Adapter = any

interface BalanceChain {
  chain: string
  balance: string
  icon: typeof NetworkArc
}

interface WalletState {
  adapter: Adapter | null
  totalBalance: string
  chains: BalanceChain[]
  loading: boolean
  connected: boolean
}

type WalletAction =
  | { type: 'SET_ADAPTER'; adapter: Adapter }
  | { type: 'SET_BALANCE'; total: string; chains: BalanceChain[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_CONNECTED'; connected: boolean }
  | { type: 'RESET' }

const initialState: WalletState = {
  adapter: null,
  totalBalance: '0.00',
  chains: [],
  loading: false,
  connected: false
}

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_ADAPTER':
      return { ...state, adapter: action.adapter }
    case 'SET_BALANCE':
      return { ...state, totalBalance: action.total, chains: action.chains, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: action.loading }
    case 'SET_CONNECTED':
      return { ...state, connected: action.connected }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

interface WalletContextType {
  state: WalletState
  dispatch: React.Dispatch<WalletAction>
}

const WalletContext = createContext<WalletContextType>({
  state: initialState,
  dispatch: () => {}
})

export function useWallet() {
  return useContext(WalletContext)
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState)
  const { isConnected, address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const totalBalanceRef = useRef('0.00')

  // Create adapter when wallet connects
  useEffect(() => {
    if (isConnected && walletClient) {
      async function createAdapter() {
        try {
          const adv = await createViemAdapterFromProvider({
            provider: walletClient as never,
            capabilities: {
              supportedChains: [ArcTestnet, BaseSepolia, EthereumSepolia]
            }
          })
          dispatch({ type: 'SET_ADAPTER', adapter: adv })
          dispatch({ type: 'SET_CONNECTED', connected: true })
        } catch (err) {
          console.error('[wallet] adapter error:', err)
        }
      }
      createAdapter()
    } else {
      dispatch({ type: 'RESET' })
    }
  }, [isConnected, walletClient, dispatch])

  // Fetch balance function
  const fetchBalance = useCallback(async () => {
    if (!state.adapter) return
    try {
      const result = await fetchBalances(state.adapter)
      dispatch({
        type: 'SET_BALANCE',
        total: result.totalConfirmed,
        chains: [
          { chain: 'Arc Testnet', balance: result.totalConfirmed, icon: NetworkArc },
          { chain: 'Base Sepolia', balance: '0.00', icon: NetworkBase },
          { chain: 'Ethereum Sepolia', balance: '0.00', icon: NetworkEthereum }
        ]
      })
      totalBalanceRef.current = result.totalConfirmed
    } catch (err) {
      console.error('[wallet] fetch error:', err)
    }
  }, [state.adapter, dispatch])

  // Poll balance: 3s if no balance, 10s if has balance
  useInterval(
    fetchBalance,
    state.connected && state.adapter
      ? totalBalanceRef.current !== '0.00' ? 10000 : 3000
      : null
  )

  return (
    <WalletContext.Provider value={{ state, dispatch }}>
      {children}
    </WalletContext.Provider>
  )
}
