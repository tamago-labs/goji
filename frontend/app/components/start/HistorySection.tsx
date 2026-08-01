'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'

interface HistorySectionProps {
  apiUrl: string
}

interface PaymentRow {
  boardName: string
  counterpartyName: string
  amount: string
  chain: string
  txHash: string | null
  date: number
  status: string
  docName: string | null
  payslipHtml: string | null
  direction: 'incoming' | 'outgoing'
}

type TabType = 'incoming' | 'outgoing'

export default function HistorySection({ apiUrl }: HistorySectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('incoming')
  const [incomingRows, setIncomingRows] = useState<PaymentRow[]>([])
  const [outgoingRows, setOutgoingRows] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewDocName, setPreviewDocName] = useState('')

  const rows = activeTab === 'incoming' ? incomingRows : outgoingRows

  useEffect(() => {
    async function load() {
      try {
        // Get user's registered wallets
        const walletsRes = await fetch(`${apiUrl}/api/wallets`)
        const wallets = walletsRes.ok ? await walletsRes.json() : []
        const myAddresses = new Set(wallets.map((w: { address: string }) => w.address.toLowerCase()))

        const boardsRes = await fetch(`${apiUrl}/api/boards`)
        if (!boardsRes.ok) { setLoading(false); return }
        const boards = await boardsRes.json()

        const incoming: PaymentRow[] = []
        const outgoing: PaymentRow[] = []

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
          const cardMap = new Map<string, { id: string; title?: string; fields?: Record<string, string | boolean> }>(
            cards.map((c: { id: string; title?: string; fields?: Record<string, string | boolean> }) => [c.id, c])
          )

          for (const conn of connections) {
            // Only show connections with payment or document
            if (!conn.payment && !conn.document) continue

            const toCard = cardMap.get(conn.to)
            const fromCard = cardMap.get(conn.from)
            if (!toCard || !fromCard) continue

            // Check if user is involved (sender or receiver)
            const isSender = myAddresses.has(String(fromCard.fields?.address || '').toLowerCase())
            const isReceiver = myAddresses.has(String(toCard.fields?.address || '').toLowerCase())
            
            // If user has no wallets, show all (fallback)
            // If user has wallets, only show where they're involved
            if (myAddresses.size > 0 && !isSender && !isReceiver) continue

            const status = statuses.find((s: { routeId: string }) => s.routeId === conn.id)
            const statusText = status?.status || 'pending'

            // Parse customDoc for invoice data
            let customData = {}
            if (conn.customDoc) {
              try { customData = JSON.parse(conn.customDoc) } catch {}
            }

            const row: PaymentRow = {
              boardName: board.name,
              counterpartyName: fromCard.title || 'Wallet',
              amount: conn.amount || '0',
              chain: String(toCard.fields?.chain || ''),
              txHash: status?.txHash || null,
              date: status?.updatedAt || conn.updatedAt || 0,
              status: statusText,
              docName: conn.docName || null,
              payslipHtml: status?.payslipHtml || null,
              direction: 'incoming'
            }

            incoming.push(row)
          }
        }

        incoming.sort((a, b) => b.date - a.date)
        outgoing.sort((a, b) => b.date - a.date)

        setIncomingRows(incoming)
        setOutgoingRows(outgoing)
      } catch {}
      setLoading(false)
    }
    load()
  }, [apiUrl])

  const openPayslip = (row: PaymentRow) => {
    if (!row.payslipHtml) return
    setPreviewDocName(row.docName || 'Document')
    setPreviewHtml(row.payslipHtml)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'settled':
        return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>Settled</span>
      case 'pending':
        return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'>Pending</span>
      case 'failed':
        return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-coral/15 text-coral'>Failed</span>
      default:
        return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink/10 text-ink/50'>{status}</span>
    }
  }

  const getEmptyIcon = () => {
    return activeTab === 'incoming'
      ? <ArrowDownToLine className='w-8 h-8 text-ink/20 mx-auto mb-2' />
      : <ArrowUpFromLine className='w-8 h-8 text-ink/20 mx-auto mb-2' />
  }

  const getEmptyText = () => {
    return activeTab === 'incoming'
      ? { title: 'No incoming payments', desc: 'Payments sent to your wallet will appear here.' }
      : { title: 'No outgoing payments', desc: 'Create a flow to send your first payment.' }
  }

  const getTableHeaders = () => {
    if (activeTab === 'incoming') {
      return ['Date', 'From', 'Amount', 'Document', 'Status', 'Tx', '']
    }
    return ['Date', 'To', 'Amount', 'Document', 'Status', 'Tx', '']
  }

  return (
    <div>
      <h2 className='font-display text-xl font-semibold mb-4'>Payments</h2>

      {/* Tabs */}
      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
        <div className='flex border-b border-ink/8'>
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
              activeTab === 'incoming'
                ? 'text-ink border-b-2 border-ink'
                : 'text-ink/40 hover:text-ink/60'
            }`}
          >
            <ArrowDownToLine className='w-4 h-4' />
            Incoming
            {incomingRows.length > 0 && (
              <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-ink/10 text-ink/50'>
                {incomingRows.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
              activeTab === 'outgoing'
                ? 'text-ink border-b-2 border-ink'
                : 'text-ink/40 hover:text-ink/60'
            }`}
          >
            <ArrowUpFromLine className='w-4 h-4' />
            Outgoing
            {outgoingRows.length > 0 && (
              <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-ink/10 text-ink/50'>
                {outgoingRows.length}
              </span>
            )}
          </button>
        </div>

        <div className='min-h-[180px]'>
          {loading ? (
            <div className='flex items-center justify-center min-h-[180px]'>
              <div className='w-6 h-6 border-2 border-ink/20 border-t-ink/60 rounded-full animate-spin' />
            </div>
          ) : rows.length === 0 ? (
            <div className='bg-card rounded-2xl p-8 text-center'>
              {getEmptyIcon()}
              <p className='text-ink/40 text-sm font-medium mb-1'>{getEmptyText().title}</p>
              <p className='text-ink/30 text-xs'>{getEmptyText().desc}</p>
            </div>
          ) : (
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-ink/5 text-left'>
                  {getTableHeaders().map((header, i) => (
                    <th key={i} className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                    <td className='px-6 py-3 text-ink/50 text-xs'>{new Date(row.date).toLocaleDateString()}</td>
                    <td className='px-6 py-3 text-ink/70 truncate max-w-[120px]'>{row.counterpartyName}</td>
                    <td className='px-6 py-3 font-mono text-ink/60'>{row.amount} USDC</td>
                    <td className='px-6 py-3'>
                      {row.docName ? (
                        <button
                          onClick={() => openPayslip(row)}
                          className='text-[10px] text-mint hover:text-[#1B7A50] font-medium transition-colors'
                        >
                          {row.docName}
                        </button>
                      ) : (
                        <span className='text-[10px] text-ink/20'>—</span>
                      )}
                    </td>
                    <td className='px-6 py-3'>{getStatusBadge(row.status)}</td>
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
