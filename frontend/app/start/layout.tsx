'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import Logo from '../components/common/Logo'
import FloatingChatButton from '../components/chat/FloatingChatButton'
import UserMenuPopover from '../components/start/UserMenuPopover'
import UsernameModal from '../components/start/UsernameModal'
import DepositSpendModal from '../components/start/DepositSpendModal'
import { StartProvider, useStart } from '../components/start/StartProvider'
import { ListTodo, DollarSign, LayoutGrid, Building2, Wallet, Shield, FileText, FileCheck, Settings, Bot, TrendingUp, Package, Search } from 'lucide-react'

const NAV_ITEMS = [
  // All roles
  { href: '/start/overview', label: 'Overview', icon: ListTodo, roles: ['employer', 'payee', 'payer', 'partner'] },
  // Partner only
  { href: '/start/available-receivables', label: 'Available Receivables', icon: Package, roles: ['partner'] },
  { href: '/start/due-diligence', label: 'Due Diligence', icon: Search, roles: ['partner'] },
  { href: '/start/funding', label: 'Funding', icon: DollarSign, roles: ['partner'] },
  // Company only
  { href: '/start/workflows', label: 'Workflows', icon: LayoutGrid, roles: ['employer'] },
  // Company & Payer
  { href: '/start/wallets', label: 'Wallets', icon: Wallet, roles: ['employer', 'payee', 'payer'] },
  { href: '/start/payments', label: 'Payments', icon: DollarSign, roles: ['employer', 'payee', 'payer'] },
  { href: '/start/invoices', label: 'Invoices', icon: FileCheck, roles: ['employer', 'payee', 'payer'] },
  // All roles
  { href: '/start/proof', label: 'Proof Explorer', icon: Shield, roles: ['employer', 'payee', 'payer', 'partner'] },
  // Company only
  { href: '/start/receivables', label: 'Receivables', icon: TrendingUp, roles: ['employer'] },
  // Admin
  { href: '/start/organization', label: 'Organization', icon: Building2, roles: ['employer'] },
]

function StartLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { health, setHealth, loading, error, setError, setLoading, apiUrl, setApiUrl } = useStart()

  const [showSettings, setShowSettings] = useState(false)
  const [settingsInput, setSettingsInput] = useState(apiUrl)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const saveSettings = () => {
    const url = settingsInput.replace(/\/+$/, '')
    setApiUrl(url)
    setShowSettings(false)
  }

  const resetSettings = () => {
    setSettingsInput('http://localhost:3001')
    setApiUrl('http://localhost:3001')
    setShowSettings(false)
  }

  return (
    <div className='min-h-screen bg-lavender'>
      {/* Top Nav */}
      <nav className='flex items-center justify-between px-6 md:px-13 py-4 max-w-[1320px] mx-auto border-b border-ink/8'>
        <Logo />
        <div className='flex items-center gap-2'>
          {health && (
            <>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${health.role === 'employer' ? 'bg-mint/15 text-[#1B7A50]' : health.role === 'payee' ? 'bg-blue-100 text-blue-700' : health.role === 'payer' ? 'bg-amber-100 text-amber-700' : health.role === 'partner' ? 'bg-violet/15 text-[#5A4FB8]' : 'bg-ink/10 text-ink/50'}`}>
                {health.role === 'employer' ? 'COMPANY' : health.role === 'payee' ? 'PAYEE' : health.role === 'payer' ? 'PAYER' : health.role === 'partner' ? 'PARTNER' : 'PENDING'}
              </span>
              <span className='text-[11px] text-ink/30'>{health.peers} peer{health.peers !== 1 ? 's' : ''}</span>
              <span className='w-px h-3 bg-ink/10' />
              <div className='relative'>
                <button onClick={() => setShowUserMenu(!showUserMenu)} className='flex items-center gap-1.5 text-[11px] text-ink/60 font-medium bg-ink/5 hover:bg-ink/10 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer'>
                  <svg className='w-3 h-3 text-ink/30' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                  </svg>
                  {health.name}
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <UserMenuPopover isOpen={showUserMenu} onClose={() => setShowUserMenu(false)} health={health} onOpenUsername={() => { setShowUsernameModal(true); setShowUserMenu(false) }} onOpenDeposit={() => { setShowDeposit(true); setShowUserMenu(false) }} />
                  )}
                </AnimatePresence>
              </div>
              {health.role === 'employer' && (
                <div className='relative'>
                  <button onClick={() => setShowInvite(!showInvite)} className='w-8 h-8 rounded-lg bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-colors' title='Invite'>
                    <svg className='w-4 h-4 text-ink/40' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {showInvite && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }} className='absolute top-full right-0 mt-2 bg-card rounded-xl shadow-[0_10px_40px_rgba(43,36,64,0.15)] border border-ink/8 p-4 w-72 z-50'>
                        <p className='text-[10px] text-ink/30 uppercase tracking-wider mb-2'>Invite Code</p>
                        <p className='font-mono text-xs text-ink/60 break-all mb-3'>{health.peerId}</p>
                        <button onClick={async () => { await navigator.clipboard.writeText(health.peerId) }} className='w-full px-3 py-2 bg-ink text-lavender text-xs font-medium rounded-lg hover:opacity-90 transition-opacity'>Copy Invite Code</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
          <button onClick={() => { setSettingsInput(apiUrl); setShowSettings(true) }} className='w-8 h-8 rounded-lg bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-colors'>
            <Settings className='w-4 h-4 text-ink/40' />
          </button>
        </div>
      </nav>

      {/* Loading State */}
      {(loading || error) && (
        <div className='max-w-[1320px] mx-auto px-6 md:px-13 py-8'>
          <div className='flex items-center justify-center min-h-[50vh]'>
            <div className='bg-card rounded-2xl shadow-[0_16px_60px_rgba(43,36,64,0.08)] p-8 max-w-[400px] w-full text-center'>
              <div className='w-12 h-12 bg-ink/5 rounded-full flex items-center justify-center mx-auto mb-5'>
                <div className='w-6 h-6 border-2 border-ink/20 border-t-ink/60 rounded-full animate-spin' />
              </div>
              <h2 className='font-display text-lg font-semibold text-ink mb-2'>Connecting to workspace</h2>
              <p className='text-ink/40 text-sm mb-6'>Looking for your terminal...</p>
              
              {!error ? (
                <div className='space-y-3'>
                  <button
                    onClick={() => { setSettingsInput(apiUrl); setShowSettings(true) }}
                    className='text-sm text-ink/40 hover:text-ink/70 transition-colors'
                  >
                    Change terminal URL
                  </button>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='bg-coral/10 rounded-xl px-4 py-3'>
                    <p className='text-coral text-sm font-medium mb-1'>Connection failed</p>
                    <p className='text-coral/70 text-xs'>Could not reach terminal at {apiUrl}</p>
                  </div>
                  <button
                    onClick={() => { setError(null); setLoading(true) }}
                    className='w-full px-4 py-2.5 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 transition-opacity'
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => { setSettingsInput(apiUrl); setShowSettings(true) }}
                    className='text-sm text-ink/40 hover:text-ink/70 transition-colors'
                  >
                    Change terminal URL
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending Role State */}
      {!loading && !error && health && health.role === 'pending' && (
        <div className='max-w-[1320px] mx-auto px-6 md:px-13 py-8'>
          <div className='flex items-center justify-center min-h-[50vh]'>
            <div className='bg-card rounded-2xl shadow-[0_16px_60px_rgba(43,36,64,0.08)] p-8 max-w-[480px] w-full'>
              <div className='text-center mb-6'>
                <div className='w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <svg className='w-6 h-6 text-amber-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <h2 className='font-display text-xl font-semibold text-ink mb-2'>Waiting for role assignment</h2>
                <p className='text-ink/40 text-sm'>Your employer needs to assign you a role</p>
              </div>

              <div className='bg-ink/[0.03] rounded-xl p-5 mb-6'>
                <p className='text-ink/50 text-sm font-medium mb-3'>Ask your employer to:</p>
                <ol className='text-ink/60 text-sm space-y-2.5 list-decimal list-inside'>
                  <li>Go to <span className='font-medium'>Organization → Members</span></li>
                  <li>Find your name in the list</li>
                  <li>Click your role and select a role</li>
                </ol>
              </div>

              <div className='text-center'>
                <p className='text-ink/30 text-xs'>Your peer ID: {health.peerId.slice(0, 16)}...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && health && health.role !== 'pending' && (
        <div className='max-w-[1320px] mx-auto px-6 md:px-13 py-8'>
          <div className='flex gap-8'>
            {/* Sidebar */}
            <div className='w-[200px] flex-shrink-0'>
              <nav className='space-y-1'>
                {NAV_ITEMS.filter(item => item.roles.includes(health?.role || '')).map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-ink text-lavender' : 'text-ink/60 hover:bg-ink/5'}`}
                    >
                      <item.icon className='w-4 h-4' />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Page Content */}
            <div className='flex-1 min-w-0'>
              {children}
            </div>
          </div>
        </div>
      )}

      <FloatingChatButton />

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='fixed inset-0 bg-black/30 z-50' onClick={() => setShowSettings(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-[0_20px_60px_rgba(43,36,64,0.2)] w-[560px] max-h-[80vh] overflow-hidden flex flex-col'>
              <div className='flex items-center justify-between px-6 py-4 border-b border-ink/8'>
                <h3 className='font-display text-lg font-semibold'>Settings</h3>
                <button onClick={() => setShowSettings(false)} className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'>&times;</button>
              </div>
              <div className='flex flex-1 min-h-0'>
                <div className='w-[140px] border-r border-ink/8 py-4 px-3'>
                  <button className='w-full text-left px-3 py-2 rounded-lg bg-ink/5 text-sm font-medium text-ink'>Terminal</button>
                </div>
                <div className='flex-1 flex flex-col p-6'>
                  <label className='block mb-4'>
                    <span className='text-xs text-ink/40 mb-1.5 block'>API URL</span>
                    <input value={settingsInput} onChange={(e) => setSettingsInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveSettings()} className='w-full text-sm text-ink font-mono bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20' placeholder='http://localhost:3001' />
                  </label>
                  <button onClick={resetSettings} className='text-xs text-ink/30 hover:text-coral transition-colors self-start mb-auto'>Reset to default</button>
                  <div className='flex justify-end gap-2 mt-6 pt-4 border-t border-ink/8'>
                    <button onClick={() => setShowSettings(false)} className='px-4 py-2 text-xs text-ink/50 hover:text-ink/70 transition-colors'>Cancel</button>
                    <button onClick={saveSettings} className='px-4 py-2 bg-ink text-lavender text-xs font-medium rounded-xl hover:opacity-90 transition-opacity'>Save & Reconnect</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <UsernameModal isOpen={showUsernameModal} onClose={() => setShowUsernameModal(false)} currentName={health?.name || ''} apiUrl={apiUrl} onNameChange={(name) => { if (health) setHealth({ ...health, name }) }} />
      {showDeposit && <DepositSpendModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} />}
    </div>
  )
}

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return (
    <StartProvider>
      <StartLayoutInner>{children}</StartLayoutInner>
    </StartProvider>
  )
}
