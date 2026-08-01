'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface WalletData {
  id: string
  address: string
  chainType: string | null
  walletType: string | null
  name: string | null
  owner: string
  verified: boolean
}

interface AddDepositPopoverProps {
  isOpen: boolean
  onClose: () => void
  apiUrl: string
  onSelect: (wallet: WalletData & { chain: string }) => void
}

const CHAINS = [
  { id: 'Arc_Testnet', label: 'Arc Testnet' },
  { id: 'Base_Sepolia', label: 'Base Sepolia' },
  { id: 'Ethereum_Sepolia', label: 'Ethereum Sepolia' }
]

export default function AddDepositPopover({ isOpen, onClose, apiUrl, onSelect }: AddDepositPopoverProps) {
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [search, setSearch] = useState('')
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null)
  const [selectedChain, setSelectedChain] = useState(CHAINS[0])

  useEffect(() => {
    if (!isOpen) return
    async function load() {
      try {
        const res = await fetch(`${apiUrl}/api/wallets/all`)
        if (res.ok) setWallets(await res.json())
      } catch {}
    }
    load()
  }, [isOpen, apiUrl])

  const filtered = wallets.filter(
    (w) => w.name?.toLowerCase().includes(search.toLowerCase()) || w.owner.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = filtered.reduce((acc, w) => {
    const owner = w.owner || 'Unknown'
    if (!acc[owner]) acc[owner] = []
    acc[owner].push(w)
    return acc
  }, {} as Record<string, WalletData[]>)

  const handleAdd = () => {
    if (selectedWallet) {
      onSelect({ ...selectedWallet, chain: selectedChain.id })
      setSelectedWallet(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className='absolute top-full right-0 mt-2 bg-card rounded-xl shadow-[0_10px_40px_rgba(43,36,64,0.15)] border border-ink/8 w-[300px] z-50 overflow-hidden'
    >
      <div className='px-4 py-3 border-b border-ink/8'>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search wallets...'
          className='w-full text-xs text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-ink/20'
        />
      </div>

      <div className='px-4 py-2 border-b border-ink/8'>
        <label className='block'>
          <span className='text-[10px] text-ink/40 mb-1.5 block'>Chain</span>
          <div className='relative'>
            <select
              value={selectedChain.id}
              onChange={(e) => setSelectedChain(CHAINS.find((c) => c.id === e.target.value) || CHAINS[0])}
              className='w-full text-xs text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-1.5 appearance-none focus:outline-none'
            >
              {CHAINS.map((chain) => (
                <option key={chain.id} value={chain.id}>{chain.label}</option>
              ))}
            </select>
            <svg className='absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink/30 pointer-events-none' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </div>
        </label>
      </div>

      <div className='max-h-[200px] overflow-y-auto p-2'>
        {Object.keys(grouped).length === 0 ? (
          <div className='text-center py-6 text-ink/30 text-xs'>No wallets found</div>
        ) : (
          Object.entries(grouped).map(([owner, ownerWallets]) => (
            <div key={owner} className='mb-2'>
              <p className='text-[10px] text-ink/40 font-medium px-2 py-1'>{owner}</p>
              {ownerWallets.map((w) => (
                <div
                  key={w.id}
                  onClick={() => setSelectedWallet(w)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    selectedWallet?.id === w.id ? 'bg-mint/10 ring-1 ring-mint/30' : 'hover:bg-ink/5'
                  }`}
                >
                  <span className='w-2 h-2 rounded-full flex-shrink-0 bg-[#28C840]' />
                  <span className='text-xs text-ink/70 truncate'>{w.name || 'Unnamed'}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className='border-t border-ink/8 p-3'>
        <button
          onClick={handleAdd}
          disabled={!selectedWallet}
          className='w-full py-2 bg-ink text-lavender text-xs font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30'
        >
          Add Deposit Wallet
        </button>
      </div>
    </motion.div>
  )
}
