'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface HistorySectionProps {
  apiUrl: string
  disabled: boolean
}

interface HistoryRow {
  boardName: string
  senderName: string
  amount: string
  chain: string
  txHash: string | null
  date: number
  docName: string | null
  payslipHtml: string | null
}

export default function HistorySection({ apiUrl, disabled }: HistorySectionProps) {
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewDocName, setPreviewDocName] = useState('')

  useEffect(() => {
    async function load() {
      try {
        // 1. Get user's registered wallets (for recipient matching)
        const walletsRes = await fetch(`${apiUrl}/api/wallets`)
        if (!walletsRes.ok) { setLoading(false); return }
        const wallets = await walletsRes.json()
        const myAddresses = new Set(wallets.map((w: { address: string }) => w.address.toLowerCase()))

        // 2. Get all boards
        const boardsRes = await fetch(`${apiUrl}/api/boards`)
        if (!boardsRes.ok) { setLoading(false); return }
        const boards = await boardsRes.json()

        const allRows: HistoryRow[] = []

        for (const board of boards) {
          const [connsRes, statusRes, cardsRes] = await Promise.all([
            fetch(`${apiUrl}/api/connections?boardId=${board.id}`),
            fetch(`${apiUrl}/api/flow-status?flowId=${board.id}`),
            fetch(`${apiUrl}/api/cards?boardId=${board.id}`)
          ])

          if (!connsRes.ok || !statusRes.ok || !cardsRes.ok) continue
          const connections = await connsRes.json()
          const statuses = await statusRes.json()
          const cards = await cardsRes.json()
          const cardMap = new Map<string, { id: string; title?: string; fields?: Record<string, string | boolean> }>(cards.map((c: { id: string; title?: string; fields?: Record<string, string | boolean> }) => [c.id, c]))

          // 3. Find settled routes where user is the recipient
          for (const conn of connections) {
            const toCard = cardMap.get(conn.to)
            const fromCard = cardMap.get(conn.from)
            if (!toCard || !fromCard) continue
            if (!myAddresses.has(String(toCard.fields?.address || '').toLowerCase())) continue

            const status = statuses.find((s: { routeId: string }) => s.routeId === conn.id)
            if (!status || status.status !== 'settled') continue

            allRows.push({
              boardName: board.name,
              senderName: fromCard.title || 'Wallet',
              amount: conn.amount || '0',
              chain: String(toCard.fields?.chain || ''),
              txHash: status.txHash || null,
              date: status.updatedAt,
              docName: conn.docName || null,
              payslipHtml: status.payslipHtml || null
            })
          }
        }

        allRows.sort((a, b) => b.date - a.date)
        setRows(allRows)
      } catch {}
      setLoading(false)
    }
    load()
  }, [apiUrl])

  const openPayslip = (row: HistoryRow) => {
    if (!row.payslipHtml) return
    setPreviewDocName(row.docName || 'Document')
    setPreviewHtml(row.payslipHtml)
  }

  return (
    <div>
      <h2 className='font-display text-xl font-semibold mb-4'>History</h2>
      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
        <div className='min-h-[180px]'>
          {loading ? (
            <div className='p-6 text-center text-ink/30 text-sm'>Loading...</div>
          ) : rows.length === 0 ? (
            <div className='p-6 text-center text-ink/30 text-sm'>No payment history</div>
          ) : (
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-ink/5 text-left'>
                  <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Date</th>
                  <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>From</th>
                  <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Amount</th>
                  <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Tx</th>
                  <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                    <td className='px-6 py-3 text-ink/50 text-xs'>{new Date(row.date).toLocaleDateString()}</td>
                    <td className='px-6 py-3 text-ink/70 truncate max-w-[120px]'>{row.senderName}</td>
                    <td className='px-6 py-3 font-mono text-ink/60'>{row.amount} USDC</td>
                    <td className='px-6 py-3'>
                      {row.txHash ? (
                        <span className='text-[10px] text-ink/30 font-mono'>{row.txHash.slice(0, 8)}...</span>
                      ) : (
                        <span className='text-[10px] text-ink/20'>—</span>
                      )}
                    </td>
                    <td className='px-6 py-3'>
                      {row.payslipHtml && (
                        <button
                          onClick={() => openPayslip(row)}
                          className='text-[10px] text-mint hover:text-[#1B7A50] font-medium transition-colors'
                        >
                          {row.docName || 'View'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payslip Preview Modal */}
      <AnimatePresence>
        {previewHtml && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/30 z-50'
              onClick={() => setPreviewHtml(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-[0_20px_60px_rgba(43,36,64,0.2)] w-[500px] max-h-[80vh] overflow-hidden flex flex-col'
            >
              <div className='flex items-center justify-between px-6 py-4 border-b border-ink/8'>
                <h3 className='font-display text-sm font-semibold'>{previewDocName}</h3>
                <button
                  onClick={() => setPreviewHtml(null)}
                  className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'
                >
                  &times;
                </button>
              </div>
              <div className='flex-1 overflow-y-auto p-6'>
                <iframe
                  srcDoc={previewHtml}
                  className='w-full border border-ink/10 rounded-xl bg-white'
                  style={{ minHeight: 400 }}
                  title='Document Preview'
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
