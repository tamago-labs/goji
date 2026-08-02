'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { usePublicClient, useWalletClient } from 'wagmi'
import { Package, Search, Loader2, CheckCircle, Shield, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useStart } from '../../components/start/StartProvider'
import { RECEIVABLE_TOKEN_ABI, getTokenStatusLabel, getTokenStatusColor } from '../../../lib/receivableToken'
import { GOJIPROOF_ABI } from '../../../lib/gojiProof'

interface Receivable {
  id: string
  tokenAddress: string
  name: string
  type: string
  amount: string
  interestRate: string
  minInvestment: string
  expiryDays: string
  proofs: string[]
  status: string
  issuer: string
  createdAt: number
  updatedAt: number
}

interface TokenInfo {
  totalReceivable: bigint
  fundedAmount: bigint
  expiresAt: bigint
  issuedAt: bigint
  minInvestment: bigint
}

interface ProofVerification {
  hash: string
  verified: boolean
  loading: boolean
}

export default function AvailableReceivablesPage() {
  const { apiUrl } = useStart()
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Expanded row state
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<Record<string, TokenInfo>>({})
  const [proofs, setProofs] = useState<Record<string, ProofVerification[]>>({})
  const [investAmount, setInvestAmount] = useState('')
  const [investing, setInvesting] = useState(false)
  const [loadingToken, setLoadingToken] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${apiUrl}/api/receivables`)
        if (res.ok) {
          const data = await res.json()
          setReceivables(data)
        }
      } catch (e) {
        console.error('Failed to load receivables:', e)
      }
      setLoading(false)
    }
    load()
  }, [apiUrl])

  const loadTokenInfo = async (tokenAddress: string) => {
    if (!publicClient || tokenInfo[tokenAddress]) return

    setLoadingToken(tokenAddress)
    try {
      const info = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: RECEIVABLE_TOKEN_ABI,
        functionName: 'getReceivableInfo'
      }) as [string, string, bigint, bigint, bigint, bigint, bigint, bigint, number]

      const proofHashes = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: RECEIVABLE_TOKEN_ABI,
        functionName: 'getProofHashes'
      }) as string[]

      setTokenInfo(prev => ({
        ...prev,
        [tokenAddress]: {
          totalReceivable: info[2],
          fundedAmount: info[7],
          expiresAt: info[6],
          issuedAt: info[5],
          minInvestment: info[4]
        }
      }))

      setProofs(prev => ({
        ...prev,
        [tokenAddress]: proofHashes.map(h => ({ hash: h, verified: false, loading: false }))
      }))
    } catch (e) {
      console.error('Failed to load token info:', e)
    }
    setLoadingToken(null)
  }

  const toggleExpand = async (receivable: Receivable) => {
    if (expandedId === receivable.tokenAddress) {
      setExpandedId(null)
      setInvestAmount('')
    } else {
      setExpandedId(receivable.tokenAddress)
      await loadTokenInfo(receivable.tokenAddress)
    }
  }

  const verifyProof = async (tokenAddress: string, index: number) => {
    if (!publicClient) return

    const proof = proofs[tokenAddress][index]
    setProofs(prev => ({
      ...prev,
      [tokenAddress]: prev[tokenAddress].map((p, i) => i === index ? { ...p, loading: true } : p)
    }))

    try {
      const result = await publicClient.readContract({
        address: '0x9465a4C246D44F32F391Ebda165Acb12886746Ca',
        abi: GOJIPROOF_ABI,
        functionName: 'isAnchored',
        args: [proof.hash as `0x${string}`]
      }) as boolean

      setProofs(prev => ({
        ...prev,
        [tokenAddress]: prev[tokenAddress].map((p, i) => i === index ? { ...p, verified: result, loading: false } : p)
      }))
    } catch (e) {
      console.error('Verification failed:', e)
      setProofs(prev => ({
        ...prev,
        [tokenAddress]: prev[tokenAddress].map((p, i) => i === index ? { ...p, loading: false } : p)
      }))
    }
  }

  const handleInvest = async (tokenAddress: string) => {
    if (!walletClient || !publicClient || !address || !investAmount) return

    setInvesting(true)
    try {
      const amount = BigInt(Math.floor(parseFloat(investAmount) * 1e18))

      const { request } = await publicClient.simulateContract({
        address: tokenAddress as `0x${string}`,
        abi: RECEIVABLE_TOKEN_ABI,
        functionName: 'finance',
        value: amount,
        account: address
      })

      const hash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash })

      window.location.reload()
    } catch (e) {
      console.error('Failed to invest:', e)
      alert('Failed to invest. Check console for details.')
    }
    setInvesting(false)
  }

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return '0 USDC'
    return `${num.toLocaleString()} USDC`
  }

  const formatBigAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
  }

  const getFundingPercent = (funded: bigint, total: bigint) => {
    if (total === 0n) return 0
    return Number((funded * 100n) / total)
  }

  const isExpired = (expiresAt: bigint) => {
    return Date.now() / 1000 > Number(expiresAt)
  }

  const filtered = receivables.filter(r => {
    if (filterType !== 'all' && r.type !== filterType) return false
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <h2 className='font-display text-xl font-semibold mb-4'>Available Receivables</h2>

      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
        {/* Filters */}
        <div className='px-6 py-3 border-b border-ink/8 flex items-center gap-4'>
          <div className='relative flex-1 max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30' />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search receivables...'
              className='w-full text-xs text-ink bg-ink/5 border border-ink/10 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-ink/20'
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className='text-xs text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-ink/20'
          >
            <option value='all'>All Types</option>
            <option value='invoice'>Invoice</option>
            <option value='payment'>Payment</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className='text-xs text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-ink/20'
          >
            <option value='all'>All Status</option>
            <option value='active'>Active</option>
            <option value='funded'>Funded</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className='flex items-center justify-center min-h-[200px]'>
            <Loader2 className='w-6 h-6 text-ink/40 animate-spin' />
          </div>
        ) : filtered.length === 0 ? (
          <div className='p-8 text-center'>
            <Package className='w-8 h-8 text-ink/20 mx-auto mb-2' />
            <p className='text-ink/40 text-sm font-medium mb-1'>No receivables found</p>
            <p className='text-ink/30 text-xs'>Check back later for new investment opportunities.</p>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className='grid grid-cols-8 gap-4 px-6 py-2 border-b border-ink/5 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>
              <div className='col-span-2'>Name</div>
              <div>Type</div>
              <div>Amount</div>
              <div>Interest</div>
              <div>Term</div>
              <div>Status</div>
              <div></div>
            </div>

            {/* Rows */}
            {filtered.map((r) => {
              const info = tokenInfo[r.tokenAddress]
              const isExpanded = expandedId === r.tokenAddress
              const isLoading = loadingToken === r.tokenAddress

              return (
                <div key={r.id}>
                  {/* Main Row */}
                  <div
                    onClick={() => toggleExpand(r)}
                    className={`grid grid-cols-8 gap-4 px-6 py-3 border-b border-ink/5 cursor-pointer transition-colors ${
                      isExpanded ? 'bg-ink/5' : 'hover:bg-ink/3'
                    }`}
                  >
                    <div className='col-span-2 text-ink/70 text-sm font-medium truncate'>{r.name}</div>
                    <div className='text-ink/50 text-xs capitalize'>{r.type}</div>
                    <div className='font-mono text-ink/60 text-sm'>{formatAmount(r.amount)}</div>
                    <div className='text-ink/60 text-sm'>{r.interestRate}%</div>
                    <div className='text-ink/50 text-xs'>{r.expiryDays} days</div>
                    <div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTokenStatusColor(r.status)}`}>
                        {getTokenStatusLabel(r.status)}
                      </span>
                    </div>
                    <div className='flex items-center justify-end'>
                      {isExpanded ? <ChevronUp className='w-4 h-4 text-ink/30' /> : <ChevronDown className='w-4 h-4 text-ink/30' />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className='px-6 py-4 bg-ink/[0.02] border-b border-ink/5'>
                      {isLoading ? (
                        <div className='flex items-center justify-center py-4'>
                          <Loader2 className='w-5 h-5 text-ink/40 animate-spin' />
                        </div>
                      ) : info ? (
                        <div className='grid grid-cols-2 gap-6'>
                          {/* Left: Details */}
                          <div className='space-y-4'>
                            {/* Funding Progress */}
                            <div>
                              <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-2'>Funding Progress</div>
                              <div className='flex items-center justify-between text-sm mb-1'>
                                <span className='text-ink/60'>{formatBigAmount(info.fundedAmount)} funded</span>
                                <span className='text-ink/40'>{formatBigAmount(info.totalReceivable)} total</span>
                              </div>
                              <div className='h-2 bg-ink/10 rounded-full overflow-hidden'>
                                <div
                                  className='h-full bg-mint rounded-full transition-all'
                                  style={{ width: `${getFundingPercent(info.fundedAmount, info.totalReceivable)}%` }}
                                />
                              </div>
                              <div className='text-right text-xs text-ink/40 mt-1'>{getFundingPercent(info.fundedAmount, info.totalReceivable)}%</div>
                            </div>

                            {/* Proofs */}
                            <div>
                              <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-2'>Collateral Proofs</div>
                              <div className='space-y-1'>
                                {(proofs[r.tokenAddress] || []).map((proof, i) => (
                                  <div key={proof.hash} className='flex items-center justify-between bg-ink/[0.02] rounded-lg px-3 py-2'>
                                    <div className='flex items-center gap-2'>
                                      <Shield className='w-3 h-3 text-ink/30' />
                                      <span className='text-[10px] font-mono text-ink/50 truncate max-w-[200px]'>{proof.hash}</span>
                                    </div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); verifyProof(r.tokenAddress, i) }}
                                      disabled={proof.loading}
                                      className='text-[10px]'
                                    >
                                      {proof.loading ? (
                                        <Loader2 className='w-3 h-3 animate-spin text-ink/40' />
                                      ) : proof.verified ? (
                                        <span className='text-[#28C840]'>Verified</span>
                                      ) : (
                                        <span className='text-mint hover:text-[#1B7A50]'>Verify</span>
                                      )}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Issuer */}
                            <div className='flex items-center gap-2'>
                              <span className='text-[10px] text-ink/40'>Issuer:</span>
                              <span className='text-[10px] font-mono text-ink/50 truncate max-w-[150px]'>{r.issuer}</span>
                              <a href={`https://testnet.arcscan.app/address/${r.issuer}`} target='_blank' rel='noopener noreferrer'>
                                <ExternalLink className='w-3 h-3 text-ink/30 hover:text-ink/60' />
                              </a>
                            </div>
                          </div>

                          {/* Right: Fund */}
                          <div className='space-y-4'>
                            {/* Terms Summary */}
                            <div className='bg-ink/[0.02] rounded-xl p-4 space-y-2'>
                              <div className='flex justify-between text-xs'>
                                <span className='text-ink/40'>Type</span>
                                <span className='text-ink/60 capitalize'>{r.type}</span>
                              </div>
                              <div className='flex justify-between text-xs'>
                                <span className='text-ink/40'>Amount</span>
                                <span className='text-ink/60'>{formatAmount(r.amount)}</span>
                              </div>
                              <div className='flex justify-between text-xs'>
                                <span className='text-ink/40'>Interest</span>
                                <span className='text-ink/60'>Up to {r.interestRate}% (pro-rata)</span>
                              </div>
                              <div className='flex justify-between text-xs'>
                                <span className='text-ink/40'>Term</span>
                                <span className='text-ink/60'>{r.expiryDays} days</span>
                              </div>
                              <div className='flex justify-between text-xs'>
                                <span className='text-ink/40'>Min Investment</span>
                                <span className='text-ink/60'>{formatAmount(r.minInvestment)}</span>
                              </div>
                            </div>

                            {/* Fund Input */}
                            {r.status === 'active' && !isExpired(info.expiresAt) && (
                              <div>
                                <label className='block text-[10px] text-ink/40 uppercase tracking-wider mb-1.5'>Investment Amount (USDC)</label>
                                <input
                                  type='number'
                                  value={investAmount}
                                  onChange={(e) => setInvestAmount(e.target.value)}
                                  placeholder='100'
                                  onClick={(e) => e.stopPropagation()}
                                  className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20 mb-3'
                                />

                                {investAmount && parseFloat(investAmount) > 0 && (
                                  <div className='bg-ink/[0.02] rounded-lg p-3 mb-3 text-[10px] space-y-1'>
                                    <div className='flex justify-between'>
                                      <span className='text-ink/40'>You invest</span>
                                      <span className='text-ink/60'>{investAmount} USDC</span>
                                    </div>
                                    <div className='flex justify-between'>
                                      <span className='text-ink/40'>Tokens received</span>
                                      <span className='text-ink/60'>
                                        {((parseFloat(investAmount) * 1_000_000) / (Number(info.totalReceivable) / 1e18)).toLocaleString()} tokens
                                      </span>
                                    </div>
                                    <div className='flex justify-between'>
                                      <span className='text-ink/40'>Ownership</span>
                                      <span className='text-ink/60'>
                                        {((parseFloat(investAmount) * 100) / (Number(info.totalReceivable) / 1e18)).toFixed(2)}%
                                      </span>
                                    </div>
                                  </div>
                                )}

                                <button
                                  onClick={(e) => { e.stopPropagation(); handleInvest(r.tokenAddress) }}
                                  disabled={investing || !investAmount || parseFloat(investAmount) * 1e18 < Number(info.minInvestment)}
                                  className='w-full px-4 py-2 bg-mint text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-30 transition-opacity'
                                >
                                  {investing ? (
                                    <span className='flex items-center justify-center gap-2'>
                                      <Loader2 className='w-4 h-4 animate-spin' />
                                      Investing...
                                    </span>
                                  ) : (
                                    'Invest Now'
                                  )}
                                </button>
                              </div>
                            )}

                            {isExpired(info.expiresAt) && (
                              <div className='text-center text-xs text-ink/40 py-2'>This receivable has expired</div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
