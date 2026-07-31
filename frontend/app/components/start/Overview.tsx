'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Wallet, FileText, Shield } from 'lucide-react'

interface OverviewProps {
  apiUrl: string
  role?: string
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

interface OutgoingRoute {
  boardId: string
  boardName: string
  recipientName: string
  amount: string
  status: string
}

export default function Overview({ apiUrl, role }: OverviewProps) {
  const [stats, setStats] = useState<Stats>({ walletCount: 0, boardCount: 0, settledCount: 0 })
  const [recentBoards, setRecentBoards] = useState<RecentBoard[]>([])
  const [outgoingRoutes, setOutgoingRoutes] = useState<OutgoingRoute[]>([])
  const [loading, setLoading] = useState(true)

  const isCompany = role === 'employer'
  const isPayee = role === 'payee'
  const isPayer = role === 'payer'
  const isPartner = role === 'partner'

  useEffect(() => {
    async function load() {
      try {
        const walletsRes = await fetch(`${apiUrl}/api/wallets`)
        const wallets = walletsRes.ok ? await walletsRes.json() : []
        const myAddresses = new Set(wallets.map((w: { address: string }) => w.address.toLowerCase()))

        const boardsRes = await fetch(`${apiUrl}/api/boards`)
        const boards = boardsRes.ok ? await boardsRes.json() : []

        let settledCount = 0
        const recent: RecentBoard[] = []
        const outgoing: OutgoingRoute[] = []

        for (const board of boards) {
          const [statusRes, connsRes, cardsRes] = await Promise.all([
            fetch(`${apiUrl}/api/flow-status?flowId=${board.id}`),
            fetch(`${apiUrl}/api/connections?boardId=${board.id}`),
            fetch(`${apiUrl}/api/cards?boardId=${board.id}`)
          ])

          if (statusRes.ok && connsRes.ok && cardsRes.ok) {
            const statuses = await statusRes.json()
            const connections = await connsRes.json()
            const cards = await cardsRes.json()
            const cardMap = new Map<string, { id: string; title?: string; fields?: Record<string, string | boolean> }>(
              cards.map((c: { id: string; title?: string; fields?: Record<string, string | boolean> }) => [c.id, c])
            )

            const routeConns = connections.filter((c: { payment?: number; document?: number }) => c.payment || c.document)
            const routeMap = new Map<string, string>()
            for (const s of statuses) routeMap.set(s.routeId, s.status)
            const settled = Array.from(routeMap.values()).filter((s) => s === 'settled').length
            settledCount += settled

            if (recent.length < 5) {
              recent.push({
                id: board.id,
                name: board.name,
                routeCount: routeConns.length,
                settledCount: settled
              })
            }

            // Fetch outgoing routes (user is sender)
            for (const conn of routeConns) {
              const fromCard = cardMap.get(conn.from)
              const toCard = cardMap.get(conn.to)
              if (!fromCard || !toCard) continue
              if (!myAddresses.has(String(fromCard.fields?.address || '').toLowerCase())) continue

              const status = statuses.find((s: { routeId: string }) => s.routeId === conn.id)
              outgoing.push({
                boardId: board.id,
                boardName: board.name,
                recipientName: toCard.title || 'Wallet',
                amount: conn.amount || '0',
                status: status?.status || 'pending'
              })
            }
          }
        }

        setStats({ walletCount: wallets.length, boardCount: boards.length, settledCount })
        setRecentBoards(recent)
        setOutgoingRoutes(outgoing)
      } catch {}
      setLoading(false)
    }
    load()
  }, [apiUrl])

  // Company steps
  const companySteps = [
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

  // Payee steps
  const payeeSteps = [
    {
      done: stats.walletCount > 0,
      title: 'Register Wallet',
      desc: 'Add your wallet address to receive payments.',
      action: stats.walletCount === 0 ? <span className='text-[10px] text-mint'>Register →</span> : null
    },
    {
      done: false,
      title: 'View Documents',
      desc: 'Access your payslips, invoices, and payment records.',
      action: <Link href='/start/payments' className='text-[10px] text-mint'>View →</Link>
    }
  ]

  // Partner steps
  const partnerSteps = [
    {
      done: false,
      title: 'Explore Proofs',
      desc: 'View and verify cryptographic proofs from payment settlements.',
      action: <Link href='/start/proof' className='text-[10px] text-mint'>Explore →</Link>
    },
    {
      done: false,
      title: 'Review Assets',
      desc: 'Evaluate verified payment records for financing opportunities.',
      action: null
    }
  ]

  // Payer steps
  const payerSteps = [
    {
      done: stats.walletCount > 0,
      title: 'Register Wallet',
      desc: 'Add your wallet address to send payments.',
      action: stats.walletCount === 0 ? <span className='text-[10px] text-mint'>Register →</span> : null
    },
    {
      done: false,
      title: 'View Invoices',
      desc: 'Review and pay invoices from contractors and vendors.',
      action: <Link href='/start/invoices' className='text-[10px] text-mint'>View →</Link>
    }
  ]

  const steps = isCompany ? companySteps : isPayee ? payeeSteps : role === 'payer' ? payerSteps : partnerSteps
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
              <span className='text-sm font-medium text-ink'>
                {isCompany ? 'Getting Started' : isPayee ? 'Your Setup' : 'Quick Start'}
              </span>
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
            {isCompany && (
              <>
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
              </>
            )}
            {isPayee && (
              <>
                <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-4 text-center'>
                  <div className='text-2xl font-semibold text-ink mb-1'>{stats.walletCount}</div>
                  <div className='text-[10px] text-ink/40 uppercase tracking-wider'>Wallets</div>
                </div>
                <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-4 text-center'>
                  <div className='text-2xl font-semibold text-ink mb-1'>{stats.settledCount}</div>
                  <div className='text-[10px] text-ink/40 uppercase tracking-wider'>Payments</div>
                </div>
                <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-4 text-center'>
                  <div className='text-2xl font-semibold text-ink mb-1'>—</div>
                  <div className='text-[10px] text-ink/40 uppercase tracking-wider'>Invoices</div>
                </div>
              </>
            )}
            {isPayer && (
              <>
                <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-4 text-center'>
                  <div className='text-2xl font-semibold text-ink mb-1'>{stats.walletCount}</div>
                  <div className='text-[10px] text-ink/40 uppercase tracking-wider'>Wallets</div>
                </div>
                <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-4 text-center'>
                  <div className='text-2xl font-semibold text-ink mb-1'>—</div>
                  <div className='text-[10px] text-ink/40 uppercase tracking-wider'>Invoices</div>
                </div>
                <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-4 text-center'>
                  <div className='text-2xl font-semibold text-ink mb-1'>{stats.settledCount}</div>
                  <div className='text-[10px] text-ink/40 uppercase tracking-wider'>Payments</div>
                </div>
              </>
            )}
            {isPartner && (
              <>
                <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-4 text-center'>
                  <div className='text-2xl font-semibold text-ink mb-1'>—</div>
                  <div className='text-[10px] text-ink/40 uppercase tracking-wider'>Verified</div>
                </div>
                <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-4 text-center'>
                  <div className='text-2xl font-semibold text-ink mb-1'>—</div>
                  <div className='text-[10px] text-ink/40 uppercase tracking-wider'>Assets</div>
                </div>
                <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-4 text-center'>
                  <div className='text-2xl font-semibold text-ink mb-1'>—</div>
                  <div className='text-[10px] text-ink/40 uppercase tracking-wider'>Financing</div>
                </div>
              </>
            )}
          </div>

          {/* Outgoing Payments - Company and Payer */}
          {(isCompany || isPayer) && outgoingRoutes.length > 0 && (
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden mb-5'>
              <div className='px-6 py-3 border-b border-ink/8 flex items-center justify-between'>
                <span className='text-xs text-ink/40 uppercase tracking-wider'>Outgoing Payments</span>
                <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-ink/10 text-ink/50'>
                  {outgoingRoutes.filter((r) => r.status === 'pending').length} pending
                </span>
              </div>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-ink/5 text-left'>
                    <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Flow</th>
                    <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>To</th>
                    <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Amount</th>
                    <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {outgoingRoutes.slice(0, 5).map((route, i) => (
                    <Link
                      key={i}
                      href={`/flow/${route.boardId}`}
                      className='table-row hover:bg-ink/3 transition-colors border-b border-ink/5 last:border-0'
                    >
                      <td className='px-6 py-3 text-ink/70'>{route.boardName}</td>
                      <td className='px-6 py-3 text-ink/60 truncate max-w-[120px]'>{route.recipientName}</td>
                      <td className='px-6 py-3 font-mono text-ink/60'>{route.amount} USDC</td>
                      <td className='px-6 py-3'>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          route.status === 'settled'
                            ? 'bg-mint/15 text-[#1B7A50]'
                            : route.status === 'failed'
                              ? 'bg-coral/15 text-coral'
                              : 'bg-blue-100 text-blue-700'
                        }`}>
                          {route.status === 'settled' ? 'Settled' : route.status === 'failed' ? 'Failed' : 'Pending'}
                        </span>
                      </td>
                    </Link>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty outgoing for company/payee */}
          {(isCompany || isPayer) && outgoingRoutes.length === 0 && !loading && (
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6 mb-5 text-center'>
              <p className='text-ink/40 text-sm'>No outgoing payments yet</p>
              <p className='text-ink/30 text-xs mt-1'>Create a flow to send your first payment.</p>
            </div>
          )}

          {/* Recent Flows - Company only */}
          {isCompany && recentBoards.length > 0 && (
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

          {/* Quick Actions - Payee */}
          {isPayee && (
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
              <h3 className='text-sm font-medium text-ink mb-4'>Quick Actions</h3>
              <div className='space-y-3'>
                <Link href='/start/wallets' className='flex items-center gap-3 p-3 rounded-xl bg-ink/3 hover:bg-ink/5 transition-colors'>
                  <Wallet className='w-5 h-5 text-ink/40' />
                  <div>
                    <div className='text-sm font-medium text-ink'>Register Wallet</div>
                    <div className='text-xs text-ink/40'>Add your wallet to receive payments</div>
                  </div>
                </Link>
                <Link href='/start/payments' className='flex items-center gap-3 p-3 rounded-xl bg-ink/3 hover:bg-ink/5 transition-colors'>
                  <FileText className='w-5 h-5 text-ink/40' />
                  <div>
                    <div className='text-sm font-medium text-ink'>View Payments</div>
                    <div className='text-xs text-ink/40'>Access payslips, invoices, and records</div>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Quick Actions - Payer */}
          {isPayer && (
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
              <h3 className='text-sm font-medium text-ink mb-4'>Quick Actions</h3>
              <div className='space-y-3'>
                <Link href='/start/wallets' className='flex items-center gap-3 p-3 rounded-xl bg-ink/3 hover:bg-ink/5 transition-colors'>
                  <Wallet className='w-5 h-5 text-ink/40' />
                  <div>
                    <div className='text-sm font-medium text-ink'>Register Wallet</div>
                    <div className='text-xs text-ink/40'>Add your wallet to send payments</div>
                  </div>
                </Link>
                <Link href='/start/invoices' className='flex items-center gap-3 p-3 rounded-xl bg-ink/3 hover:bg-ink/5 transition-colors'>
                  <FileText className='w-5 h-5 text-ink/40' />
                  <div>
                    <div className='text-sm font-medium text-ink'>View Invoices</div>
                    <div className='text-xs text-ink/40'>Review and pay invoices</div>
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Quick Actions - Partner */}
          {isPartner && (
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
              <h3 className='text-sm font-medium text-ink mb-4'>Quick Actions</h3>
              <div className='space-y-3'>
                <Link href='/start/proof' className='flex items-center gap-3 p-3 rounded-xl bg-ink/3 hover:bg-ink/5 transition-colors'>
                  <Shield className='w-5 h-5 text-ink/40' />
                  <div>
                    <div className='text-sm font-medium text-ink'>Proof Explorer</div>
                    <div className='text-xs text-ink/40'>View and verify cryptographic proofs</div>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
