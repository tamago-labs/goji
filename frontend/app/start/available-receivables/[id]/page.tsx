'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { usePublicClient, useWalletClient } from 'wagmi'
import { ArrowLeft, ExternalLink, Loader2, CheckCircle, Shield, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { RECEIVABLE_TOKEN_ABI, getTokenStatusLabel, getTokenStatusColor } from '../../../../lib/receivableToken'
import { GOJIPROOF_ABI } from '../../../../lib/gojiProof'
import { useStart } from '../../../components/start/StartProvider'

interface TokenInfo {
  name: string
  type: string
  issuer: string
  totalReceivable: bigint
  interestRate: bigint
  minInvestment: bigint
  expiresAt: bigint
  issuedAt: bigint
  fundedAmount: bigint
  status: number
  proofHashes: string[]
  userBalance: bigint
  userShare: bigint
  userInterest: bigint
}

interface ProofVerification {
  hash: string
  verified: boolean
  loading: boolean
}

interface PendingFlow {
  id: string
  boardId: string
  boardName: string
  routeId: string
  from: string
  to: string
  amount: string
  docName: string
  template: string | null
  customDoc: string | null
  updatedAt: number
}

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tokenAddress = params.id as string
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { apiUrl } = useStart()

  const [token, setToken] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [proofs, setProofs] = useState<ProofVerification[]>([])
  const [investAmount, setInvestAmount] = useState('')
  const [investing, setInvesting] = useState(false)
  const [pendingFlows, setPendingFlows] = useState<PendingFlow[]>([])
  const [loadingFlows, setLoadingFlows] = useState(true)
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)

  useEffect(() => {
    if (!publicClient || !tokenAddress) {
      setLoading(false)
      return
    }

    async function load() {
      try {
        const info = await publicClient!.readContract({
          address: tokenAddress as `0x${string}`,
          abi: RECEIVABLE_TOKEN_ABI,
          functionName: 'getReceivableInfo'
        }) as [string, string, bigint, bigint, bigint, bigint, bigint, bigint, number]

        const name = await publicClient!.readContract({
          address: tokenAddress as `0x${string}`,
          abi: RECEIVABLE_TOKEN_ABI,
          functionName: 'name'
        }) as string

        const proofHashes = await publicClient!.readContract({
          address: tokenAddress as `0x${string}`,
          abi: RECEIVABLE_TOKEN_ABI,
          functionName: 'getProofHashes'
        }) as string[]

        // Get user's investment data
        let userBalance = 0n
        let userShare = 0n
        let userInterest = 0n

        if (address) {
          userBalance = await publicClient!.readContract({
            address: tokenAddress as `0x${string}`,
            abi: RECEIVABLE_TOKEN_ABI,
            functionName: 'balanceOf',
            args: [address]
          }) as bigint

          if (userBalance > 0n) {
            userInterest = await publicClient!.readContract({
              address: tokenAddress as `0x${string}`,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'calculateInvestorInterest',
              args: [address]
            }) as bigint

            // Calculate projected share manually (calculateShare returns 0 before repayment)
            const totalReceivable = info[2]
            const projectedPrincipal = (userBalance * totalReceivable) / 1_000_000_000_000n
            userShare = projectedPrincipal + userInterest
          }
        }

        setToken({
          name,
          type: info[0],
          issuer: info[1],
          totalReceivable: info[2],
          interestRate: info[3],
          minInvestment: info[4],
          expiresAt: info[6],
          issuedAt: info[5],
          fundedAmount: info[7],
          status: info[8],
          proofHashes,
          userBalance,
          userShare,
          userInterest
        })

        setProofs(proofHashes.map(h => ({ hash: h, verified: false, loading: false })))
      } catch (e) {
        console.error('Failed to load token:', e)
      }
      setLoading(false)
    }

    load()
  }, [publicClient, tokenAddress])

  // Fetch pending flows from P2P
  useEffect(() => {
    async function loadPendingFlows() {
      try {
        const boardsRes = await fetch(`${apiUrl}/api/boards`)
        if (!boardsRes.ok) { setLoadingFlows(false); return }
        const boards = await boardsRes.json()

        const allFlows: PendingFlow[] = []
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
            if (s.status !== 'pending') continue

            const conn = connMap.get(s.routeId)
            if (!conn) continue

            const fromCard = cardMap.get(conn.from)
            const toCard = cardMap.get(conn.to)

            allFlows.push({
              id: s.id,
              boardId: board.id,
              boardName: board.name,
              routeId: s.routeId,
              from: fromCard?.title || 'Unknown',
              to: toCard?.title || 'Unknown',
              amount: conn.amount || '0',
              docName: conn.docName || 'Document',
              template: conn.template || null,
              customDoc: conn.customDoc || null,
              updatedAt: s.updatedAt
            })
          }
        }

        setPendingFlows(allFlows)
      } catch (e) {
        console.error('Failed to load pending flows:', e)
      }
      setLoadingFlows(false)
    }

    loadPendingFlows()
  }, [apiUrl])

  const verifyProof = async (index: number) => {
    if (!publicClient || !token) return

    const proof = proofs[index]
    setProofs(proofs.map((p, i) => i === index ? { ...p, loading: true } : p))

    try {
      const result = await publicClient.readContract({
        address: '0x9465a4C246D44F32F391Ebda165Acb12886746Ca',
        abi: GOJIPROOF_ABI,
        functionName: 'isAnchored',
        args: [proof.hash as `0x${string}`]
      }) as boolean

      setProofs(proofs.map((p, i) => i === index ? { ...p, verified: result, loading: false } : p))
    } catch (e) {
      console.error('Verification failed:', e)
      setProofs(proofs.map((p, i) => i === index ? { ...p, loading: false } : p))
    }
  }

  const handleInvest = async () => {
    if (!walletClient || !publicClient || !address || !token || !investAmount) return

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

  const handleRedeem = async () => {
    if (!walletClient || !publicClient || !address) return

    try {
      const { request } = await publicClient.simulateContract({
        address: tokenAddress as `0x${string}`,
        abi: RECEIVABLE_TOKEN_ABI,
        functionName: 'redeem',
        account: address
      })

      const hash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash })
      window.location.reload()
    } catch (e) {
      console.error('Failed to redeem:', e)
      alert('Failed to redeem. Check console for details.')
    }
  }

  const formatAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
  }

  const formatTokens = (tokens: bigint) => {
    return (Number(tokens) / 1e6).toLocaleString()
  }

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  const getFundingPercent = () => {
    if (!token || token.totalReceivable === 0n) return 0
    return Number((token.fundedAmount * 100n) / token.totalReceivable)
  }

  const isExpired = () => {
    if (!token) return false
    return Date.now() / 1000 > Number(token.expiresAt)
  }

  const getTermDays = () => {
    if (!token) return 0
    return Math.ceil((Number(token.expiresAt) - Number(token.issuedAt)) / 86400)
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='w-6 h-6 text-ink/40 animate-spin' />
      </div>
    )
  }

  if (!token) {
    return (
      <div className='text-center py-12'>
        <p className='text-ink/40'>Token not found</p>
        <Link href='/start/available-receivables' className='text-sm text-mint hover:text-[#1B7A50] mt-2 inline-block'>
          Back to receivables
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className='flex items-center gap-4 mb-6'>
        <button onClick={() => router.back()} className='p-2 hover:bg-ink/5 rounded-lg transition-colors'>
          <ArrowLeft className='w-4 h-4 text-ink/40' />
        </button>
        <div className='flex-1'>
          <div className='flex items-center gap-3'>
            <h2 className='font-display text-xl font-semibold'>{token.name}</h2>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTokenStatusColor(token.status)}`}>
              {getTokenStatusLabel(token.status)}
            </span>
          </div>
          <p className='text-xs text-ink/40 mt-1 font-mono'>{tokenAddress}</p>
        </div>
        <a
          href={`https://testnet.arcscan.app/address/${tokenAddress}`}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center gap-1 text-xs text-mint hover:text-[#1B7A50] transition-colors'
        >
          View on Arc Explorer
          <ExternalLink className='w-3 h-3' />
        </a>
      </div>

      <div className='grid grid-cols-3 gap-6'>
        {/* Main Content */}
        <div className='col-span-2 space-y-4'>
          {/* Terms */}
          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h3 className='text-sm font-semibold text-ink mb-4'>Terms</h3>
            <div className='grid grid-cols-3 gap-4'>
              <div className='bg-ink/[0.02] rounded-xl p-3'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Type</div>
                <div className='text-sm text-ink capitalize'>{token.type}</div>
              </div>
              <div className='bg-ink/[0.02] rounded-xl p-3'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Amount</div>
                <div className='text-sm font-semibold text-ink'>{formatAmount(token.totalReceivable)}</div>
              </div>
              <div className='bg-ink/[0.02] rounded-xl p-3'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Interest</div>
                <div className='text-sm text-ink'>Up to {Number(token.interestRate) / 100}%</div>
                <div className='text-[10px] text-ink/40'>Pro-rata by time</div>
              </div>
              <div className='bg-ink/[0.02] rounded-xl p-3'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Term</div>
                <div className='text-sm text-ink'>{getTermDays()} days</div>
              </div>
              <div className='bg-ink/[0.02] rounded-xl p-3'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Min Investment</div>
                <div className='text-sm text-ink'>{formatAmount(token.minInvestment)}</div>
              </div>
              <div className='bg-ink/[0.02] rounded-xl p-3'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Expires</div>
                <div className='text-sm text-ink'>{formatDate(token.expiresAt)}</div>
              </div>
            </div>
          </div>

          {/* Funding Progress */}
          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h3 className='text-sm font-semibold text-ink mb-4'>Funding Progress</h3>
            <div className='mb-3'>
              <div className='flex items-center justify-between text-sm mb-1'>
                <span className='text-ink/60'>{formatAmount(token.fundedAmount)} funded</span>
                <span className='text-ink/40'>{formatAmount(token.totalReceivable)} total</span>
              </div>
              <div className='h-2 bg-ink/10 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-mint rounded-full transition-all'
                  style={{ width: `${getFundingPercent()}%` }}
                />
              </div>
              <div className='text-right text-xs text-ink/40 mt-1'>{getFundingPercent()}%</div>
            </div>
          </div>

          {/* Proofs */}
          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h3 className='text-sm font-semibold text-ink mb-4'>Collateral Proofs ({proofs.length})</h3>
            <div className='space-y-2'>
              {proofs.map((proof, i) => (
                <div key={proof.hash} className='flex items-center justify-between bg-ink/[0.02] rounded-xl p-3'>
                  <div className='flex items-center gap-3'>
                    <Shield className='w-4 h-4 text-ink/30' />
                    <span className='text-xs font-mono text-ink/60 truncate max-w-[300px]'>{proof.hash}</span>
                  </div>
                  <button
                    onClick={() => verifyProof(i)}
                    disabled={proof.loading}
                    className='flex items-center gap-1 text-xs'
                  >
                    {proof.loading ? (
                      <Loader2 className='w-3 h-3 animate-spin text-ink/40' />
                    ) : proof.verified ? (
                      <span className='flex items-center gap-1 text-[#28C840]'>
                        <CheckCircle className='w-3 h-3' /> Verified
                      </span>
                    ) : (
                      <span className='text-mint hover:text-[#1B7A50]'>Verify</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Flows */}
          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h3 className='text-sm font-semibold text-ink mb-4'>Pending Flows ({pendingFlows.length})</h3>
            
            {loadingFlows ? (
              <div className='flex items-center justify-center py-4'>
                <Loader2 className='w-5 h-5 text-ink/40 animate-spin' />
              </div>
            ) : pendingFlows.length === 0 ? (
              <div className='text-center py-4'>
                <p className='text-ink/40 text-xs'>No pending flows found</p>
              </div>
            ) : (
              <div className='space-y-2'>
                {pendingFlows.map((flow) => (
                  <div key={flow.id} className='bg-ink/[0.02] rounded-xl overflow-hidden'>
                    {/* Flow Header */}
                    <div
                      onClick={() => setExpandedFlow(expandedFlow === flow.id ? null : flow.id)}
                      className='flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-ink/3 transition-colors'
                    >
                      <div className='flex items-center gap-3'>
                        <FileText className='w-4 h-4 text-ink/30' />
                        <div>
                          <div className='text-sm text-ink/70 font-medium'>{flow.boardName}</div>
                          <div className='text-[10px] text-ink/40'>{flow.docName}</div>
                        </div>
                      </div>
                      <div className='flex items-center gap-4'>
                        <span className='text-xs text-ink/60 font-mono'>{flow.amount} USDC</span>
                        {expandedFlow === flow.id ? (
                          <ChevronUp className='w-4 h-4 text-ink/30' />
                        ) : (
                          <ChevronDown className='w-4 h-4 text-ink/30' />
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedFlow === flow.id && (
                      <div className='px-4 pb-3 border-t border-ink/5'>
                        <div className='grid grid-cols-2 gap-3 py-3 text-xs'>
                          <div>
                            <span className='text-ink/40'>From: </span>
                            <span className='text-ink/60'>{flow.from}</span>
                          </div>
                          <div>
                            <span className='text-ink/40'>To: </span>
                            <span className='text-ink/60'>{flow.to}</span>
                          </div>
                          <div>
                            <span className='text-ink/40'>Amount: </span>
                            <span className='text-ink/60'>{flow.amount} USDC</span>
                          </div>
                          <div>
                            <span className='text-ink/40'>Document: </span>
                            <span className='text-ink/60'>{flow.docName}</span>
                          </div>
                        </div>

                        {/* View Document Button */}
                        <button
                          onClick={() => setSelectedDocument(selectedDocument === flow.id ? null : flow.id)}
                          className='text-xs text-mint hover:text-[#1B7A50] font-medium transition-colors'
                        >
                          {selectedDocument === flow.id ? 'Hide Document' : 'View Document'}
                        </button>

                        {/* Document Preview */}
                        {selectedDocument === flow.id && flow.customDoc && (
                          <div className='mt-3 bg-white rounded-xl border border-ink/10 overflow-hidden'>
                            <div className='p-4 text-xs text-ink/60'>
                              <div className='font-medium text-ink/70 mb-2'>{flow.docName}</div>
                              <pre className='whitespace-pre-wrap font-mono text-[10px] bg-ink/5 p-3 rounded-lg'>
                                {(() => {
                                  try {
                                    const data = JSON.parse(flow.customDoc)
                                    return Object.entries(data).map(([key, value]) => (
                                      <div key={key} className='flex justify-between py-1 border-b border-ink/5 last:border-0'>
                                        <span className='text-ink/40'>{key}</span>
                                        <span className='text-ink/60'>{String(value)}</span>
                                      </div>
                                    ))
                                  } catch {
                                    return flow.customDoc
                                  }
                                })()}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className='space-y-4'>
          {/* Issuer */}
          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h3 className='text-sm font-semibold text-ink mb-3'>Issuer</h3>
            <div className='flex items-center gap-2'>
              <span className='text-xs font-mono text-ink/60 truncate'>{token.issuer}</span>
              <a
                href={`https://testnet.arcscan.app/address/${token.issuer}`}
                target='_blank'
                rel='noopener noreferrer'
              >
                <ExternalLink className='w-3 h-3 text-ink/30 hover:text-ink/60' />
              </a>
            </div>
          </div>

          {/* Your Investment */}
          {token.userBalance > 0n && (
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
              <h3 className='text-sm font-semibold text-ink mb-3'>Your Investment</h3>
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-ink/40'>Tokens Held</span>
                  <span className='text-ink/60 font-mono'>{formatTokens(token.userBalance)}</span>
                </div>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-ink/40'>Projected Share</span>
                  <span className='text-ink/60'>{formatAmount(token.userShare)}</span>
                </div>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-ink/40'>Interest Earned</span>
                  <span className='text-[#28C840] font-medium'>{formatAmount(token.userInterest)}</span>
                </div>
              </div>

              {token.status === 3 && (
                <button
                  onClick={handleRedeem}
                  className='w-full mt-4 px-4 py-2 bg-mint text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity'
                >
                  Redeem ({formatAmount(token.userShare)})
                </button>
              )}
            </div>
          )}

          {/* Invest */}
          {token.status === 0 && !isExpired() ? (
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
              <h3 className='text-sm font-semibold text-ink mb-3'>Invest</h3>

              <div className='mb-4'>
                <label className='block text-xs text-ink/40 mb-1.5'>Amount (USDC)</label>
                <input
                  type='number'
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  placeholder='100'
                  className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
                />
              </div>

              {investAmount && parseFloat(investAmount) > 0 && (
                <div className='bg-ink/[0.02] rounded-xl p-3 mb-4 text-xs space-y-1'>
                  <div className='flex justify-between'>
                    <span className='text-ink/40'>You invest</span>
                    <span className='text-ink/60'>{investAmount} USDC</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-ink/40'>Tokens received</span>
                    <span className='text-ink/60'>
                      {((parseFloat(investAmount) * 1_000_000) / (Number(token.totalReceivable) / 1e18)).toLocaleString()} tokens
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-ink/40'>Ownership</span>
                    <span className='text-ink/60'>
                      {((parseFloat(investAmount) * 100) / (Number(token.totalReceivable) / 1e18)).toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleInvest}
                disabled={investing || !investAmount || parseFloat(investAmount) * 1e18 < Number(token.minInvestment)}
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

              <p className='text-[10px] text-ink/30 mt-2 text-center'>
                Min: {formatAmount(token.minInvestment)}
              </p>
            </div>
          ) : (
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6 text-center'>
              <p className='text-sm text-ink/40'>
                {isExpired() ? 'This receivable has expired' : 'Not accepting investments'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
