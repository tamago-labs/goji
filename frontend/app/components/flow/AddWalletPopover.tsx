'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface WalletData {
  id: string
  address: string
  name: string | null
  owner: string
  verified: boolean
}

interface AddWalletPopoverProps {
  isOpen: boolean
  onClose: () => void
  apiUrl: string
  onSelect: (wallet: WalletData) => void
}

export default function AddWalletPopover({ isOpen, onClose, apiUrl, onSelect }: AddWalletPopoverProps) {
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [search, setSearch] = useState('')

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
        <p className='text-[10px] text-ink/30 uppercase tracking-wider mb-2'>Add Wallet</p>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search wallets...'
          className='w-full text-xs text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-ink/20'
        />
      </div>

      <div className='max-h-[250px] overflow-y-auto p-2'>
        {Object.keys(grouped).length === 0 ? (
          <div className='text-center py-6 text-ink/30 text-xs'>No wallets found</div>
        ) : (
          Object.entries(grouped).map(([owner, ownerWallets]) => (
            <div key={owner} className='mb-2'>
              <p className='text-[10px] text-ink/40 font-medium px-2 py-1'>{owner}</p>
              {ownerWallets.map((w) => (
                <div
                  key={w.id}
                  className='flex items-center gap-2 px-2 py-1.5 hover:bg-ink/5 rounded-lg transition-colors cursor-pointer'
                  onClick={() => { onSelect(w); onClose() }}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${w.verified ? 'bg-[#28C840]' : 'bg-ink/20'}`} />
                  <span className='text-xs text-ink/70 truncate'>{w.name || 'Unnamed'}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}
