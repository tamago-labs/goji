'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { type FlowCard, type Connection } from './types'
import { type RouteStatus } from './FlowOverlay'

interface PreviewRoutesModalProps {
  isOpen: boolean
  onClose: () => void
  onStart: () => void
  cards: FlowCard[]
  connections: Connection[]
  flowStatuses: RouteStatus[]
  flowActive: boolean
}

function getActionLabel(conn: Connection, cards: FlowCard[]): string {
  const parts: string[] = []
  
  // Check connection type
  const cardMap = new Map(cards.map((c) => [c.id, c]))
  const fromCard = cardMap.get(conn.from)
  const toCard = cardMap.get(conn.to)
  const isInvoice = fromCard?.category === 'deposit' && toCard?.category === 'wallet'
  
  if (isInvoice) {
    parts.push(conn.docName || 'Invoice')
  } else {
    if (conn.payment) parts.push('Payment')
    if (conn.document) parts.push(conn.docName || 'Document')
  }
  
  return parts.join(' + ') || '—'
}

export default function PreviewRoutesModal({ isOpen, onClose, onStart, cards, connections, flowStatuses, flowActive }: PreviewRoutesModalProps) {
  const cardMap = new Map(cards.map((c) => [c.id, c]))

  const routes = connections
    .filter((c) => {
      const from = cardMap.get(c.from)
      const to = cardMap.get(c.to)
      // Include any connection that has payment, document, or is wallet -> deposit
      if (c.payment || c.document) return true
      if (from?.category === 'wallet' && to?.category === 'deposit') return true
      return false
    })
    .map((conn) => {
      const from = cardMap.get(conn.from)
      const to = cardMap.get(conn.to)
      const status = flowStatuses.find((s) => s.routeId === conn.id)
      return { conn, from, to, status }
    })
    .filter((r) => r.from && r.to)

  const settledCount = routes.filter((r) => r.status?.status === 'settled').length
  const totalCount = routes.length

  const getStatusPill = (status: string | undefined) => {
    switch (status) {
      case 'settled': return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>Settled</span>
      case 'signing': return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700'>Signing</span>
      case 'sending': return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700'>Sending</span>
      case 'failed': return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-coral/15 text-[#C24E33]'>Failed</span>
      case 'pending': return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink/10 text-ink/40'>Pending</span>
      default: return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink/5 text-ink/30'>Draft</span>
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/30 z-50'
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-[0_20px_60px_rgba(43,36,64,0.2)] w-[700px] max-h-[80vh] overflow-hidden flex flex-col'
          >
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-ink/8'>
              <div className='flex items-center gap-3'>
                <h3 className='font-display text-lg font-semibold'>
                  {flowActive ? 'Flow Progress' : 'Preview Routes'}
                </h3>
                {flowActive && (
                  <span className='text-xs text-ink/40'>{settledCount}/{totalCount} settled</span>
                )}
              </div>
              <button
                onClick={onClose}
                className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className='flex-1 overflow-y-auto'>
              {routes.length === 0 ? (
                <div className='text-center py-12 text-ink/30 text-sm'>
                  No routes defined. Connect wallets to recipients on the canvas.
                </div>
              ) : (
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-ink/8 text-left'>
                      <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>#</th>
                      <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>From</th>
                      <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>To</th>
                      <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Amount</th>
                      <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Action</th>
                      <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((route, i) => (
                      <tr key={route.conn.id} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                        <td className='px-6 py-3 text-ink/30 font-mono text-xs'>{i + 1}</td>
                        <td className='px-6 py-3'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 rounded-full bg-mint/60' />
                            <span className='text-ink/70 truncate max-w-[120px]'>{route.from?.title}</span>
                          </div>
                        </td>
                        <td className='px-6 py-3'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 rounded-full bg-violet/60' />
                            <span className='text-ink/70 truncate max-w-[120px]'>{route.to?.title}</span>
                          </div>
                        </td>
                        <td className='px-6 py-3 font-mono text-ink/60'>
                          {route.conn.amount ? `${route.conn.amount} USDC` : '—'}
                        </td>
                        <td className='px-6 py-3 text-ink/50 text-xs'>
                          {getActionLabel(route.conn, cards)}
                        </td>
                        <td className='px-6 py-3'>
                          {getStatusPill(route.status?.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className='border-t border-ink/8 px-6 py-4 flex items-center justify-between'>
              <span className='text-xs text-ink/30'>
                {totalCount} route{totalCount !== 1 ? 's' : ''}
                {flowActive && settledCount > 0 && ` · ${settledCount} settled`}
              </span>
              <div className='flex items-center gap-3'>
                <button
                  onClick={onClose}
                  className='px-4 py-2 text-xs text-ink/50 hover:text-ink/70 transition-colors'
                >
                  {flowActive ? 'Close' : 'Cancel'}
                </button>
                {!flowActive && (
                  <button
                    onClick={() => { onStart(); onClose() }}
                    disabled={totalCount === 0}
                    className='px-6 py-2.5 bg-mint text-white text-xs font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30'
                  >
                    Start Flow
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
