'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useAccount, useDisconnect } from 'wagmi'
import Logo from '../common/Logo'
import FloatingChatButton from '../chat/FloatingChatButton'
import UserMenuPopover from './UserMenuPopover'
import UsernameModal from './UsernameModal'
import BoardsList from './BoardsList'
import CreateNew from './CreateNew'
import ErrorBanner from './ErrorBanner'
import DepositModal from './DepositModal'

const DEFAULT_URL = 'http://localhost:3001'

interface Health {
  status: string
  name: string
  peerId: string
  role: string
  writable: boolean
  peers: number
  port: number
}

interface Board {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export default function StartPage() {
  const [apiUrl, setApiUrl] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_URL
    return localStorage.getItem('goji-api-url') || DEFAULT_URL
  })
  const [health, setHealth] = useState<Health | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsInput, setSettingsInput] = useState(DEFAULT_URL)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  const fetchHealth = useCallback(
    async (url: string) => {
      try {
        const res = await fetch(`${url}/api/health`)
        if (res.ok) {
          const data = await res.json()
          setHealth(data)
          setError(null)
          const boardsRes = await fetch(`${url}/api/boards`)
          if (boardsRes.ok) {
            setBoards(await boardsRes.json())
          }
          return true
        }
      } catch {}
      return false
    },
    []
  )

  useEffect(() => {
    let cancelled = false

    async function connect() {
      setLoading(true)
      for (let i = 0; i < 10; i++) {
        if (cancelled) return
        const ok = await fetchHealth(apiUrl)
        if (ok && !cancelled) {
          setLoading(false)
          return
        }
        await new Promise((r) => setTimeout(r, 1000))
      }
      if (!cancelled) {
        setError('Could not establish a connection. Make sure you are using Chrome and running: npx @tamago-labs/goji')
        setLoading(false)
      }
    }

    connect()
    return () => {
      cancelled = true
    }
  }, [apiUrl, fetchHealth])

  const saveSettings = () => {
    const url = settingsInput.replace(/\/+$/, '')
    localStorage.setItem('goji-api-url', url)
    setApiUrl(url)
    setHealth(null)
    setBoards([])
    setLoading(true)
    setError(null)
    setShowSettings(false)
  }

  const resetSettings = () => {
    setSettingsInput(DEFAULT_URL)
    localStorage.setItem('goji-api-url', DEFAULT_URL)
    setApiUrl(DEFAULT_URL)
    setHealth(null)
    setBoards([])
    setLoading(true)
    setError(null)
    setShowSettings(false)
  }

  return (
    <div className='min-h-screen bg-lavender'>
      <nav className='flex items-center justify-between px-6 md:px-13 py-4 max-w-[1320px] mx-auto border-b border-ink/8'>
        <Logo />

        <div className='flex items-center gap-2'>
          {loading && (
            <div className='flex items-center gap-2 text-xs text-ink/40'>
              <div className='w-3.5 h-3.5 border-2 border-ink/15 border-t-ink/50 rounded-full animate-spin' />
              <span>Finding your terminal...</span>
            </div>
          )}
          {health && (
            <>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  health.role === 'host'
                    ? 'bg-mint/15 text-[#1B7A50]'
                    : 'bg-violet/15 text-[#5A4FB8]'
                }`}
              >
                {health.role === 'host' ? 'HOST' : 'GUEST'}
              </span>
              <span className='text-[11px] text-ink/30'>
                {health.peers} peer{health.peers !== 1 ? 's' : ''}
              </span>
              <span className='w-px h-3 bg-ink/10' />

              <div className='relative'>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className='flex items-center gap-1.5 text-[11px] text-ink/60 font-medium bg-ink/5 hover:bg-ink/10 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer'
                >
                  <svg className='w-3 h-3 text-ink/30' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                  </svg>
                  {health.name}
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <UserMenuPopover
                      isOpen={showUserMenu}
                      onClose={() => setShowUserMenu(false)}
                      health={health}
                      onOpenUsername={() => { setShowUsernameModal(true); setShowUserMenu(false) }}
                      onOpenDeposit={() => { setShowDeposit(true); setShowUserMenu(false) }}
                    />
                  )}
                </AnimatePresence>
              </div>

              {health.role === 'host' && (
                <div className='relative'>
                  <button
                    onClick={() => setShowInvite(!showInvite)}
                    className='w-8 h-8 rounded-lg bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-colors'
                    title='Invite'
                  >
                    <svg className='w-4 h-4 text-ink/40' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {showInvite && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className='absolute top-full right-0 mt-2 bg-card rounded-xl shadow-[0_10px_40px_rgba(43,36,64,0.15)] border border-ink/8 p-4 w-72 z-50'
                      >
                        <p className='text-[10px] text-ink/30 uppercase tracking-wider mb-2'>Invite Code</p>
                        <p className='font-mono text-xs text-ink/60 break-all mb-3'>{health.peerId}</p>
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(health.peerId)
                          }}
                          className='w-full px-3 py-2 bg-ink text-lavender text-xs font-medium rounded-lg hover:opacity-90 transition-opacity'
                        >
                          Copy Invite Code
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

          <button
            onClick={() => {
              setSettingsInput(apiUrl)
              setShowSettings(true)
            }}
            className='w-8 h-8 rounded-lg bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-colors'
          >
            <svg className='w-4 h-4 text-ink/40' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
            </svg>
          </button>
        </div>
      </nav>

      <main className='max-w-[960px] mx-auto px-6 py-20'>
        {error && <ErrorBanner message={error} onRetry={() => { setError(null); setLoading(true) }} />}

        <h1 className='font-display text-4xl font-semibold mb-10'>Your payment flows</h1>

        <BoardsList boards={boards} />
        <CreateNew disabled={loading || !!error} />
      </main>

      <FloatingChatButton />

      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/30 z-50'
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-[0_20px_60px_rgba(43,36,64,0.2)] w-[560px] max-h-[80vh] overflow-hidden flex flex-col'
            >
              <div className='flex items-center justify-between px-6 py-4 border-b border-ink/8'>
                <h3 className='font-display text-lg font-semibold'>Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'
                >
                  &times;
                </button>
              </div>

              <div className='flex flex-1 min-h-0'>
                <div className='w-[140px] border-r border-ink/8 py-4 px-3'>
                  <button className='w-full text-left px-3 py-2 rounded-lg bg-ink/5 text-sm font-medium text-ink'>
                    Terminal
                  </button>
                </div>

                <div className='flex-1 flex flex-col p-6'>
                  <label className='block mb-4'>
                    <span className='text-xs text-ink/40 mb-1.5 block'>API URL</span>
                    <input
                      value={settingsInput}
                      onChange={(e) => setSettingsInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveSettings()}
                      className='w-full text-sm text-ink font-mono bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
                      placeholder='http://localhost:3001'
                    />
                  </label>

                  <button
                    onClick={resetSettings}
                    className='text-xs text-ink/30 hover:text-coral transition-colors self-start mb-auto'
                  >
                    Reset to default
                  </button>

                  <div className='flex justify-end gap-2 mt-6 pt-4 border-t border-ink/8'>
                    <button
                      onClick={() => setShowSettings(false)}
                      className='px-4 py-2 text-xs text-ink/50 hover:text-ink/70 transition-colors'
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveSettings}
                      className='px-4 py-2 bg-ink text-lavender text-xs font-medium rounded-xl hover:opacity-90 transition-opacity'
                    >
                      Save & Reconnect
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <UsernameModal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        currentName={health?.name || ''}
        apiUrl={apiUrl}
        onNameChange={(name) => {
          if (health) setHealth({ ...health, name })
        }}
      />

      {showDeposit && (
        <DepositModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
      )}
    </div>
  )
}
