'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Logo from '../common/Logo'
import FloatingChatButton from '../chat/FloatingChatButton'

const DEFAULT_URL = 'http://localhost:3001'

const templates = [
  {
    id: 'simple-payroll',
    title: 'Simple Payroll',
    description: 'One wallet, multiple recipients. Ideal for straightforward team payments.',
    cards: [
      { type: 'wallet', count: 1 },
      { type: 'recipient', count: 4 }
    ]
  },
  {
    id: 'multisig-payroll',
    title: 'Multisig Payroll',
    description:
      'Multiple wallets with a multisig gate. Requires signers to approve before payment.',
    cards: [
      { type: 'wallet', count: 3 },
      { type: 'gate', count: 1 },
      { type: 'recipient', count: 3 }
    ]
  }
]

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

function truncateAddress(addr: string) {
  if (!addr) return ''
  return addr.slice(0, 6) + '...' + addr.slice(-4)
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
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsInput, setSettingsInput] = useState(DEFAULT_URL)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')

  const { address, isConnected } = useAccount()
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
        setError('Could not connect to terminal. Make sure it is running: npx @tamago-labs/goji')
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

  const copyInvite = async () => {
    if (!health) return
    await navigator.clipboard.writeText(health.peerId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveUsername = async () => {
    if (!usernameInput.trim()) return
    try {
      await fetch(`${apiUrl}/api/username`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: usernameInput.trim() })
      })
    } catch {}
    if (health) {
      setHealth({ ...health, name: usernameInput.trim() })
    }
    setShowUsernameModal(false)
  }

  return (
    <div className='min-h-screen bg-lavender'>
      <nav className='flex items-center justify-between px-6 md:px-13 py-4 max-w-[1320px] mx-auto border-b border-ink/8'>
        <Logo />

        <div className='flex items-center gap-2'>
          {loading && (
            <div className='w-4 h-4 border-2 border-ink/20 border-t-ink/60 rounded-full animate-spin' />
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
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className='absolute top-full right-0 mt-2 bg-card rounded-xl shadow-[0_10px_40px_rgba(43,36,64,0.15)] border border-ink/8 p-4 w-72 z-50'
                    >
                      <div className='mb-3'>
                        <p className='text-[10px] text-ink/30 uppercase tracking-wider mb-1.5'>Wallet</p>
                        {isConnected ? (
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <span className='w-2 h-2 rounded-full bg-mint' />
                              <span className='font-mono text-xs text-ink/60'>{truncateAddress(address || '')}</span>
                            </div>
                            <button
                              onClick={() => disconnect()}
                              className='text-[10px] text-ink/30 hover:text-coral transition-colors'
                            >
                              Disconnect
                            </button>
                          </div>
                        ) : (
                          <div className='[&>div]:!bg-transparent [&>div]:!p-0 [&>button]:!bg-ink [&>button]:!text-lavender [&>button]:!rounded-xl [&>button]:!px-3 [&>button]:!py-2 [&>button]:!text-xs [&>button]:!font-medium [&>button]:!w-full'>
                            <ConnectButton />
                          </div>
                        )}
                      </div>

                      <div className='border-t border-ink/8 pt-3'>
                        <button
                          onClick={() => {
                            setUsernameInput(health.name)
                            setShowUsernameModal(true)
                            setShowUserMenu(false)
                          }}
                          className='w-full text-left text-xs text-ink/50 hover:text-ink/70 transition-colors py-1.5'
                        >
                          Change username
                        </button>
                      </div>
                    </motion.div>
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
                    {copied ? (
                      <svg className='w-4 h-4 text-mint' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                      </svg>
                    ) : (
                      <svg className='w-4 h-4 text-ink/40' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' />
                      </svg>
                    )}
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
                          onClick={copyInvite}
                          className='w-full px-3 py-2 bg-ink text-lavender text-xs font-medium rounded-lg hover:opacity-90 transition-opacity'
                        >
                          {copied ? 'Copied!' : 'Copy Invite Code'}
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
        {error && (
          <div className='bg-coral/10 border border-coral/20 rounded-2xl p-5 mb-10 flex items-center justify-between'>
            <p className='text-sm text-ink/70'>{error}</p>
            <button
              onClick={() => {
                setError(null)
                setLoading(true)
                setHealth(null)
              }}
              className='shrink-0 ml-4 text-xs text-ink/40 hover:text-ink/70 transition-colors'
            >
              Retry
            </button>
          </div>
        )}

        <h1 className='font-display text-4xl font-semibold mb-10'>Team payment flows</h1>

        <h2 className='font-display text-xl font-semibold mb-4'>Active boards</h2>
        {boards.length === 0 ? (
          <div className={`bg-card rounded-2xl p-8 shadow-[0_4px_20px_rgba(43,36,64,0.06)] text-center mb-12 ${loading || error ? ' opacity-50 pointer-events-none' : ''}`}>
            <p className='text-ink/40 text-sm'>No boards yet. Create one below.</p>
          </div>
        ) : (
          <div className={`space-y-3 mb-12 ${loading || error ? ' opacity-50 pointer-events-none' : ''}`}>
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/flow/${board.id}`}
                className='bg-card rounded-2xl p-5 shadow-[0_4px_20px_rgba(43,36,64,0.06)] hover:shadow-[0_8px_30px_rgba(43,36,64,0.1)] transition-shadow flex items-center justify-between'
              >
                <div>
                  <h3 className='font-medium text-ink text-sm'>{board.name}</h3>
                  <p className='text-xs text-ink/30 mt-1'>
                    Created {new Date(board.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className='text-ink/20 text-sm'>&rarr;</span>
              </Link>
            ))}
          </div>
        )}

        <h2 className='font-display text-xl font-semibold mb-4'>Create new</h2>
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-5 ${loading || error ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Link
            href='/flow/new?type=blank'
            className='group bg-card rounded-2xl p-6 shadow-[0_4px_20px_rgba(43,36,64,0.06)] hover:shadow-[0_8px_30px_rgba(43,36,64,0.1)] transition-shadow border-2 border-dashed border-ink/15 hover:border-mint/50 flex flex-col items-center justify-center min-h-[180px]'
          >
            <div className='w-12 h-12 rounded-xl bg-ink/5 group-hover:bg-mint/15 flex items-center justify-center mb-3 transition-colors'>
              <span className='text-2xl text-ink/40 group-hover:text-mint transition-colors'>+</span>
            </div>
            <span className='font-medium text-ink/70 group-hover:text-ink transition-colors'>
              Blank canvas
            </span>
          </Link>

          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/flow/new?type=${t.id}`}
              className='group bg-card rounded-2xl p-6 shadow-[0_4px_20px_rgba(43,36,64,0.06)] hover:shadow-[0_8px_30px_rgba(43,36,64,0.1)] transition-shadow flex flex-col min-h-[180px]'
            >
              <div className='flex-1'>
                <div className='flex gap-1.5 mb-4'>
                  {t.cards.map((c, i) => (
                    <span
                      key={i}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.type === 'wallet'
                          ? 'bg-mint/20 text-[#1B7A50]'
                          : c.type === 'gate'
                            ? 'bg-coral/20 text-[#C24E33]'
                            : 'bg-violet/20 text-[#5A4FB8]'
                      }`}
                    >
                      {c.count} {c.type}
                      {c.count > 1 ? 's' : ''}
                    </span>
                  ))}
                </div>
                <h3 className='font-display text-lg font-semibold mb-2 group-hover:text-mint transition-colors'>
                  {t.title}
                </h3>
                <p className='text-sm text-ink/50 leading-relaxed'>{t.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>

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
              className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-[0_20px_60px_rgba(43,36,64,0.2)] p-6 w-[420px]'
            >
              <div className='flex items-center justify-between mb-5'>
                <h3 className='font-display text-lg font-semibold'>Terminal Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'
                >
                  &times;
                </button>
              </div>

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

              <div className='flex items-center justify-between'>
                <button
                  onClick={resetSettings}
                  className='text-xs text-ink/30 hover:text-coral transition-colors'
                >
                  Reset to default
                </button>
                <div className='flex gap-2'>
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUsernameModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/30 z-50'
              onClick={() => setShowUsernameModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-[0_20px_60px_rgba(43,36,64,0.2)] p-6 w-[380px]'
            >
              <div className='flex items-center justify-between mb-5'>
                <h3 className='font-display text-lg font-semibold'>Change Username</h3>
                <button
                  onClick={() => setShowUsernameModal(false)}
                  className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'
                >
                  &times;
                </button>
              </div>

              <label className='block mb-5'>
                <span className='text-xs text-ink/40 mb-1.5 block'>Display name</span>
                <input
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveUsername()}
                  className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
                  placeholder='Your name'
                  autoFocus
                />
              </label>

              <div className='flex justify-end gap-2'>
                <button
                  onClick={() => setShowUsernameModal(false)}
                  className='px-4 py-2 text-xs text-ink/50 hover:text-ink/70 transition-colors'
                >
                  Cancel
                </button>
                <button
                  onClick={saveUsername}
                  className='px-4 py-2 bg-ink text-lavender text-xs font-medium rounded-xl hover:opacity-90 transition-opacity'
                >
                  Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <FloatingChatButton />
    </div>
  )
}
