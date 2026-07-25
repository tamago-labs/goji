'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface OverviewProps {
  apiUrl: string
  disabled: boolean
}

interface Stats {
  walletCount: number
  boardCount: number
  settledCount: number
}

interface RecentBoard {
  id: string
  name: string
  routeCount: number
  settledCount: number
}

export default function Overview({ apiUrl, disabled }: OverviewProps) {
  const [stats, setStats] = useState<Stats>({ walletCount: 0, boardCount: 0, settledCount: 0 })
  const [recentBoards, setRecentBoards] = useState<RecentBoard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const walletsRes = await fetch(`${apiUrl}/api/wallets`)
        const wallets = walletsRes.ok ? await walletsRes.json() : []

        const boardsRes = await fetch(`${apiUrl}/api/boards`)
        const boards = boardsRes.ok ? await boardsRes.json() : []

        let settledCount = 0
        const recent: RecentBoard[] = []

        for (const board of boards.slice(0, 5)) {
          const statusRes = await fetch(`${apiUrl}/api/flow-status?flowId=${board.id}`)
          const connsRes = await fetch(`${apiUrl}/api/connections?boardId=${board.id}`)
          if (statusRes.ok && connsRes.ok) {
            const statuses = await statusRes.json()
            const connections = await connsRes.json()
            const routeConns = connections.filter((c: { payment?: number; document?: number }) => c.payment || c.document)
            const routeMap = new Map<string, string>()
            for (const s of statuses) routeMap.set(s.routeId, s.status)
            const settled = Array.from(routeMap.values()).filter((s) => s === 'settled').length
            settledCount += settled
            recent.push({
              id: board.id,
              name: board.name,
              routeCount: routeConns.length,
              settledCount: settled
            })
          }
        }

        setStats({ walletCount: wallets.length, boardCount: boards.length, settledCount })
        setRecentBoards(recent)
      } catch {}
      setLoading(false)
    }
    load()
  }, [apiUrl])

  const steps = [
    {
      done: stats.walletCount > 0,
      title: 'Register Wallet',
      desc: 'Add your wallet address so others can send payments to you.',
      action: stats.walletCount === 0 ? <span className='text-[10px] text-mint'>Register →</span> : null
    },
    {
      done: stats.boardCount > 0,
      title: 'Create a Flow',
      desc: 'Build a payment pipeline with wallets, recipients, and connection lines.',
      action: stats.boardCount === 0 ? <Link href='/flow/new?type=blank' className='text-[10px] text-mint'>Create →</Link> : null
    },
    {
      done: stats.settledCount > 0,
      title: 'Send First Payment',
      desc: 'Start your flow and sign to send USDC to your recipients.',
      action: stats.settledCount === 0 && stats.boardCount > 0 ? <span className='text-[10px] text-mint'>Go to flow →</span> : null
    }
  ]

  const completed = steps.filter((s) => s.done).length

  return (
    <div>
      <h2 className='font-display text-xl font-semibold mb-4'>Overview</h2>

      {loading ? (
        <div className='text-center py-12 text-ink/30 text-sm'>Loading...</div>
      ) : (
        <>
          {/* Progress */}
          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6 mb-5'>
            <div className='flex items-center justify-between mb-3'>
              <span className='text-sm font-medium text-ink'>Getting Started</span>
              <span className='text-xs text-ink/40'>{completed}/{steps.length} done</span>
            </div>
            <div className='w-full h-1.5 bg-ink/10 rounded-full overflow-hidden mb-5'>
              <motion.div
                className='h-full bg-mint rounded-full'
                initial={{ width: 0 }}
                animate={{ width: `${(completed / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Steps */}
            <div className='space-y-3'>
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                    step.done ? 'bg-mint/5' : 'bg-ink/3'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    step.done ? 'bg-mint text-white' : 'bg-ink/10 text-ink/30'
                  }`}>
                    {step.done ? <Check className='w-3 h-3' /> : <span className='text-[10px]'>{i + 1}</span>}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between'>
                      <span className={`text-sm font-medium ${step.done ? 'text-ink/70' : 'text-ink'}`}>
                        {step.title}
                      </span>
                      {step.action}
                    </div>
                    <p className='text-xs text-ink/40 mt-0.5'>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-3 gap-4 mb-5'>
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-4 text-center'>
              <div className='text-2xl font-semibold text-ink mb-1'>{stats.walletCount}</div>
              <div className='text-[10px] text-ink/40 uppercase tracking-wider'>Wallets</div>
            </div>
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-4 text-center'>
              <div className='text-2xl font-semibold text-ink mb-1'>{stats.boardCount}</div>
              <div className='text-[10px] text-ink/40 uppercase tracking-wider'>Flows</div>
            </div>
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-4 text-center'>
              <div className='text-2xl font-semibold text-ink mb-1'>{stats.settledCount}</div>
              <div className='text-[10px] text-ink/40 uppercase tracking-wider'>Payments</div>
            </div>
          </div>

          {/* Recent Flows */}
          {recentBoards.length > 0 && (
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
              <div className='px-6 py-3 border-b border-ink/8'>
                <span className='text-xs text-ink/40 uppercase tracking-wider'>Recent Flows</span>
              </div>
              <div>
                {recentBoards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/flow/${board.id}`}
                    className='flex items-center justify-between px-6 py-3 hover:bg-ink/3 transition-colors border-b border-ink/5 last:border-0'
                  >
                    <span className='text-sm text-ink/70'>{board.name}</span>
                    <div className='flex items-center gap-3'>
                      <span className='text-[10px] text-ink/40'>{board.settledCount}/{board.routeCount} routes</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        board.settledCount === board.routeCount && board.routeCount > 0
                          ? 'bg-mint/15 text-[#1B7A50]'
                          : board.settledCount > 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-ink/10 text-ink/40'
                      }`}>
                        {board.settledCount === board.routeCount && board.routeCount > 0
                          ? 'Completed'
                          : board.settledCount > 0
                            ? 'In Progress'
                            : 'Draft'
                        }
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
