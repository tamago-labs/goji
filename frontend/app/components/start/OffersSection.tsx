'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpFromLine } from 'lucide-react'

interface OffersSectionProps {
  apiUrl: string
  disabled: boolean
}

interface RouteRow {
  boardId: string
  boardName: string
  connectionId: string
  recipientName: string
  recipientAddress: string
  amount: string
  status: string
  chain: string
}

export default function OffersSection({ apiUrl, disabled }: OffersSectionProps) {
  const router = useRouter()
  const [routes, setRoutes] = useState<RouteRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // 1. Get user's registered wallets
        const walletsRes = await fetch(`${apiUrl}/api/wallets`)
        if (!walletsRes.ok) return
        const wallets = await walletsRes.json()
        const myAddresses = new Set(wallets.map((w: { address: string }) => w.address.toLowerCase()))
        if (myAddresses.size === 0) { setLoading(false); return }

        // 2. Get all boards
        const boardsRes = await fetch(`${apiUrl}/api/boards`)
        if (!boardsRes.ok) return
        const boards = await boardsRes.json()

        const allRoutes: RouteRow[] = []

        for (const board of boards) {
          // 3. Get connections and flow statuses for this board
          const [connsRes, statusRes, cardsRes] = await Promise.all([
            fetch(`${apiUrl}/api/connections?boardId=${board.id}`),
            fetch(`${apiUrl}/api/flow-status?flowId=${board.id}`),
            fetch(`${apiUrl}/api/cards?boardId=${board.id}`)
          ])

          if (!connsRes.ok || !statusRes.ok || !cardsRes.ok) continue
          const connections = await connsRes.json()
          const statuses = await statusRes.json()
          const cards = await cardsRes.json()
          const cardMap = new Map(cards.map((c: { id: string }) => [c.id, c]))

          // 4. Find routes where user owns the "from" wallet
          for (const conn of connections) {
            if (!conn.payment) continue
            const fromCard = cardMap.get(conn.from)
            const toCard = cardMap.get(conn.to)
            if (!fromCard || !toCard) continue
            if (!myAddresses.has(String(fromCard.fields?.address || '').toLowerCase())) continue

            const status = statuses.find((s: { routeId: string }) => s.routeId === conn.id)
            allRoutes.push({
              boardId: board.id,
              boardName: board.name,
              connectionId: conn.id,
              recipientName: toCard.title || 'Recipient',
              recipientAddress: String(toCard.fields?.address || ''),
              amount: conn.amount || '0',
              status: status?.status || 'pending',
              chain: String(toCard.fields?.chain || '')
            })
          }
        }

        setRoutes(allRoutes)
      } catch {}
      setLoading(false)
    }
    load()
  }, [apiUrl])

  const pendingCount = routes.filter((r) => r.status === 'pending').length

  return (
    <div>
      <h2 className='font-display text-xl font-semibold mb-4'>Offers</h2>
      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
        {/* Tabs */}
        <div className='flex border-b border-ink/8'>
          <button className='flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-ink border-b-2 border-ink'>
            <ArrowUpFromLine className='w-4 h-4' />
            Outgoing
            <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-ink/10 text-ink/50'>
              {pendingCount}
            </span>
          </button>
          <button className='flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-ink/20 cursor-not-allowed' disabled>
            Incoming
          </button>
          <button className='flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-ink/20 cursor-not-allowed' disabled>
            Deposits
          </button>
        </div>

        {/* Content */}
        <div className='min-h-[180px]'>
          {loading ? (
            <div className='p-6 text-center text-ink/30 text-sm'>Loading...</div>
          ) : routes.length === 0 ? (
            <div className='p-6 text-center text-ink/30 text-sm'>No outgoing payments</div>
          ) : (
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
                {routes.map((route) => (
                  <tr
                    key={`${route.boardId}-${route.connectionId}`}
                    onClick={() => router.push(`/flow/${route.boardId}`)}
                    className='border-b border-ink/5 hover:bg-ink/3 cursor-pointer transition-colors'
                  >
                    <td className='px-6 py-3 text-ink/70 truncate max-w-[140px]'>{route.boardName}</td>
                    <td className='px-6 py-3 text-ink/50 truncate max-w-[120px]'>{route.recipientName}</td>
                    <td className='px-6 py-3 font-mono text-ink/60'>{route.amount} USDC</td>
                    <td className='px-6 py-3'>
                      {route.status === 'settled' ? (
                        <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>Settled</span>
                      ) : route.status === 'failed' ? (
                        <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-coral/15 text-[#C24E33]'>Failed</span>
                      ) : (
                        <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700'>Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
