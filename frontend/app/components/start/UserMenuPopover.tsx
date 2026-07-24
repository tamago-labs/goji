'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { NetworkArc, NetworkBase, NetworkEthereum } from '@web3icons/react'
import { useWallet } from '../../providers/WalletProvider'

interface UserMenuPopoverProps {
  isOpen: boolean
  onClose: () => void
  health: { name: string } | null
  onOpenUsername: () => void
  onOpenDeposit: () => void
}

export default function UserMenuPopover({ isOpen, onClose, health, onOpenUsername, onOpenDeposit }: UserMenuPopoverProps) {
  const [copiedChain, setCopiedChain] = useState<string | null>(null)
  const [hoveredChain, setHoveredChain] = useState<string | null>(null)
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { state: walletState } = useWallet()

  if (!isOpen) return null

  const chains = [
    { chain: 'Arc Testnet', icon: NetworkArc, id: 'arc' },
    { chain: 'Base Sepolia', icon: NetworkBase, id: 'base' },
    { chain: 'Ethereum Sepolia', icon: NetworkEthereum, id: 'eth' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className='absolute top-full right-0 mt-2 bg-card rounded-xl shadow-[0_10px_40px_rgba(43,36,64,0.15)] border border-ink/8 p-4 w-[320px] z-50'
    >
      {/* Unified Balance Header */}
      <div className='mb-4'>
        <p className='text-[10px] text-ink/30 uppercase tracking-wider mb-1'>Unified Balance</p>
        {isConnected ? (
          <div className='flex items-center gap-2'>
            <img src='https://assets.coingecko.com/coins/images/6319/standard/USDC.png?1769615602' alt='USDC' className='w-5 h-5 rounded-full' />
            {walletState.totalBalance === '0.00' ? (
              <div className='h-5 w-20 bg-ink/10 rounded animate-pulse' />
            ) : (
              <span className='text-lg font-semibold text-ink'>{walletState.totalBalance}</span>
            )}
            <span className='text-xs text-ink/40'>USDC</span>
          </div>
        ) : (
          <span className='text-sm text-ink/30'>Connect wallet to view balance</span>
        )}
      </div>

      {isConnected ? (
        <div>
          <div className='space-y-0.5 mb-4'>
            {chains.map((c) => {
              const Icon = c.icon
              const chainData = walletState.chains.find((ch) => ch.chain === c.chain)
              const balance = chainData?.balance || '0.00'
              return (
                <div key={c.id} className='flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ink/5 transition-colors'>
                  <div
                    className='relative flex items-center gap-2 cursor-help'
                    onMouseEnter={() => setHoveredChain(c.id)}
                    onMouseLeave={() => setHoveredChain(null)}
                  >
                    <Icon variant='branded' size={14} />
                    <span className='text-[11px] text-ink/50'>{c.chain}</span>
                    {hoveredChain === c.id && (
                      <div className='absolute bottom-full left-0 mb-1 bg-ink text-lavender text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-50'>
                        {balance} USDC
                      </div>
                    )}
                  </div>
                  <div
                    className='flex items-center gap-1 ml-auto cursor-pointer select-none'
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (address) {
                        try {
                          await navigator.clipboard.writeText(address)
                          setCopiedChain(c.id)
                          setTimeout(() => setCopiedChain(null), 2000)
                        } catch (err) {
                          console.error('[UserMenu] copy failed:', err)
                        }
                      }
                    }}
                  >
                    <span className='font-mono text-[10px] text-ink/40 truncate'>
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                    </span>
                    {copiedChain === c.id ? (
                      <svg className='w-3 h-3 text-mint flex-shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                      </svg>
                    ) : (
                      <svg className='w-3 h-3 text-ink/15 group-hover:text-ink/40 flex-shrink-0 transition-colors' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' />
                      </svg>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className='flex gap-2'>
            <button onClick={() => { onOpenDeposit(); onClose() }} className='flex-1 py-2 bg-ink text-lavender text-xs font-medium rounded-xl hover:opacity-90 transition-opacity'>
              Deposit / Withdraw
            </button>
            <button onClick={() => disconnect()} className='px-3 py-2 text-[11px] text-ink/30 hover:text-coral transition-colors'>
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className='[&>div]:!bg-transparent [&>div]:!p-0 [&>button]:!bg-ink [&>button]:!text-lavender [&>button]:!rounded-xl [&>button]:!px-3 [&>button]:!py-2 [&>button]:!text-xs [&>button]:!font-medium [&>button]:!w-full'>
          <ConnectButton />
        </div>
      )}

      <div className='border-t border-ink/8 pt-3 mt-3'>
        <button onClick={() => { onOpenUsername(); onClose() }} className='w-full text-left text-xs text-ink/50 hover:text-ink/70 transition-colors py-1.5'>
          Change username
        </button>
      </div>
    </motion.div>
  )
}
