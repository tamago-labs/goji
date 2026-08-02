'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, FileText } from 'lucide-react'
import { useStart } from '../../components/start/StartProvider'
import { useWallet } from '../../providers/WalletProvider'
import { addDelegate, removeDelegate, getDelegateStatus } from '../../../lib/unified-balance'
import { renderTemplate } from '../../../lib/payslipTemplates'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import ApprovalModal from '../../components/start/ApprovalModal'
import { AnimatePresence, motion } from 'framer-motion'

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
type ApprovalStatus = 'idle' | 'checking' | 'approving' | 'approved' | 'already-approved' | 'error'

export default function InvoicesPage() {
  const { apiUrl } = useStart()
  const { state: walletState } = useWallet()
  const [activeTab, setActiveTab] = useState<TabType>('incoming')
  const [connections, setConnections] = useState<Connection[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)

  // Approval modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('idle')
  const [selectedInvoice, setSelectedInvoice] = useState<Connection | null>(null)
  const [approvalError, setApprovalError] = useState('')

  // Invoice preview modal state
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewDocName, setPreviewDocName] = useState('')

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

        const allConnections: Connection[] = []
        const allCards: Card[] = []

        for (const board of boards) {
          const [connsRes, cardsRes] = await Promise.all([
            fetch(`${apiUrl}/api/connections?boardId=${board.id}`),
            fetch(`${apiUrl}/api/cards?boardId=${board.id}`)
          ])
          if (connsRes.ok) {
            const conns = await connsRes.json()
            allConnections.push(...conns.filter((c: Connection) => c.document))
          }
          if (cardsRes.ok) {
            allCards.push(...await cardsRes.json())
          }
        }

        // Filter connections where user is involved
        const filteredConnections = allConnections.filter((conn) => {
          const fromCard = allCards.find((c) => c.id === conn.from)
          const toCard = allCards.find((c) => c.id === conn.to)
          if (!fromCard || !toCard) return false

          const isSender = myAddresses.has(String(fromCard.fields?.address || '').toLowerCase())
          const isReceiver = myAddresses.has(String(toCard.fields?.address || '').toLowerCase())

          // If user has no wallets, show all (fallback)
          // If user has wallets, only show where they're involved
          return myAddresses.size === 0 || isSender || isReceiver
        })

        setConnections(filteredConnections)
        setCards(allCards)
      } catch {}
      setLoading(false)
    }
    load()
  }, [apiUrl])

  const getCard = (cardId: string) => cards.find((c) => c.id === cardId)
  const getCardTitle = (cardId: string) => getCard(cardId)?.title || 'Unknown'

  // Filter to only show invoice connections (deposit → wallet)
  const invoiceConnections = connections.filter((conn) => {
    const fromCard = getCard(conn.from)
    const toCard = getCard(conn.to)
    return fromCard?.category === 'deposit' || toCard?.category === 'deposit'
  })

  // Filter by tab (incoming vs outgoing)
  // Connection: Deposit Wallet (Payer) → Company Wallet
  // Money flows: Payer → Company
  // Invoice flows: Company → Payer (opposite direction)
  const filteredByTab = invoiceConnections.filter((conn) => {
    const fromCard = getCard(conn.from)
    const toCard = getCard(conn.to)

    // Check which wallet the user owns
    const userOwnsCompanyWallet = walletState.address && 
      String(toCard?.fields?.address || '').toLowerCase() === walletState.address.toLowerCase()
    const userOwnsDepositWallet = walletState.address && 
      String(fromCard?.fields?.address || '').toLowerCase() === walletState.address.toLowerCase()

    if (activeTab === 'incoming') {
      // Payer receives invoice (payer owns deposit wallet)
      return userOwnsDepositWallet
    } else {
      // Company sends invoice (company owns company wallet)
      return userOwnsCompanyWallet
    }
  })

  const handleApproveClick = (conn: Connection) => {
    if (!walletState.connected) {
      alert('Please connect your wallet first.')
      return
    }
    setSelectedInvoice(conn)
    setApprovalStatus('idle')
    setShowApprovalModal(true)
  }

  const handleApproveConfirm = async () => {
    if (!selectedInvoice || !walletState.adapter || !walletState.address) return

    setApprovalStatus('checking')

    try {
      // Get company wallet address
      const companyCard = getCard(selectedInvoice.to)
      const companyAddress = String(companyCard?.fields?.address || '')
      
      // Get payer wallet chain
      const payerCard = getCard(selectedInvoice.from)
      const chain = String(payerCard?.fields?.chain || 'Arc_Testnet')

      // Check if delegation already exists
      const currentStatus = await getDelegateStatus(
        walletState.adapter,
        chain,
        companyAddress
      )

      if (currentStatus === 'ready') {
        // Already delegated - just update P2P status
        setApprovalStatus('already-approved')
        await fetch(`${apiUrl}/api/connections/${selectedInvoice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delegationEnabled: 1 })
        })
        setConnections((prev) =>
          prev.map((c) => c.id === selectedInvoice.id ? { ...c, delegationEnabled: 1 } : c)
        )
        // Auto-close modal after short delay
        setTimeout(() => {
          setShowApprovalModal(false)
          setApprovalStatus('idle')
          setSelectedInvoice(null)
        }, 1500)
        return
      }

      // Need to add delegate
      setApprovalStatus('approving')
      const result = await addDelegate(
        walletState.adapter,
        chain,
        companyAddress
      )

      if (result.success) {
        setApprovalStatus('approved')
        await fetch(`${apiUrl}/api/connections/${selectedInvoice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delegationEnabled: 1 })
        })
        setConnections((prev) =>
          prev.map((c) => c.id === selectedInvoice.id ? { ...c, delegationEnabled: 1 } : c)
        )
        // Auto-close modal after short delay
        setTimeout(() => {
          setShowApprovalModal(false)
          setApprovalStatus('idle')
          setSelectedInvoice(null)
        }, 1500)
      } else {
        setApprovalStatus('error')
        setApprovalError(result.error || 'Approval failed')
      }
    } catch (err) {
      setApprovalStatus('error')
      setApprovalError((err as Error).message || 'Approval failed')
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

  const handleViewDocument = async (conn: Connection) => {
    // Find template
    let templateHtml = ''
    const defaultTemplates = [
      { id: 'standard', html: '<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:0 auto}h1{border-bottom:2px solid #7FD9B0;padding-bottom:10px;margin-bottom:5px}.field{margin:12px 0}.label{color:#666;font-size:12px}.value{font-size:16px;color:#333}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#999;font-size:11px}</style></head><body><h1>{{company}}</h1><p style="color:#666">Payment Receipt</p><div class="field"><div class="label">To</div><div class="value">{{recipient}}</div></div><div class="field"><div class="label">Amount</div><div class="value">{{amount}} USDC</div></div><div class="field"><div class="label">Date</div><div class="value">{{date}}</div></div><div class="footer">Generated by Goji</div></body></html>' }
    ]

    // Try to find template from API
    try {
      const templatesRes = await fetch(`${apiUrl}/api/templates`)
      if (templatesRes.ok) {
        const templates = await templatesRes.json()
        const found = templates.find((t: { id: string }) => t.id === conn.template)
        if (found && found.html) {
          templateHtml = found.html
        }
      }
    } catch {}

    // Fallback to default template
    if (!templateHtml) {
      const found = defaultTemplates.find((t) => t.id === conn.template) || defaultTemplates[0]
      templateHtml = found.html
    }

    // Parse customDoc for field values
    let customFields: Record<string, string> = {}
    if (conn.customDoc) {
      try {
        customFields = JSON.parse(conn.customDoc)
        console.log('[InvoicePreview] customDoc:', conn.customDoc, 'parsed:', customFields)
      } catch {}
    }
    console.log('[InvoicePreview] conn.customDoc:', conn.customDoc)

    // Render template with custom fields
    const html = renderTemplate(templateHtml, {
      company: 'Company',
      amount: conn.amount || '0',
      sender: getCardTitle(conn.from),
      recipient: getCardTitle(conn.to),
      date: new Date().toLocaleDateString(),
      txHash: conn.txHash || 'Pending...',
      ...customFields
    })

    setPreviewDocName(conn.docName || 'Invoice')
    setPreviewHtml(html)
    setShowPreview(true)
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
          ) : filteredByTab.length === 0 ? (
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
                  <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>
                    {activeTab === 'incoming' ? 'From' : 'To'}
                  </th>
                  <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Amount</th>
                  <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Status</th>
                  <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredByTab.map((conn) => {
                  const fromCard = getCard(conn.from)
                  
                  // Check which wallet the user owns
                  const userOwnsDepositWallet = walletState.address && 
                    String(fromCard?.fields?.address || '').toLowerCase() === walletState.address.toLowerCase()
                  
                  // Payer is the one with deposit wallet (sender of money, receiver of invoice)
                  const isPayer = userOwnsDepositWallet
                  
                  return (
                    <tr key={conn.id} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                      <td className='px-6 py-3 text-ink/70 font-medium'>
                        {conn.docName || 'Invoice'}
                      </td>
                      <td className='px-6 py-3 text-ink/60 text-xs truncate max-w-[120px]'>
                        {/* Show counterparty: if payer, show company; if company, show payer */}
                        {isPayer ? getCardTitle(conn.to) : getCardTitle(conn.from)}
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
                          <button
                            onClick={() => handleViewDocument(conn)}
                            className='text-[10px] text-ink/40 hover:text-ink/60 font-medium transition-colors'
                          >
                            View
                          </button>
                          {/* Only show approve/revoke for payer (sender), not company (receiver) */}
                          {isPayer && !conn.delegationEnabled && walletState.connected && (
                            <button
                              onClick={() => handleApproveClick(conn)}
                              className='text-[10px] text-mint hover:text-[#1B7A50] font-medium transition-colors'
                            >
                              Approve
                            </button>
                          )}
                          {isPayer && conn.delegationEnabled && walletState.connected && (
                            <button
                              onClick={() => handleRevoke(conn)}
                              className='text-[10px] text-coral hover:text-red-700 font-medium transition-colors'
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={showApprovalModal}
        status={approvalStatus}
        invoiceName={selectedInvoice?.docName || 'Invoice'}
        amount={selectedInvoice?.amount || '0'}
        errorMessage={approvalError}
        onClose={() => {
          setShowApprovalModal(false)
          setApprovalStatus('idle')
          setSelectedInvoice(null)
          setApprovalError('')
        }}
        onConfirm={handleApproveConfirm}
      />

      {/* Invoice Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/30 z-50'
              onClick={() => setShowPreview(false)}
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
                  onClick={() => setShowPreview(false)}
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
                  title='Invoice Preview'
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
