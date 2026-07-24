'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useConnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

interface RegisterWalletModalProps {
  isOpen: boolean
  onClose: () => void
  apiUrl: string
  onRegistered: (wallet: { id: string; address: string; chainType: string | null; walletType: string | null; name: string | null; createdAt: number }) => void
}

export default function RegisterWalletModal({
  isOpen,
  onClose,
  apiUrl,
  onRegistered
}: RegisterWalletModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { address, isConnected } = useAccount()

  const handleRegister = async () => {
    if (!address) return
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          chainType: 'evm',
          walletType: 'EOA',
          name: name || null
        })
      })
      if (res.ok) {
        const wallet = await res.json()
        onRegistered(wallet)
        setName('')
      }
    } catch (err) {
      console.error('[register] error:', err)
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
            className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-[0_20px_60px_rgba(43,36,64,0.2)] w-[440px]'
          >
            <div className='flex items-center justify-between px-6 py-4 border-b border-ink/8'>
              <h3 className='font-display text-lg font-semibold'>Register Wallet</h3>
              <button
                onClick={onClose}
                className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'
              >
                &times;
              </button>
            </div>

            <div className='p-6 space-y-4'>
              <label className='block'>
                <span className='text-xs text-ink/40 mb-1.5 block'>Wallet Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
                  placeholder='e.g., alix.eth'
                />
              </label>

              <label className='block'>
                <span className='text-xs text-ink/40 mb-1.5 block'>Wallet Address</span>
                {isConnected ? (
                  <div className='flex items-center gap-2 bg-mint/10 border border-mint/20 rounded-xl px-4 py-2.5'>
                    <span className='w-2 h-2 rounded-full bg-mint' />
                    <span className='text-sm text-ink font-mono truncate'>{address}</span>
                  </div>
                ) : (
                  <div className='[&>div]:!bg-transparent [&>div]:!p-0 [&>button]:!bg-ink [&>button]:!text-lavender [&>button]:!rounded-xl [&>button]:!px-3 [&>button]:!py-2 [&>button]:!text-xs [&>button]:!font-medium [&>button]:!w-full'>
                    <ConnectButton />
                  </div>
                )}
              </label>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <span className='text-xs text-ink/40 mb-1.5 block'>Chain Type</span>
                  <div className='text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5'>EVM</div>
                </div>
                <div>
                  <span className='text-xs text-ink/40 mb-1.5 block'>Wallet Type</span>
                  <div className='text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5'>EOA</div>
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={!isConnected || loading}
                className='w-full py-2.5 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30'
              >
                {loading ? 'Registering...' : 'Register Wallet'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
