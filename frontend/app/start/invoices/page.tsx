'use client'

import { useState, useEffect } from 'react'
import { FileText, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useStart } from '../../components/start/StartProvider'
import { useWallet } from '../../providers/WalletProvider'
import { addDelegate, removeDelegate } from '../../../lib/unified-balance'
import { ConnectButton } from '@rainbow-me/rainbowkit'

interface Connection {
  id: string
  boardId: string
  from: string
  to: string
  amount: string | null
  payment: number | null
  document: number | null
  template: string | null
  customDoc: string | null
  docName: string | null
  txHash: string | null
  delegationEnabled: number | null
  updatedAt: number
}

interface Card {
  id: string
  title: string
  fields: Record<string, string | boolean>
}

type TabType = 'incoming' | 'outgoing'

export default function InvoicesPage() {
  const { apiUrl } = useStart()
  const { state: walletState } = useWallet()
  const [activeTab, setActiveTab] = useState<TabType>('incoming')
  const [connections, setConnections] = useState<Connection[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const boardsRes = await fetch(`${apiUrl}/api/boards`)
        if (!boardsRes.ok) { setLoading(false); return }
        const boards = await boardsRes.json()

        const allConnections: Connection[] = []
        const allCards: Card[] = []

        for (const board of boards) {
          const [connsRes, cardsRes] = await Promise.all([
            fetch(`${apiUrl}/api/connections?boardId=${board.id}`),
            fetch(`${apiUrl}/api/cards?boardId=${board.id}`)
          ])
          if (connsRes.ok) {
            const conns = await connsRes.json()
            // Only show connections with document (invoice flow)
            allConnections.push(...conns.filter((c: Connection) => c.document))
          }
          if (cardsRes.ok) {
            allCards.push(...await cardsRes.json())
          }
        }

        setConnections(allConnections)
        setCards(allCards)
      } catch {}
      setLoading(false)
    }
    load()
  }, [apiUrl])

  const getCard = (cardId: string) => cards.find((c) => c.id === cardId)
  const getCardTitle = (cardId: string) => getCard(cardId)?.title || 'Unknown'

  // Filter to only show deposit → wallet connections (invoice flow)
  const invoiceConnections = connections.filter((conn) => {
    const fromCard = getCard(conn.from)
    const toCard = getCard(conn.to)
    // Check if either card is a deposit wallet (by category)
    return fromCard?.category === 'deposit' || toCard?.category === 'deposit'
  })

  const handleApprove = async (conn: Connection) => {
    if (!walletState.adapter || !walletState.address) {
      alert('Please connect your wallet first.')
      return
    }

    setApproving(conn.id)
    try {
      // Get company wallet address (the 'to' card in invoice flow)
      const companyCard = getCard(conn.to)
      const companyAddress = String(companyCard?.fields?.address || '')
      
      // Get payer wallet chain
      const payerCard = getCard(conn.from)
      const chain = String(payerCard?.fields?.chain || 'Arc_Testnet')

      // Add delegate - authorizes company to spend from payer's balance
      const result = await addDelegate(
        walletState.adapter,
        chain,
        companyAddress
      )

      if (result.success) {
        // Update connection to mark delegation as enabled
        await fetch(`${apiUrl}/api/connections/${conn.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delegationEnabled: 1 })
        })
        
        setConnections((prev) =>
          prev.map((c) => c.id === conn.id ? { ...c, delegationEnabled: 1 } : c)
        )
        alert('Delegation approved! Company can now spend from your Unified Balance.')
      } else {
        alert(`Failed to approve: ${result.error}`)
      }
    } catch (err) {
      alert(`Error: ${(err as Error).message}`)
    } finally {
      setApproving(null)
    }
  }

  const handleRevoke = async (conn: Connection) => {
    if (!walletState.adapter || !walletState.address) return

    try {
      const companyCard = getCard(conn.to)
      const companyAddress = String(companyCard?.fields?.address || '')
      const payerCard = getCard(conn.from)
      const chain = String(payerCard?.fields?.chain || 'Arc_Testnet')

      const result = await removeDelegate(
        walletState.adapter,
        chain,
        companyAddress
      )

      if (result.success) {
        await fetch(`${apiUrl}/api/connections/${conn.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delegationEnabled: 0 })
        })
        
        setConnections((prev) =>
          prev.map((c) => c.id === conn.id ? { ...c, delegationEnabled: 0 } : c)
        )
      }
    } catch {}
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this invoice?')) return
    try {
      await fetch(`${apiUrl}/api/connections/${id}`, { method: 'DELETE' })
      setConnections((prev) => prev.filter((c) => c.id !== id))
    } catch {}
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-display text-xl font-semibold'>Invoices</h2>
        {!walletState.connected && (
          <div className='[&>button]:!bg-ink [&>button]:!text-lavender [&>button]:!rounded-xl [&>button]:!px-4 [&>button]:!py-2 [&>button]:!text-sm [&>button]:!font-medium'>
            <ConnectButton />
          </div>
        )}
        {walletState.connected && (
          <span className='text-[11px] text-ink/40'>Connected: {walletState.address?.slice(0, 8)}...</span>
        )}
      </div>

      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
        <div className='flex border-b border-ink/8'>
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
              activeTab === 'incoming'
                ? 'text-ink border-b-2 border-ink'
                : 'text-ink/40 hover:text-ink/60'
            }`}
          >
            Incoming
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
              activeTab === 'outgoing'
                ? 'text-ink border-b-2 border-ink'
                : 'text-ink/40 hover:text-ink/60'
            }`}
          >
            Outgoing
          </button>
        </div>

        <div className='min-h-[180px]'>
          {loading ? (
            <div className='flex items-center justify-center min-h-[180px]'>
              <div className='w-6 h-6 border-2 border-ink/20 border-t-ink/60 rounded-full animate-spin' />
            </div>
          ) : invoiceConnections.length === 0 ? (
            <div className='bg-card p-8 text-center'>
              <FileText className='w-8 h-8 text-ink/20 mx-auto mb-2' />
              <p className='text-ink/40 text-sm font-medium mb-1'>No invoices yet</p>
              <p className='text-ink/30 text-xs'>Create an invoice flow on the canvas to get started.</p>
            </div>
          ) : (
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-ink/5 text-left'>
                  <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Document</th>
                  <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>From</th>
                  <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Amount</th>
                  <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Status</th>
                  <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoiceConnections.map((conn) => (
                  <tr key={conn.id} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                    <td className='px-6 py-3 text-ink/70 font-medium'>
                      {conn.docName || 'Invoice'}
                    </td>
                    <td className='px-6 py-3 text-ink/60 text-xs truncate max-w-[120px]'>
                      {getCardTitle(conn.from)}
                    </td>
                    <td className='px-6 py-3 font-mono text-ink/60'>
                      {conn.amount || '0'} USDC
                    </td>
                    <td className='px-6 py-3'>
                      {conn.delegationEnabled ? (
                        <span className='flex items-center gap-1 text-[10px] font-medium text-[#1B7A50]'>
                          <CheckCircle className='w-4 h-4' />
                          Approved
                        </span>
                      ) : (
                        <span className='flex items-center gap-1 text-[10px] font-medium text-ink/40'>
                          <XCircle className='w-4 h-4' />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className='px-6 py-3'>
                      <div className='flex items-center gap-2'>
                        {!conn.delegationEnabled && walletState.connected && (
                          <button
                            onClick={() => handleApprove(conn)}
                            disabled={approving === conn.id}
                            className='text-[10px] text-mint hover:text-[#1B7A50] font-medium transition-colors disabled:opacity-30'
                          >
                            {approving === conn.id ? 'Approving...' : 'Approve'}
                          </button>
                        )}
                        {conn.delegationEnabled && walletState.connected && (
                          <button
                            onClick={() => handleRevoke(conn)}
                            className='text-[10px] text-coral hover:text-red-700 font-medium transition-colors'
                          >
                            Revoke
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(conn.id)}
                          className='text-ink/20 hover:text-coral transition-colors'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
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
