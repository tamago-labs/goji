'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { usePublicClient, useWalletClient } from 'wagmi'
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Loader2, Search, ExternalLink } from 'lucide-react'
import { useStart } from '../../../components/start/StartProvider'
import { RECEIVABLE_FACTORY_ABI, RECEIVABLE_FACTORY_ADDRESS } from '../../../../lib/receivableFactory'
import { keccak256, toBytes } from 'viem'

interface FlowProof {
  id: string
  flowId: string
  flowName: string
  routeId: string
  merkleRoot: string
  from: string
  to: string
  amount: string
  docName: string
  updatedAt: number
  selected: boolean
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

  const [step, setStep] = useState(1)
  const [proofs, setProofs] = useState<FlowProof[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [searchHash, setSearchHash] = useState('')

  const [terms, setTerms] = useState<Terms>({
    name: '',
    type: 'invoice',
    amount: '',
    interestRate: '20',
    minInvestment: '100',
    expiryDays: '90'
  })

  // Load settled flows with merkleRoot
  useEffect(() => {
    async function load() {
      try {
        const boardsRes = await fetch(`${apiUrl}/api/boards`)
        if (!boardsRes.ok) { setLoading(false); return }
        const boards = await boardsRes.json()

        const allProofs: FlowProof[] = []
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
            if (s.status !== 'settled' || !s.merkleRoot) continue

            const conn = connMap.get(s.routeId)
            if (!conn) continue

            const fromCard = cardMap.get(conn.from)
            const toCard = cardMap.get(conn.to)

            allProofs.push({
              id: s.id,
              flowId: s.flowId,
              flowName: board.name,
              routeId: s.routeId,
              merkleRoot: s.merkleRoot,
              from: fromCard?.title || 'Unknown',
              to: toCard?.title || 'Unknown',
              amount: conn.amount || '0',
              docName: conn.docName || 'Document',
              updatedAt: s.updatedAt,
              selected: false
            })
          }
        }

        allProofs.sort((a, b) => b.updatedAt - a.updatedAt)
        setProofs(allProofs)
      } catch (e) {
        console.error('Failed to load proofs:', e)
      }
      setLoading(false)
    }
    load()
  }, [apiUrl])

  const toggleProof = (id: string) => {
    setProofs(proofs.map(p => p.id === id ? { ...p, selected: !p.selected } : p))
  }

  const selectAll = () => {
    const filtered = getFilteredProofs()
    const allSelected = filtered.every(p => p.selected)
    setProofs(proofs.map(p => filtered.find(f => f.id === p.id) ? { ...p, selected: !allSelected } : p))
  }

  const getFilteredProofs = () => {
    if (!searchHash) return proofs
    return proofs.filter(p =>
      p.merkleRoot.toLowerCase().includes(searchHash.toLowerCase()) ||
      p.flowName.toLowerCase().includes(searchHash.toLowerCase()) ||
      p.docName.toLowerCase().includes(searchHash.toLowerCase())
    )
  }

  const getSelectedProofs = () => proofs.filter(p => p.selected)

  const getTotalAmount = () => {
    return getSelectedProofs().reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0)
  }

  const handleCreate = async () => {
    if (!walletClient || !address || !publicClient) return

    setCreating(true)
    try {
      const proofHashes = getSelectedProofs().map(p => p.merkleRoot as `0x${string}`)
      const amount = BigInt(Math.floor(parseFloat(terms.amount) * 1e6))
      const interestRate = BigInt(Math.floor(parseFloat(terms.interestRate) * 100))
      const minInvest = BigInt(Math.floor(parseFloat(terms.minInvestment) * 1e6))
      const expiresAt = BigInt(Math.floor(Date.now() / 1000) + parseInt(terms.expiryDays) * 86400)

      // Get fee from factory
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

  return (
    <div>
      <h2 className='font-display text-xl font-semibold mb-6'>Create Receivable</h2>

      {/* Progress Steps */}
      <div className='flex items-center gap-4 mb-8'>
        {[
          { num: 1, label: 'Select Proofs' },
          { num: 2, label: 'Set Terms' },
          { num: 3, label: 'Review & Pay' }
        ].map((s, i) => (
          <div key={s.num} className='flex items-center gap-2'>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
              step > s.num ? 'bg-mint text-white' :
              step === s.num ? 'bg-ink text-lavender' :
              'bg-ink/10 text-ink/40'
            }`}>
              {step > s.num ? <CheckCircle className='w-4 h-4' /> : s.num}
            </div>
            <span className={`text-sm ${step === s.num ? 'text-ink font-medium' : 'text-ink/40'}`}>{s.label}</span>
            {i < 2 && <div className='w-12 h-px bg-ink/10 mx-2' />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Proofs */}
      {step === 1 && (
        <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-sm font-semibold text-ink'>Select Verified Payments</h3>
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30' />
                <input
                  value={searchHash}
                  onChange={(e) => setSearchHash(e.target.value)}
                  placeholder='Search proofs...'
                  className='text-xs text-ink bg-ink/5 border border-ink/10 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-ink/20 w-48'
                />
              </div>
              <button onClick={selectAll} className='text-xs text-ink/40 hover:text-ink/60 transition-colors'>
                {getFilteredProofs().every(p => p.selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className='flex items-center justify-center min-h-[200px]'>
              <Loader2 className='w-6 h-6 text-ink/40 animate-spin' />
            </div>
          ) : proofs.length === 0 ? (
            <div className='p-8 text-center'>
              <p className='text-ink/40 text-sm'>No settled payments with proofs found.</p>
              <p className='text-ink/30 text-xs mt-1'>Complete a payment flow first to generate proofs.</p>
            </div>
          ) : (
            <>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-ink/5 text-left'>
                    <th className='px-4 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium w-8'></th>
                    <th className='px-4 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Date</th>
                    <th className='px-4 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Flow</th>
                    <th className='px-4 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Document</th>
                    <th className='px-4 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>From</th>
                    <th className='px-4 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>To</th>
                    <th className='px-4 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Amount</th>
                    <th className='px-4 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredProofs().map((proof) => (
                    <tr
                      key={proof.id}
                      onClick={() => toggleProof(proof.id)}
                      className={`border-b border-ink/5 cursor-pointer transition-colors ${
                        proof.selected ? 'bg-mint/5' : 'hover:bg-ink/3'
                      }`}
                    >
                      <td className='px-4 py-3'>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          proof.selected ? 'bg-mint border-mint' : 'border-ink/20'
                        }`}>
                          {proof.selected && <CheckCircle className='w-3 h-3 text-white' />}
                        </div>
                      </td>
                      <td className='px-4 py-3 text-ink/50 text-xs'>
                        {new Date(proof.updatedAt).toLocaleDateString()}
                      </td>
                      <td className='px-4 py-3 text-ink/70 text-sm'>{proof.flowName}</td>
                      <td className='px-4 py-3 text-ink/60 text-xs'>{proof.docName}</td>
                      <td className='px-4 py-3 text-ink/60 text-xs max-w-[100px] truncate'>{proof.from}</td>
                      <td className='px-4 py-3 text-ink/60 text-xs max-w-[100px] truncate'>{proof.to}</td>
                      <td className='px-4 py-3 font-mono text-ink/60 text-sm'>{formatAmount(proof.amount)}</td>
                      <td className='px-4 py-3 font-mono text-ink/40 text-[10px] max-w-[120px] truncate'>
                        {proof.merkleRoot.slice(0, 14)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className='mt-4 text-xs text-ink/40'>
                {getSelectedProofs().length} selected · Total: {formatAmount(String(getTotalAmount()))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: Set Terms */}
      {step === 2 && (
        <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
          <h3 className='text-sm font-semibold text-ink mb-4'>Set Receivable Terms</h3>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs text-ink/40 mb-1.5'>Receivable Name</label>
              <input
                value={terms.name}
                onChange={(e) => setTerms({ ...terms, name: e.target.value })}
                placeholder='e.g., Invoice #123'
                className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
              />
            </div>
            <div>
              <label className='block text-xs text-ink/40 mb-1.5'>Type</label>
              <select
                value={terms.type}
                onChange={(e) => setTerms({ ...terms, type: e.target.value as any })}
                className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
              >
                <option value='invoice'>Invoice</option>
                <option value='payroll'>Payroll</option>
                <option value='contractor'>Contractor</option>
              </select>
            </div>
            <div>
              <label className='block text-xs text-ink/40 mb-1.5'>Amount (USDC)</label>
              <input
                type='number'
                value={terms.amount}
                onChange={(e) => setTerms({ ...terms, amount: e.target.value })}
                placeholder='10000'
                className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
              />
            </div>
            <div>
              <label className='block text-xs text-ink/40 mb-1.5'>Interest Rate (%)</label>
              <input
                type='number'
                value={terms.interestRate}
                onChange={(e) => setTerms({ ...terms, interestRate: e.target.value })}
                placeholder='20'
                className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
              />
            </div>
            <div>
              <label className='block text-xs text-ink/40 mb-1.5'>Min Investment (USDC)</label>
              <input
                type='number'
                value={terms.minInvestment}
                onChange={(e) => setTerms({ ...terms, minInvestment: e.target.value })}
                placeholder='100'
                className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
              />
            </div>
            <div>
              <label className='block text-xs text-ink/40 mb-1.5'>Expiry (days)</label>
              <input
                type='number'
                value={terms.expiryDays}
                onChange={(e) => setTerms({ ...terms, expiryDays: e.target.value })}
                placeholder='90'
                className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review & Pay */}
      {step === 3 && (
        <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
          <h3 className='text-sm font-semibold text-ink mb-4'>Review & Create</h3>

          <div className='grid grid-cols-2 gap-6'>
            <div className='space-y-3'>
              <div className='bg-ink/[0.02] rounded-xl p-4'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Name</div>
                <div className='text-sm font-medium text-ink'>{terms.name || 'Unnamed'}</div>
              </div>
              <div className='bg-ink/[0.02] rounded-xl p-4'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Type</div>
                <div className='text-sm text-ink capitalize'>{terms.type}</div>
              </div>
              <div className='bg-ink/[0.02] rounded-xl p-4'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Amount</div>
                <div className='text-sm font-semibold text-ink'>{formatAmount(terms.amount)}</div>
              </div>
            </div>
            <div className='space-y-3'>
              <div className='bg-ink/[0.02] rounded-xl p-4'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Interest Rate</div>
                <div className='text-sm text-ink'>{terms.interestRate}%</div>
              </div>
              <div className='bg-ink/[0.02] rounded-xl p-4'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Min Investment</div>
                <div className='text-sm text-ink'>{formatAmount(terms.minInvestment)}</div>
              </div>
              <div className='bg-ink/[0.02] rounded-xl p-4'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Expiry</div>
                <div className='text-sm text-ink'>{terms.expiryDays} days</div>
              </div>
            </div>
          </div>

          <div className='mt-4 bg-ink/[0.02] rounded-xl p-4'>
            <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-2'>Selected Proofs ({getSelectedProofs().length})</div>
            <div className='space-y-1'>
              {getSelectedProofs().map(p => (
                <div key={p.id} className='flex items-center justify-between text-xs'>
                  <span className='text-ink/60'>{p.docName} — {p.from} → {p.to}</span>
                  <span className='font-mono text-ink/40'>{p.merkleRoot.slice(0, 14)}...</span>
                </div>
              ))}
            </div>
          </div>

          <div className='mt-4 bg-amber-50 rounded-xl p-4 flex items-center gap-3'>
            <div className='text-sm text-amber-700'>
              <span className='font-medium'>Platform Fee:</span> 1 USDC
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className='flex items-center justify-between mt-6'>
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className='flex items-center gap-2 px-4 py-2 text-sm text-ink/40 hover:text-ink/60 disabled:opacity-30 transition-colors'
        >
          <ArrowLeft className='w-4 h-4' />
          Back
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={(step === 1 && getSelectedProofs().length === 0) || (step === 2 && (!terms.name || !terms.amount))}
            className='flex items-center gap-2 px-4 py-2 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-30 transition-opacity'
          >
            Next
            <ArrowRight className='w-4 h-4' />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={creating}
            className='flex items-center gap-2 px-6 py-2 bg-mint text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-30 transition-opacity'
          >
            {creating ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                Creating...
              </>
            ) : (
              'Create Receivable'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
