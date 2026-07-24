'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface OffersSectionProps {
  disabled: boolean
}

type OfferTab = 'incoming' | 'outgoing' | 'deposits'

const offerTabs: { id: OfferTab; label: string; count: number; color: string }[] = [
  { id: 'incoming', label: 'Incoming', count: 3, color: 'mint' },
  { id: 'outgoing', label: 'Outgoing', count: 2, color: 'coral' },
  { id: 'deposits', label: 'Deposits', count: 1, color: 'violet' }
]

export default function OffersSection({ disabled }: OffersSectionProps) {
  const [activeTab, setActiveTab] = useState<OfferTab>('incoming')

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <h2 className='font-display text-xl font-semibold mb-4'>Offers</h2>
      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
        {/* Tabs */}
        <div className='flex border-b border-ink/8'>
          {offerTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-ink border-b-2 border-ink'
                  : 'text-ink/40 hover:text-ink/60'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                tab.color === 'mint' ? 'bg-mint/20 text-[#1B7A50]' :
                tab.color === 'coral' ? 'bg-coral/20 text-[#C24E33]' :
                'bg-violet/20 text-[#5A4FB8]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className='p-6 min-h-[180px]'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'incoming' && (
                <div className='text-center py-8'>
                  <p className='text-ink/40 text-sm'>No incoming payments yet</p>
                </div>
              )}
              {activeTab === 'outgoing' && (
                <div className='text-center py-8'>
                  <p className='text-ink/40 text-sm'>No outgoing payments to approve</p>
                </div>
              )}
              {activeTab === 'deposits' && (
                <div className='text-center py-8'>
                  <p className='text-ink/40 text-sm'>No deposits pending</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
