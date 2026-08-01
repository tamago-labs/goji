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
    .filter((c) => {
      const from = cardMap.get(c.from)
      const to = cardMap.get(c.to)
      // Include regular payment/document connections
      if (c.payment || c.document) return true
      // Include invoice connections (wallet -> deposit)
      if (from?.category === 'wallet' && to?.category === 'deposit' && c.document) return true
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
  const progress = totalCount > 0 ? (settledCount / totalCount) * 100 : 0

  // Check if current user is the sender (for pay flow) or receiver (for invoice flow)
  const isMyRoute = useCallback((fromCard: FlowCard | undefined, toCard: FlowCard | undefined) => {
    if (!walletState.address) return false
    
    // Pay flow: wallet → recipient - sender signs
    if (fromCard?.category === 'wallet' && toCard?.category === 'recipient') {
      return String(fromCard.fields.address).toLowerCase() === walletState.address.toLowerCase()
    }
    
    // Invoice flow: deposit → wallet - receiver (company) signs
    if (fromCard?.category === 'deposit' && toCard?.category === 'wallet') {
      return String(toCard.fields.address).toLowerCase() === walletState.address.toLowerCase()
    }
    
    return false
  }, [walletState.address])

  const handleSign = async (route: typeof routes[0]) => {
    if (!route.from || !route.to || !walletState.adapter) return
    
    // Determine flow type
    const isInvoice = route.from.category === 'deposit' && route.to.category === 'wallet'
    const isPayFlow = route.from.category === 'wallet' && route.to.category === 'recipient'
    
    // Check ownership
    if (!isMyRoute(route.from, route.to)) return
    
    // Check flags
    if (isPayFlow && !route.conn.payment) return
    if (isInvoice && !route.conn.document) return

    // Check delegation for invoice flow - fetch latest connection data
    if (isInvoice) {
      // Refresh connection data to get latest delegation status
      try {
        const connRes = await fetch(`${apiUrl}/api/connections?boardId=${boardId}`)
        if (connRes.ok) {
          const conns = await connRes.json()
          const latestConn = conns.find((c: { id: string }) => c.id === route.conn.id)
          if (latestConn && !latestConn.delegationEnabled) {
            alert('Delegation is not enabled for this invoice. Please enable delegation in the Invoices page first.')
            return
          }
        }
      } catch {}
    }

    const amount = route.conn.amount || '0'
    
    // For pay flow: sender pays recipient
    // For invoice flow: payer (deposit) pays company (wallet)
    let sourceChain: string
    let recipientAddress: string
    
    if (isPayFlow) {
      sourceChain = String(route.to.fields.chain || 'Arc_Testnet')
      recipientAddress = String(route.to.fields.address || '')
    } else {
      // Invoice flow: deposit wallet pays company wallet
      sourceChain = String(route.from.fields.chain || 'Arc_Testnet')
      recipientAddress = String(route.to.fields.address || '')
    }

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
      // For invoice flow, we need to use the deposit wallet's adapter
      // For now, use current user's adapter (Payer should be logged in)
      const result = await spendFromUnified(walletState.adapter, amount, sourceChain, recipientAddress)

      if (result.success) {
        // Render payslip HTML if document is attached
        let payslipHtml = null
        if (route.conn.document && route.conn.template) {
          // Try to find template from API first, then from defaults
          let templateHtml = null
          const defaultTemplate = DEFAULT_TEMPLATES.find((t) => t.id === route.conn.template)
          if (defaultTemplate && defaultTemplate.html) {
            templateHtml = defaultTemplate.html
          } else {
            try {
              const templatesRes = await fetch(`${apiUrl}/api/templates`)
              if (templatesRes.ok) {
                const templates = await templatesRes.json()
                const found = templates.find((t: { id: string }) => t.id === route.conn.template)
                if (found && found.html) {
                  templateHtml = found.html
                }
              }
            } catch {}
          }
          if (templateHtml) {
            // Parse customDoc for field values
            let customFields: Record<string, string> = {}
            if (route.conn.customDoc) {
              try {
                customFields = JSON.parse(route.conn.customDoc)
              } catch {}
            }
            
            payslipHtml = renderTemplate(templateHtml, {
              company: 'Company',
              amount: amount || '0',
              sender: route.from?.title || 'Wallet',
              recipient: route.to?.title || 'Recipient',
              date: new Date().toLocaleDateString(),
              txHash: result.txHash || 'N/A',
              ...customFields
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
      case 'approved': return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>Approved</span>
      case 'awaiting': return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'>Awaiting Approval</span>
      case 'failed': return <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-coral/15 text-coral'>Failed</span>
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
              const mine = isMyRoute(route.from, route.to)
              const status = route.status?.status
              const isInvoice = route.from?.category === 'deposit' && route.to?.category === 'wallet'
              const delegationEnabled = route.conn.delegationEnabled
              
              // Determine display status for invoice flow
              let displayStatus = status
              if (isInvoice && status !== 'settled') {
                displayStatus = delegationEnabled ? 'approved' : 'awaiting'
              }

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
                    {getStatusPill(displayStatus)}
                  </td>
                  <td className='px-6 py-2'>
                    {mine && (route.conn.payment || route.conn.document) && status !== 'settled' && status !== 'failed' && delegationEnabled && (
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
