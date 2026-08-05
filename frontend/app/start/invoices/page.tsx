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
  category: string
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
  const [myAddresses, setMyAddresses] = useState<Set<string>>(new Set())
  const [flowStatuses, setFlowStatuses] = useState<Map<string, string>>(new Map())
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
        const myAddressesSet = new Set(wallets.map((w: { address: string }) => w.address.toLowerCase()))
        setMyAddresses(myAddressesSet)

        const boardsRes = await fetch(`${apiUrl}/api/boards`)
        if (!boardsRes.ok) { setLoading(false); return }
        const boards = await boardsRes.json()

        const allConnections: Connection[] = []
        const allCards: Card[] = []
        const allFlowStatuses = new Map<string, string>()

        for (const board of boards) {
          const [connsRes, cardsRes, statusRes] = await Promise.all([
            fetch(`${apiUrl}/api/connections?boardId=${board.id}`),
            fetch(`${apiUrl}/api/cards?boardId=${board.id}`),
            fetch(`${apiUrl}/api/flow-status?flowId=${board.id}`)
          ])
          if (connsRes.ok) {
            const conns = await connsRes.json()
            allConnections.push(...conns.filter((c: Connection) => c.document))
          }
          if (cardsRes.ok) {
            allCards.push(...await cardsRes.json())
          }
          if (statusRes.ok) {
            const statuses = await statusRes.json()
            for (const s of statuses) {
              allFlowStatuses.set(s.routeId, s.status)
            }
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
        setFlowStatuses(allFlowStatuses)
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
    const userOwnsCompanyWallet = myAddresses.has(String(toCard?.fields?.address || '').toLowerCase())
    const userOwnsDepositWallet = myAddresses.has(String(fromCard?.fields?.address || '').toLowerCase())

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
    // Find template from API
    let templateHtml = ''
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

    // If no template found, show error
    if (!templateHtml) {
      alert('Template not found. Make sure the terminal is running.')
      return
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

    // Get flow status for this connection
    const flowStatus = flowStatuses.get(conn.id) || 'pending'
    const status = flowStatus === 'settled' ? 'PAID' : 'UNPAID'
    const statusClass = flowStatus === 'settled' ? 'badge-paid' : 'badge-unpaid'

    // Determine direction: invoice flow is deposit → wallet
    // Company owns wallet (receives invoice), payer owns deposit (sends payment)
    const fromCard = getCard(conn.from)
    const toCard = getCard(conn.to)
    const isInvoiceFlow = fromCard?.category === 'deposit' || toCard?.category === 'deposit'

    // For invoice: sender = company (wallet), recipient = payer (deposit)
    // For payment: sender = from, recipient = to
    const sender = isInvoiceFlow ? getCardTitle(conn.to) : getCardTitle(conn.from)
    const recipient = isInvoiceFlow ? getCardTitle(conn.from) : getCardTitle(conn.to)

    // Render template with custom fields
    const html = renderTemplate(templateHtml, {
      companyName: 'Company',
      amount: conn.amount || '0',
      sender,
      recipient,
      billToName: recipient,
      date: new Date().toLocaleDateString(),
      invoiceDate: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      txHash: conn.txHash || 'Pending...',
      invoiceNumber: customFields.invoiceNumber || 'INV-' + Date.now().toString().slice(-6),
      lineItems: customFields.lineItems || `<tr><td>Service</td><td>1</td><td>${conn.amount || '0'} USDC</td><td>${conn.amount || '0'} USDC</td></tr>`,
      subtotal: conn.amount || '0',
      total: conn.amount || '0',
      effectiveDate: customFields.effectiveDate || new Date().toLocaleDateString(),
      duration: customFields.duration || '12 months',
      scope: customFields.scope || 'To be defined',
      status,
      statusClass,
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
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => {
                      const iframe = document.querySelector('iframe[title="Invoice Preview"]') as HTMLIFrameElement
                      if (iframe?.contentWindow) iframe.contentWindow.print()
                    }}
                    className='px-3 py-1.5 text-xs text-ink/60 hover:text-ink hover:bg-ink/5 rounded-lg transition-colors'
                  >
                    Print
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([previewHtml], { type: 'text/html' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${previewDocName.replace(/\s+/g, '_')}.html`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className='px-3 py-1.5 text-xs text-ink/60 hover:text-ink hover:bg-ink/5 rounded-lg transition-colors'
                  >
                    Download
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'
                  >
                    &times;
                  </button>
                </div>
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
