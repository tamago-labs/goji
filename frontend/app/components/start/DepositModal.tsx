'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { NetworkArc, NetworkBase, NetworkEthereum } from '@web3icons/react'
import { depositToUnified, withdrawFromUnified } from '../../../lib/unified-balance'
import { ArcTestnet, BaseSepolia, EthereumSepolia } from '@circle-fin/app-kit/chains'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'

const chains = [
  { id: 'Arc_Testnet', label: 'Arc Testnet', icon: NetworkArc, decimals: 18, chainId: 5042002 },
  { id: 'Base_Sepolia', label: 'Base Sepolia', icon: NetworkBase, decimals: 6, chainId: 84532 },
  { id: 'Ethereum_Sepolia', label: 'Ethereum Sepolia', icon: NetworkEthereum, decimals: 6, chainId: 11155111 }
]

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  unifiedBalance?: string
}

export default function DepositModal({ isOpen, onClose, unifiedBalance = '0.00' }: DepositModalProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [selectedChain, setSelectedChain] = useState(chains[0])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState('0.00')
  const { address } = useAccount()
  const walletClient = useWalletClient()
  const publicClient = usePublicClient()
  const [adapter, setAdapter] = useState<unknown>(null)
  const adapterCreatedRef = useRef(false)
  const balanceFetchedRef = useRef<string>('')

  // Create adapter when modal opens (only once)
  useEffect(() => {
    if (!isOpen || !walletClient.data || !address || adapterCreatedRef.current) return
    adapterCreatedRef.current = true
    async function createAdapter() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adv = await createViemAdapterFromProvider({
          provider: walletClient.data as never,
          capabilities: {
            supportedChains: [ArcTestnet, BaseSepolia, EthereumSepolia]
          }
        }) as any
        setAdapter(adv)
      } catch (err) {
        console.error('[modal] adapter creation error:', err)
      }
    }
    createAdapter()
  }, [isOpen, walletClient.data, address])

  // Fetch wallet balance when chain changes (with dedup)
  useEffect(() => {
    if (!publicClient || !address || !isOpen) return
    const fetchKey = `${address}-${selectedChain.chainId}`
    if (balanceFetchedRef.current === fetchKey) return
    balanceFetchedRef.current = fetchKey

    async function fetchWalletBalance() {
      try {
        const connectedChainId = publicClient?.chain?.id
        if (connectedChainId !== selectedChain.chainId) {
          setWalletBalance('0.00')
          return
        }
        const balance = await publicClient!.getBalance({ address: address as `0x${string}` })
        const decimals = selectedChain.decimals
        const walletBalance = Number(balance) / Math.pow(10, decimals)
        setWalletBalance(walletBalance.toFixed(6))
      } catch (err) {
        console.error('[modal] wallet balance error:', err)
        setWalletBalance('0.00')
      }
    }
    fetchWalletBalance()
  }, [publicClient, address, selectedChain, isOpen])

  // Reset balance fetch ref when chain changes
  useEffect(() => {
    balanceFetchedRef.current = ''
  }, [selectedChain])

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0 || !adapter) return
    setLoading(true)
    setError(null)

    try {
      const result = await depositToUnified(adapter, selectedChain.id, amount)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setAmount('')
          onClose()
        }, 2000)
      } else {
        setError(result.error || 'Deposit failed')
      }
    } catch (err) {
      setError((err as Error).message || 'Deposit failed')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    console.log('[withdraw] selectedChain:', selectedChain, 'amount:', amount, 'adapter:', !!adapter)
    if (!amount || parseFloat(amount) <= 0 || !adapter) return
    setLoading(true)
    setError(null)

    try {
      const result = await withdrawFromUnified(adapter, amount, selectedChain.id)
      console.log('[withdraw] result:', result)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setAmount('')
          onClose()
        }, 2000)
      } else {
        setError(result.error || 'Withdraw failed')
      }
    } catch (err) {
      setError((err as Error).message || 'Withdraw failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/30 z-50'
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-[0_20px_60px_rgba(43,36,64,0.2)] w-[400px]'
          >
            <div className='flex items-center justify-between px-6 py-4 border-b border-ink/8'>
              <h3 className='font-display text-lg font-semibold'>
                {activeTab === 'deposit' ? 'Deposit USDC' : 'Withdraw USDC'}
              </h3>
              <button
                onClick={onClose}
                className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'
              >
                &times;
              </button>
            </div>

            {/* Tabs */}
            <div className='flex border-b border-ink/8'>
              {(['deposit', 'withdraw'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setAmount(''); setError(null); setSuccess(false) }}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-ink border-b-2 border-ink'
                      : 'text-ink/40 hover:text-ink/60'
                  }`}
                >
                  {tab === 'deposit' ? 'Deposit' : 'Withdraw'}
                </button>
              ))}
            </div>

            <div className='p-6'>
              {success ? (
                <div className='text-center py-8'>
                  <div className='w-12 h-12 rounded-full bg-mint/15 flex items-center justify-center mx-auto mb-3'>
                    <svg className='w-6 h-6 text-mint' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                  </div>
                  <p className='text-sm text-ink/70'>
                    {activeTab === 'deposit' ? 'Deposit submitted!' : 'Withdraw submitted!'}
                  </p>
                </div>
              ) : (
                <>
                  <label className='block mb-4'>
                    <span className='text-xs text-ink/40 mb-1.5 block'>
                      {activeTab === 'deposit' ? 'From chain' : 'To chain'}
                    </span>
                    <div className='relative'>
                      <select
                        value={selectedChain.id}
                        onChange={(e) => {
                          const chain = chains.find((c) => c.id === e.target.value)
                          if (chain) setSelectedChain(chain)
                        }}
                        className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:border-ink/20'
                      >
                        {chains.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                      <svg className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30 pointer-events-none' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                      </svg>
                    </div>
                  </label>

                  <label className='block mb-4'>
                    <span className='text-xs text-ink/40 mb-1.5 block'>Amount</span>
                    <div className='relative'>
                      <input
                        type='number'
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder='0.00'
                        className='w-full text-sm text-ink font-mono bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 pr-16 focus:outline-none focus:border-ink/20'
                      />
                      <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/40 font-medium'>USDC</span>
                    </div>
                  </label>

                  <div className='flex items-center gap-2 mb-6 text-xs text-ink/40'>
                    <span>
                      {activeTab === 'deposit'
                        ? `Available: ${walletBalance} USDC`
                        : `Unified Balance: ${unifiedBalance} USDC`
                      }
                    </span>
                  </div>

                  {error && (
                    <div className='mb-4 p-3 bg-coral/10 border border-coral/20 rounded-xl text-xs text-coral'>
                      {error}
                    </div>
                  )}

                  <div className='border-t border-ink/8 pt-4 mb-4'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-ink/40'>
                        {activeTab === 'deposit' ? 'To' : 'From'}
                      </span>
                      <span className='text-ink/60 font-medium'>
                        {activeTab === 'deposit' ? 'Unified Balance' : selectedChain.label}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={activeTab === 'deposit' ? handleDeposit : handleWithdraw}
                    disabled={!amount || parseFloat(amount) <= 0 || loading}
                    className='w-full py-2.5 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30'
                  >
                    {loading
                      ? (activeTab === 'deposit' ? 'Depositing...' : 'Withdrawing...')
                      : (activeTab === 'deposit' ? 'Deposit USDC' : 'Withdraw USDC')
                    }
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
