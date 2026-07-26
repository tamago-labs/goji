'use client'

import { useState, useEffect, useCallback } from 'react'
import { NetworkArc, NetworkBase, NetworkEthereum } from '@web3icons/react'
import { spendFromUnified } from '../../../lib/unified-balance'
import { renderTemplate, DEFAULT_TEMPLATES } from '../../../lib/payslipTemplates'
import { useWallet } from '../../providers/WalletProvider'
import { type FlowCard, type Connection } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CHAIN_ICONS: Record<string, React.ComponentType<any>> = {
  Arc_Testnet: NetworkArc,
  Base_Sepolia: NetworkBase,
  Ethereum_Sepolia: NetworkEthereum
}

export interface RouteStatus {
  id: string
  flowId: string
  routeId: string
  status: 'pending' | 'signing' | 'sending' | 'settled' | 'failed'
  txHash?: string
  error?: string
  payslipHtml?: string
  updatedAt: number
}

interface FlowOverlayProps {
  boardId: string
  cards: FlowCard[]
  connections: Connection[]
  flowStatuses: RouteStatus[]
  apiUrl: string
  onStatusUpdate: (status: RouteStatus) => void
}

export default function FlowOverlay({ boardId, cards, connections, flowStatuses, apiUrl, onStatusUpdate }: FlowOverlayProps) {
  const { state: walletState, dispatch } = useWallet()
  const [signingId, setSigningId] = useState<string | null>(null)

  const cardMap = new Map(cards.map((c) => [c.id, c]))

  const routes = connections
    .filter((c) => c.payment || c.document)
    .map((conn) => {
      const from = cardMap.get(conn.from)
      const to = cardMap.get(conn.to)
      const status = flowStatuses.find((s) => s.routeId === conn.id)
      return { conn, from, to, status }
    })
    .filter((r) => r.from && r.to)

  const settledCount = routes.filter((r) => r.status?.status === 'settled').length
  const totalCount = routes.length
  const progress = totalCount > 0 ? (settledCount / totalCount) * 100 : 0

  const isMyRoute = useCallback((fromCard: FlowCard | undefined) => {
    if (!fromCard || fromCard.category !== 'wallet' || !walletState.address) return false
    return String(fromCard.fields.address).toLowerCase() === walletState.address.toLowerCase()
  }, [walletState.address])

  const handleSign = async (route: typeof routes[0]) => {
    if (!route.conn.payment || !route.from || !route.to || !walletState.adapter) return
    if (!isMyRoute(route.from)) return

    const amount = route.conn.amount || '0'
    const chain = String(route.to.fields.chain || 'Arc_Testnet')
    const recipient = String(route.to.fields.address || '')

    setSigningId(route.conn.id)

    // Create or update status to signing
    try {
      const res = await fetch(`${apiUrl}/api/flow-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowId: boardId,
          routeId: route.conn.id,
          status: 'signing'
        })
      })
      const data = await res.json()
      onStatusUpdate(data)
    } catch {}

    try {
      const result = await spendFromUnified(walletState.adapter, amount, chain, recipient)

      if (result.success) {
        // Render payslip HTML if document is attached
        let payslipHtml = null
        if (route.conn.document && route.conn.template) {
          const template = DEFAULT_TEMPLATES.find((t) => t.id === route.conn.template)
          if (template) {
            payslipHtml = renderTemplate(template, {
              amount: amount || '0',
              sender: route.from?.title || 'Wallet',
              recipient: route.to?.title || 'Recipient',
              date: new Date().toLocaleDateString(),
              txHash: result.txHash || 'N/A'
            })
          }
        }

        // Update to settled
        const existing = flowStatuses.find((s) => s.routeId === route.conn.id)
        if (existing) {
          const res = await fetch(`${apiUrl}/api/flow-status/${existing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'settled', txHash: result.txHash, payslipHtml })
          })
          onStatusUpdate({ ...existing, status: 'settled', txHash: result.txHash || undefined, payslipHtml: payslipHtml || undefined })
        }
      } else {
        const existing = flowStatuses.find((s) => s.routeId === route.conn.id)
        if (existing) {
          await fetch(`${apiUrl}/api/flow-status/${existing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'failed', error: result.error })
          })
          onStatusUpdate({ ...existing, status: 'failed', error: result.error })
        }
      }
    } catch (err) {
      const existing = flowStatuses.find((s) => s.routeId === route.conn.id)
      if (existing) {
        await fetch(`${apiUrl}/api/flow-status/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'failed', error: (err as Error).message })
        })
        onStatusUpdate({ ...existing, status: 'failed', error: (err as Error).message })
      }
    } finally {
      setSigningId(null)
    }
  }

  const getStatusPill = (status: string | undefined) => {
    switch (status) {
      case 'settled': return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>Settled</span>
      case 'signing': return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700'>Signing</span>
      case 'sending': return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700'>Sending</span>
      case 'failed': return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-coral/15 text-[#C24E33]'>Failed</span>
      default: return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink/10 text-ink/40'>Pending</span>
    }
  }

  return (
    <div className='absolute bottom-0 left-0 right-0 bg-card border-t border-ink/8 z-40 flex flex-col' style={{ maxHeight: '40vh' }}>
      {/* Header */}
      <div className='flex items-center justify-between px-6 py-3 border-b border-ink/8'>
        <div className='flex items-center gap-4'>
          <span className='text-sm font-medium text-ink'>Routes</span>
          <span className='text-xs text-ink/40'>{settledCount} / {totalCount} settled</span>
        </div>
        <div className='w-32 h-1.5 bg-ink/10 rounded-full overflow-hidden'>
          <div className='h-full bg-mint rounded-full transition-all duration-500' style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Table */}
      <div className='flex-1 overflow-y-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-ink/5 text-left'>
              <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>#</th>
              <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>From</th>
              <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>To</th>
              <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Amount</th>
              <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Status</th>
              <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Action</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route, i) => {
              const mine = isMyRoute(route.from)
              const status = route.status?.status
              return (
                <tr key={route.conn.id} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                  <td className='px-6 py-2 text-ink/30 font-mono text-xs'>{i + 1}</td>
                  <td className='px-6 py-2'>
                    <div className='flex items-center gap-2'>
                      <div className={`w-2 h-2 rounded-full ${mine ? 'bg-mint' : 'bg-ink/20'}`} />
                      <span className='text-ink/70 truncate max-w-[120px] text-xs'>{route.from?.title}</span>
                      {mine && <span className='text-[9px] text-mint'>(you)</span>}
                    </div>
                  </td>
                  <td className='px-6 py-2'>
                    <div className='flex items-center gap-2'>
                      <div className='w-2 h-2 rounded-full bg-violet/60' />
                      <span className='text-ink/70 truncate max-w-[120px] text-xs'>{route.to?.title}</span>
                    </div>
                  </td>
                  <td className='px-6 py-2 font-mono text-ink/60 text-xs'>
                    {route.conn.amount ? `${route.conn.amount} USDC` : '—'}
                  </td>
                  <td className='px-6 py-2'>
                    {getStatusPill(status)}
                  </td>
                  <td className='px-6 py-2'>
                    {mine && route.conn.payment && status !== 'settled' && status !== 'failed' && (
                      <button
                        onClick={() => handleSign(route)}
                        disabled={signingId === route.conn.id}
                        className='text-[10px] text-mint hover:text-[#1B7A50] font-medium transition-colors disabled:opacity-30'
                      >
                        {signingId === route.conn.id ? 'Signing...' : 'Sign'}
                      </button>
                    )}
                    {route.status?.txHash && (
                      <span className='text-[9px] text-ink/30 font-mono'>
                        {route.status.txHash.slice(0, 8)}...
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
