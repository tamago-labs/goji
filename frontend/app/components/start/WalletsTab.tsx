'use client'

import { useState, useEffect } from 'react'
import { Wallet, Plus } from 'lucide-react'
import RegisterWalletModal from './RegisterWalletModal'

interface WalletData {
  id: string
  address: string
  chainType: string | null
  walletType: string | null
  name: string | null
  createdAt: number
}

interface WalletsTabProps {
  apiUrl: string
}

export default function WalletsTab({ apiUrl }: WalletsTabProps) {
  const [wallets, setWallets] = useState<WalletData[]>([])
  const [showRegister, setShowRegister] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${apiUrl}/api/wallets`)
        if (res.ok) setWallets(await res.json())
      } catch {}
    }
    load()
  }, [apiUrl])

  const handleRegistered = (wallet: WalletData) => {
    setWallets((prev) => [...prev, wallet])
    setShowRegister(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${apiUrl}/api/wallets/${id}`, { method: 'DELETE' })
      setWallets((prev) => prev.filter((w) => w.id !== id))
    } catch {}
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-display text-xl font-semibold'>Wallets</h2>
        <button
          onClick={() => setShowRegister(true)}
          className='flex items-center gap-1.5 px-3 py-1.5 bg-ink text-lavender text-xs font-medium rounded-xl hover:opacity-90 transition-opacity'
        >
          <Plus className='w-3.5 h-3.5' />
          Register Wallet
        </button>
      </div>

      {wallets.length === 0 ? (
        <div className='bg-card rounded-2xl p-8 shadow-[0_4px_20px_rgba(43,36,64,0.06)] text-center'>
          <Wallet className='w-8 h-8 text-ink/20 mx-auto mb-2' />
          <p className='text-ink/40 text-sm'>No wallets registered yet</p>
        </div>
      ) : (
        <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-ink/8'>
                <th className='text-left text-[11px] text-ink/40 font-medium px-4 py-3'>Name</th>
                <th className='text-left text-[11px] text-ink/40 font-medium px-4 py-3'>Address</th>
                <th className='text-left text-[11px] text-ink/40 font-medium px-4 py-3'>Chain</th>
                <th className='text-left text-[11px] text-ink/40 font-medium px-4 py-3'>Type</th>
                <th className='w-10'></th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w) => (
                <tr key={w.id} className='border-b border-ink/5 last:border-0 hover:bg-ink/[0.02] transition-colors'>
                  <td className='px-4 py-3 text-sm text-ink font-medium'>{w.name || '—'}</td>
                  <td className='px-4 py-3 text-sm text-ink/60 font-mono truncate max-w-[160px]'>{w.address}</td>
                  <td className='px-4 py-3 text-sm text-ink/50'>{w.chainType || '—'}</td>
                  <td className='px-4 py-3 text-sm text-ink/50'>{w.walletType || '—'}</td>
                  <td className='px-4 py-3'>
                    <button
                      onClick={() => {
                        if (window.confirm('Remove this wallet?')) {
                          handleDelete(w.id)
                        }
                      }}
                      className='text-ink/20 hover:text-coral transition-colors'
                    >
                      <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RegisterWalletModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        apiUrl={apiUrl}
        onRegistered={handleRegistered}
      />
    </div>
  )
}
