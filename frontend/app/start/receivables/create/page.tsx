'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { usePublicClient, useWalletClient } from 'wagmi'
import { X, Loader2, Search, CheckCircle, Plus } from 'lucide-react'
import { useStart } from '../../../components/start/StartProvider'
import { RECEIVABLE_FACTORY_ABI, RECEIVABLE_FACTORY_ADDRESS } from '../../../../lib/receivableFactory'

interface PendingFlow {
  id: string
  boardId: string
  boardName: string
  routeId: string
  status: string
  from: string
  to: string
  amount: string
  docName: string
  updatedAt: number
}

interface SettledProof {
  id: string
  flowName: string
  merkleRoot: string
  from: string
  to: string
  amount: string
  docName: string
  updatedAt: number
}

interface Terms {
  name: string
  type: 'invoice' | 'payroll' | 'contractor'
  amount: string
  interestRate: string
  minInvestment: string
  expiryDays: string
}

export default function CreateReceivablePage() {
  const router = useRouter()
  const { apiUrl } = useStart()
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [pendingFlows, setPendingFlows] = useState<PendingFlow[]>([])
  const [settledProofs, setSettledProofs] = useState<SettledProof[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [searchPending, setSearchPending] = useState('')
  const [searchProofs, setSearchProofs] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedFlow, setSelectedFlow] = useState<PendingFlow | null>(null)
  const [selectedProofs, setSelectedProofs] = useState<SettledProof[]>([])
  const [terms, setTerms] = useState<Terms>({
    name: '',
    type: 'invoice',
    amount: '',
    interestRate: '20',
    minInvestment: '100',
    expiryDays: '90'
  })

  // Load data
  useEffect(() => {
    async function load() {
      try {
        const boardsRes = await fetch(`${apiUrl}/api/boards`)
        if (!boardsRes.ok) { setLoading(false); return }
        const boards = await boardsRes.json()

        const pending: PendingFlow[] = []
        const settled: SettledProof[] = []

        for (const board of boards) {
          const [statusRes, connRes, cardsRes] = await Promise.all([
            fetch(`${apiUrl}/api/flow-status?flowId=${board.id}`),
            fetch(`${apiUrl}/api/connections?boardId=${board.id}`),
            fetch(`${apiUrl}/api/cards?boardId=${board.id}`)
          ])

          if (!statusRes.ok) continue
          const statuses = await statusRes.json()
          const connections = connRes.ok ? await connRes.json() : []
          const cards = cardsRes.ok ? await cardsRes.json() : []

          const connMap = new Map(connections.map((c: any) => [c.id, c]))
          const cardMap = new Map(cards.map((c: any) => [c.id, c]))

          for (const s of statuses) {
            const conn = connMap.get(s.routeId)
            if (!conn) continue

            const fromCard = cardMap.get(conn.from)
            const toCard = cardMap.get(conn.to)

            const base = {
              id: s.id,
              flowName: board.name,
              from: fromCard?.title || 'Unknown',
              to: toCard?.title || 'Unknown',
              amount: conn.amount || '0',
              docName: conn.docName || 'Document',
              updatedAt: s.updatedAt
            }

            if (s.status === 'pending') {
              pending.push({
                ...base,
                boardId: board.id,
                routeId: s.routeId,
                status: s.status
              })
            } else if (s.status === 'settled' && s.merkleRoot) {
              settled.push({
                ...base,
                merkleRoot: s.merkleRoot
              })
            }
          }
        }

        pending.sort((a, b) => b.updatedAt - a.updatedAt)
        settled.sort((a, b) => b.updatedAt - a.updatedAt)

        setPendingFlows(pending)
        setSettledProofs(settled)
      } catch (e) {
        console.error('Failed to load data:', e)
      }
      setLoading(false)
    }
    load()
  }, [apiUrl])

  const openModal = (flow: PendingFlow) => {
    setSelectedFlow(flow)
    setSelectedProofs([])
    setTerms({
      name: flow.docName || flow.boardName,
      type: 'invoice',
      amount: flow.amount,
      interestRate: '20',
      minInvestment: '100',
      expiryDays: '90'
    })
    setShowModal(true)
  }

  const toggleProof = (proof: SettledProof) => {
    setSelectedProofs(prev =>
      prev.find(p => p.id === proof.id)
        ? prev.filter(p => p.id !== proof.id)
        : [...prev, proof]
    )
  }

  const handleCreate = async () => {
    if (!walletClient || !address || !publicClient || !selectedFlow) return

    setCreating(true)
    try {
      const proofHashes = selectedProofs.map(p => p.merkleRoot as `0x${string}`)
      const amount = BigInt(Math.floor(parseFloat(terms.amount) * 1e6))
      const interestRate = BigInt(Math.floor(parseFloat(terms.interestRate) * 100))
      const minInvest = BigInt(Math.floor(parseFloat(terms.minInvestment) * 1e6))
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + parseInt(terms.expiryDays) * 86400)

      const fee = await publicClient.readContract({
        address: RECEIVABLE_FACTORY_ADDRESS,
        abi: RECEIVABLE_FACTORY_ABI,
        functionName: 'feeAmount'
      }) as bigint

      const { request } = await publicClient.simulateContract({
        address: RECEIVABLE_FACTORY_ADDRESS,
        abi: RECEIVABLE_FACTORY_ABI,
        functionName: 'createReceivable',
        args: [
          terms.name,
          terms.type,
          amount,
          interestRate,
          minInvest,
          expiresAt,
          proofHashes
        ],
        value: fee,
        account: address
      })

      const hash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash })

      setShowModal(false)
      router.push('/start/receivables/list')
    } catch (e) {
      console.error('Failed to create receivable:', e)
      alert('Failed to create receivable. Check console for details.')
    }
    setCreating(false)
  }

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return '$0'
    return `$${num.toLocaleString()}`
  }

  const filteredPending = pendingFlows.filter(f =>
    !searchPending ||
    f.flowName.toLowerCase().includes(searchPending.toLowerCase()) ||
    f.docName.toLowerCase().includes(searchPending.toLowerCase()) ||
    f.from.toLowerCase().includes(searchPending.toLowerCase()) ||
    f.to.toLowerCase().includes(searchPending.toLowerCase())
  )

  const filteredProofs = settledProofs.filter(p =>
    !searchProofs ||
    p.flowName.toLowerCase().includes(searchProofs.toLowerCase()) ||
    p.docName.toLowerCase().includes(searchProofs.toLowerCase()) ||
    p.merkleRoot.toLowerCase().includes(searchProofs.toLowerCase())
  )

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='font-display text-xl font-semibold'>Create Receivable</h2>
          <p className='text-xs text-ink/40 mt-1'>Select a pending flow to create a receivable asset</p>
        </div>
      </div>

      {/* Pending Flows Table */}
      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
        <div className='px-6 py-3 border-b border-ink/8 flex items-center justify-between'>
          <span className='text-xs text-ink/40 uppercase tracking-wider'>Pending Flows ({filteredPending.length})</span>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30' />
            <input
              value={searchPending}
              onChange={(e) => setSearchPending(e.target.value)}
              placeholder='Search flows...'
              className='text-xs text-ink bg-ink/5 border border-ink/10 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-ink/20 w-48'
            />
          </div>
        </div>

        {loading ? (
          <div className='flex items-center justify-center min-h-[200px]'>
            <Loader2 className='w-6 h-6 text-ink/40 animate-spin' />
          </div>
        ) : filteredPending.length === 0 ? (
          <div className='p-8 text-center'>
            <p className='text-ink/40 text-sm font-medium mb-1'>No pending flows</p>
            <p className='text-ink/30 text-xs'>Create a payment flow first, then come back to create a receivable.</p>
          </div>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-ink/5 text-left'>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Date</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Flow</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Counter Party</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Amount</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'></th>
              </tr>
            </thead>
            <tbody>
              {filteredPending.map((flow) => (
                <tr key={flow.id} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                  <td className='px-6 py-3 text-ink/50 text-xs'>
                    {new Date(flow.updatedAt).toLocaleDateString()}
                  </td>
                  <td className='px-6 py-3 text-ink/70 text-sm'>{flow.flowName}</td>
                  <td className='px-6 py-3 text-ink/60 text-xs max-w-[120px] truncate'>{flow.from}</td>
                  <td className='px-6 py-3 font-mono text-ink/60 text-sm'>{formatAmount(flow.amount)}</td>
                  <td className='px-6 py-3'>
                    <button
                      onClick={() => openModal(flow)}
                      className='flex items-center gap-1 text-[10px] text-mint hover:text-[#1B7A50] font-medium transition-colors'
                    >
                      <Plus className='w-3 h-3' />
                      Create Receivable
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Receivable Modal */}
      {showModal && selectedFlow && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <div className='absolute inset-0 bg-black/40' onClick={() => setShowModal(false)} />
          <div className='relative bg-card rounded-2xl shadow-[0_20px_60px_rgba(43,36,64,0.25)] w-[700px] max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150'>
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-ink/8'>
              <div>
                <h3 className='font-display text-lg font-semibold'>Create Receivable</h3>
                <p className='text-xs text-ink/40 mt-0.5'>From: {selectedFlow.docName} — {formatAmount(selectedFlow.amount)}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'
              >
                <X className='w-4 h-4' />
              </button>
            </div>

            {/* Content */}
            <div className='flex-1 overflow-y-auto p-6'>
              {/* Terms Section */}
              <div className='mb-6'>
                <h4 className='text-xs text-ink/40 uppercase tracking-wider mb-3'>Terms</h4>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs text-ink/40 mb-1'>Name</label>
                    <input
                      value={terms.name}
                      onChange={(e) => setTerms({ ...terms, name: e.target.value })}
                      className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-2 focus:outline-none focus:border-ink/20'
                    />
                  </div>
                  <div>
                    <label className='block text-xs text-ink/40 mb-1'>Type</label>
                    <select
                      value={terms.type}
                      onChange={(e) => setTerms({ ...terms, type: e.target.value as any })}
                      className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-2 focus:outline-none focus:border-ink/20'
                    >
                      <option value='invoice'>Invoice</option>
                      <option value='payroll'>Payroll</option>
                      <option value='contractor'>Contractor</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-xs text-ink/40 mb-1'>Amount (USDC)</label>
                    <input
                      type='number'
                      value={terms.amount}
                      onChange={(e) => setTerms({ ...terms, amount: e.target.value })}
                      className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-2 focus:outline-none focus:border-ink/20'
                    />
                  </div>
                  <div>
                    <label className='block text-xs text-ink/40 mb-1'>Interest Rate (%)</label>
                    <input
                      type='number'
                      value={terms.interestRate}
                      onChange={(e) => setTerms({ ...terms, interestRate: e.target.value })}
                      className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-2 focus:outline-none focus:border-ink/20'
                    />
                  </div>
                  <div>
                    <label className='block text-xs text-ink/40 mb-1'>Min Investment (USDC)</label>
                    <input
                      type='number'
                      value={terms.minInvestment}
                      onChange={(e) => setTerms({ ...terms, minInvestment: e.target.value })}
                      className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-2 focus:outline-none focus:border-ink/20'
                    />
                  </div>
                  <div>
                    <label className='block text-xs text-ink/40 mb-1'>Expiry (days)</label>
                    <input
                      type='number'
                      value={terms.expiryDays}
                      onChange={(e) => setTerms({ ...terms, expiryDays: e.target.value })}
                      className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-2 focus:outline-none focus:border-ink/20'
                    />
                  </div>
                </div>
              </div>

              {/* Proofs Section */}
              <div>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='text-xs text-ink/40 uppercase tracking-wider'>
                    Collateral Proofs ({selectedProofs.length} selected)
                  </h4>
                  <div className='relative'>
                    <Search className='absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink/30' />
                    <input
                      value={searchProofs}
                      onChange={(e) => setSearchProofs(e.target.value)}
                      placeholder='Search proofs...'
                      className='text-[10px] text-ink bg-ink/5 border border-ink/10 rounded-lg pl-7 pr-2 py-1 focus:outline-none focus:border-ink/20 w-36'
                    />
                  </div>
                </div>

                {settledProofs.length === 0 ? (
                  <div className='bg-ink/[0.02] rounded-xl p-4 text-center'>
                    <p className='text-xs text-ink/40'>No settled proofs available</p>
                    <p className='text-[10px] text-ink/30 mt-1'>Settle some payment flows first to use as collateral</p>
                  </div>
                ) : (
                  <div className='space-y-1 max-h-[200px] overflow-y-auto'>
                    {filteredProofs.map((proof) => {
                      const isSelected = selectedProofs.find(p => p.id === proof.id)
                      return (
                        <div
                          key={proof.id}
                          onClick={() => toggleProof(proof)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-mint/5 border border-mint/20' : 'hover:bg-ink/3 border border-transparent'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-mint border-mint' : 'border-ink/20'
                          }`}>
                            {isSelected && <CheckCircle className='w-3 h-3 text-white' />}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2'>
                              <span className='text-xs text-ink/70 font-medium'>{proof.docName}</span>
                              <span className='text-[10px] text-ink/40'>•</span>
                              <span className='text-[10px] text-ink/40'>{proof.flowName}</span>
                            </div>
                            <div className='text-[10px] text-ink/40 font-mono truncate'>{proof.merkleRoot}</div>
                          </div>
                          <span className='text-xs text-ink/60 font-mono flex-shrink-0'>{formatAmount(proof.amount)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className='mt-6 bg-ink/[0.02] rounded-xl p-4'>
                <div className='flex items-center justify-between text-xs mb-2'>
                  <span className='text-ink/40'>Platform Fee</span>
                  <span className='text-ink/60'>1 USDC</span>
                </div>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-ink/40'>Proofs Selected</span>
                  <span className='text-ink/60'>{selectedProofs.length}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className='px-6 py-4 border-t border-ink/8 flex items-center justify-end gap-3'>
              <button
                onClick={() => setShowModal(false)}
                className='px-4 py-2 text-xs text-ink/40 hover:text-ink/60 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !terms.name || !terms.amount || selectedProofs.length === 0}
                className='px-4 py-2 bg-ink text-lavender text-xs font-medium rounded-xl hover:opacity-90 disabled:opacity-30 transition-opacity'
              >
                {creating ? (
                  <span className='flex items-center gap-2'>
                    <Loader2 className='w-3 h-3 animate-spin' />
                    Creating...
                  </span>
                ) : (
                  'Create Receivable'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
