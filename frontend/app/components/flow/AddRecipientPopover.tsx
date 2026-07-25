'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NetworkArc, NetworkBase, NetworkEthereum } from '@web3icons/react'

const chains = [
  { id: 'Arc_Testnet', label: 'Arc Testnet', icon: NetworkArc },
  { id: 'Base_Sepolia', label: 'Base Sepolia', icon: NetworkBase },
  { id: 'Ethereum_Sepolia', label: 'Ethereum Sepolia', icon: NetworkEthereum }
]

interface WalletData {
  id: string
  address: string
  name: string | null
  owner: string
  verified: boolean
}

interface AddRecipientPopoverProps {
  isOpen: boolean
  onClose: () => void
  apiUrl: string
  onAdd: (recipient: { address: string; chain: string; type: 'verified' | 'custom'; name: string }) => void
}

type Tab = 'wallets' | 'custom'

export default function AddRecipientPopover({ isOpen, onClose, apiUrl, onAdd }: AddRecipientPopoverProps) {
  const [activeTab, setActiveTab] = useState<Tab>('wallets')
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null)
  const [customAddress, setCustomAddress] = useState('')
  const [selectedChain, setSelectedChain] = useState(chains[0])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isOpen || activeTab !== 'wallets') return
    async function load() {
      try {
        const res = await fetch(`${apiUrl}/api/wallets/all`)
        if (res.ok) setWallets(await res.json())
      } catch {}
    }
    load()
  }, [isOpen, activeTab, apiUrl])

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
    if (activeTab === 'wallets' && selectedWallet) {
      onAdd({
        address: selectedWallet.address,
        chain: selectedChain.id,
        type: 'verified',
        name: selectedWallet.name || 'Wallet'
      })
      setSelectedWallet(null)
      onClose()
    } else if (activeTab === 'custom' && customAddress) {
      onAdd({
        address: customAddress,
        chain: selectedChain.id,
        type: 'custom',
        name: ''
      })
      setCustomAddress('')
      onClose()
    }
  }

  const canAdd = activeTab === 'wallets'
    ? selectedWallet !== null
    : customAddress.length > 10

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className='absolute top-full right-0 mt-2 bg-card rounded-xl shadow-[0_10px_40px_rgba(43,36,64,0.15)] border border-ink/8 w-[300px] z-50 overflow-hidden'
    >
      {/* Tabs */}
      <div className='flex border-b border-ink/8'>
        {(['wallets', 'custom'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedWallet(null) }}
            className={`flex-1 py-2.5 text-[11px] font-medium transition-colors ${
              activeTab === tab
                ? 'text-ink border-b-2 border-ink'
                : 'text-ink/40 hover:text-ink/60'
            }`}
          >
            {tab === 'wallets' ? 'Verified Wallets' : 'Custom Address'}
          </button>
        ))}
      </div>

      <div className='max-h-[250px] overflow-y-auto'>
        {activeTab === 'wallets' ? (
          <div className='p-2'>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search wallets...'
              className='w-full text-xs text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-1.5 mb-2 focus:outline-none focus:border-ink/20'
            />
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
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${w.verified ? 'bg-[#28C840]' : 'bg-ink/20'}`} />
                      <span className='text-xs text-ink/70 truncate'>{w.name || 'Unnamed'}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className='p-3'>
            <label className='block mb-3'>
              <span className='text-[10px] text-ink/40 mb-1 block'>Recipient Address</span>
              <input
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder='0x...'
                className='w-full text-xs text-ink font-mono bg-ink/5 border border-ink/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-ink/20'
              />
            </label>
          </div>
        )}
      </div>

      {/* Chain + Add button */}
      <div className='border-t border-ink/8 p-3'>
        <label className='block mb-3'>
          <span className='text-[10px] text-ink/40 mb-1 block'>Target Chain</span>
          <div className='relative'>
            <select
              value={selectedChain.id}
              onChange={(e) => {
                const chain = chains.find((c) => c.id === e.target.value)
                if (chain) setSelectedChain(chain)
              }}
              className='w-full text-xs text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-1.5 appearance-none focus:outline-none focus:border-ink/20'
            >
              {chains.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <svg className='absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink/30 pointer-events-none' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </div>
        </label>
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className='w-full py-2 bg-ink text-lavender text-xs font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30'
        >
          Add Recipient
        </button>
      </div>
    </motion.div>
  )
}
