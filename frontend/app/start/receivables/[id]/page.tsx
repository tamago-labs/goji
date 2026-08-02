'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { usePublicClient, useWalletClient } from 'wagmi'
import { ArrowLeft, ExternalLink, Loader2, CheckCircle, Shield, Clock, TrendingUp, Wallet } from 'lucide-react'
import Link from 'next/link'
import { RECEIVABLE_TOKEN_ABI, getTokenStatusLabel, getTokenStatusColor } from '../../../../lib/receivableToken'
import { GOJIPROOF_ABI } from '../../../../lib/gojiProof'

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
  totalInterest: bigint
  totalRepayment: bigint
  userShare: bigint
  userInterest: bigint
  userBalance: bigint
}

interface ProofVerification {
  hash: string
  verified: boolean
  loading: boolean
}

export default function ReceivableDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tokenAddress = params.id as string
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [token, setToken] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [proofs, setProofs] = useState<ProofVerification[]>([])

  useEffect(() => {
    if (!publicClient || !tokenAddress) return

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

        const totalInterest = await publicClient!.readContract({
          address: tokenAddress as `0x${string}`,
          abi: RECEIVABLE_TOKEN_ABI,
          functionName: 'getTotalInterest'
        }) as bigint

        const totalRepayment = await publicClient!.readContract({
          address: tokenAddress as `0x${string}`,
          abi: RECEIVABLE_TOKEN_ABI,
          functionName: 'getTotalRepayment'
        }) as bigint

        // Get user's token balance
        let userBalance = BigInt(0)
        let userShare = BigInt(0)
        let userInterest = BigInt(0)

        if (address) {
          userBalance = await publicClient!.readContract({
            address: tokenAddress as `0x${string}`,
            abi: RECEIVABLE_TOKEN_ABI,
            functionName: 'balanceOf',
            args: [address]
          }) as bigint

          if (userBalance > BigInt(0)) {
            userShare = await publicClient!.readContract({
              address: tokenAddress as `0x${string}`,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'calculateShare',
              args: [address]
            }) as bigint

            userInterest = await publicClient!.readContract({
              address: tokenAddress as `0x${string}`,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'calculateInvestorInterest',
              args: [address]
            }) as bigint
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
          totalInterest,
          totalRepayment,
          userShare,
          userInterest,
          userBalance
        })

        setProofs(proofHashes.map(h => ({ hash: h, verified: false, loading: false })))
      } catch (e) {
        console.error('Failed to load token:', e)
      }
      setLoading(false)
    }

    load()
  }, [publicClient, tokenAddress, address])

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

  const handleClaimRepayment = async () => {
    if (!walletClient || !publicClient || !token || !address) return

    setClaiming(true)
    try {
      const { request } = await publicClient.simulateContract({
        address: tokenAddress as `0x${string}`,
        abi: RECEIVABLE_TOKEN_ABI,
        functionName: 'claimRepayment',
        value: token.totalRepayment,
        account: address
      })

      const hash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash })
      window.location.reload()
    } catch (e) {
      console.error('Failed to claim repayment:', e)
      alert('Failed to claim repayment. Check console for details.')
    }
    setClaiming(false)
  }

  const formatAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
  }

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  const getFundingPercent = () => {
    if (!token || token.totalReceivable === BigInt(0)) return 0
    return Number((token.fundedAmount * BigInt(100)) / token.totalReceivable)
  }

  const isExpired = () => {
    if (!token) return false
    return Date.now() / 1000 > Number(token.expiresAt)
  }

  const isIssuer = () => {
    if (!token || !address) return false
    return token.issuer.toLowerCase() === address.toLowerCase()
  }

  const getDaysRemaining = () => {
    if (!token) return 0
    const remaining = Number(token.expiresAt) - Date.now() / 1000
    return remaining > 0 ? Math.ceil(remaining / 86400) : 0
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
        <Link href='/start/receivables/list' className='text-sm text-mint hover:text-[#1B7A50] mt-2 inline-block'>
          Back to list
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
                {!isExpired() && token.status < 2 && (
                  <div className='text-[10px] text-mint'>{getDaysRemaining()} days left</div>
                )}
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

          {/* Repayment Projection */}
          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h3 className='text-sm font-semibold text-ink mb-3'>Repayment (Projected)</h3>
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-ink/40'>Principal</span>
                <span className='text-ink/60'>{formatAmount(token.totalReceivable)}</span>
              </div>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-ink/40'>Max Interest (full term)</span>
                <span className='text-ink/60'>{formatAmount(token.totalInterest)}</span>
              </div>
              <div className='border-t border-ink/10 pt-2 flex items-center justify-between text-sm'>
                <span className='text-ink font-medium'>Max Total</span>
                <span className='text-ink font-semibold'>{formatAmount(token.totalRepayment)}</span>
              </div>
              <p className='text-[10px] text-ink/30 mt-2'>
                Actual repayment depends on when investors funded. Early investors earn more interest.
              </p>
            </div>
          </div>

          {/* User Investment (if investor) */}
          {token.userBalance > BigInt(0) && (
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
              <h3 className='text-sm font-semibold text-ink mb-3 flex items-center gap-2'>
                <Wallet className='w-4 h-4' />
                Your Investment
              </h3>
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-ink/40'>Tokens Held</span>
                  <span className='text-ink/60 font-mono'>{(Number(token.userBalance) / 1e6).toLocaleString()}</span>
                </div>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-ink/40'>Interest Earned</span>
                  <span className='text-[#28C840] font-medium'>{formatAmount(token.userInterest)}</span>
                </div>
                <div className='border-t border-ink/10 pt-2 flex items-center justify-between text-sm'>
                  <span className='text-ink font-medium'>Your Share</span>
                  <span className='text-ink font-semibold'>{formatAmount(token.userShare)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {isIssuer() && (token.status === 0 || token.status === 1) && isExpired() && (
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
              <h3 className='text-sm font-semibold text-ink mb-3'>Actions</h3>
              <button
                onClick={handleClaimRepayment}
                disabled={claiming}
                className='w-full px-4 py-2 bg-mint text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-30 transition-opacity'
              >
                {claiming ? (
                  <span className='flex items-center justify-center gap-2'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    Claiming...
                  </span>
                ) : (
                  `Claim Repayment (${formatAmount(token.totalRepayment)})`
                )}
              </button>
              <p className='text-[10px] text-ink/30 mt-2 text-center'>
                Deposit principal + interest so investors can redeem
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
