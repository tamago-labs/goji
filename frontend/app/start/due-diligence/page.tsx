'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { usePublicClient } from 'wagmi'
import { ArrowLeft, ExternalLink, Loader2, CheckCircle, Shield, Search } from 'lucide-react'
import Link from 'next/link'
import { RECEIVABLE_TOKEN_ABI, getTokenStatusLabel, getTokenStatusColor } from '../../../lib/receivableToken'
import { GOJIPROOF_ABI } from '../../../lib/gojiProof'

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
}

interface ProofVerification {
  hash: string
  verified: boolean
  loading: boolean
  submitter: string
  timestamp: number
}

export default function DueDiligencePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tokenAddress = searchParams.get('token')
  const { address } = useAccount()
  const publicClient = usePublicClient()

  const [token, setToken] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [proofs, setProofs] = useState<ProofVerification[]>([])

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
          proofHashes
        })

        setProofs(proofHashes.map(h => ({
          hash: h,
          verified: false,
          loading: false,
          submitter: '',
          timestamp: 0
        })))
      } catch (e) {
        console.error('Failed to load token:', e)
      }
      setLoading(false)
    }

    load()
  }, [publicClient, tokenAddress])

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

      let submitter = ''
      let timestamp = 0

      if (result) {
        const doc = await publicClient.readContract({
          address: '0x9465a4C246D44F32F391Ebda165Acb12886746Ca',
          abi: GOJIPROOF_ABI,
          functionName: 'getDocument',
          args: [proof.hash as `0x${string}`]
        }) as { submitter: string; timestamp: bigint }

        submitter = doc.submitter
        timestamp = Number(doc.timestamp)
      }

      setProofs(proofs.map((p, i) => i === index ? {
        ...p,
        verified: result,
        loading: false,
        submitter,
        timestamp
      } : p))
    } catch (e) {
      console.error('Verification failed:', e)
      setProofs(proofs.map((p, i) => i === index ? { ...p, loading: false } : p))
    }
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

  const getTermDays = () => {
    if (!token) return 0
    return Math.ceil((Number(token.expiresAt) - Number(token.issuedAt)) / 86400)
  }

  if (!tokenAddress) {
    return (
      <div className='text-center py-12'>
        <p className='text-ink/40'>No token specified</p>
        <Link href='/start/available-receivables' className='text-sm text-mint hover:text-[#1B7A50] mt-2 inline-block'>
          Back to receivables
        </Link>
      </div>
    )
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
                <div key={proof.hash} className='bg-ink/[0.02] rounded-xl p-3'>
                  <div className='flex items-center justify-between'>
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
                  {proof.verified && proof.submitter && (
                    <div className='mt-2 text-[10px] text-ink/40 space-y-1'>
                      <div>Submitter: <span className='font-mono'>{proof.submitter}</span></div>
                      <div>Anchored: {new Date(proof.timestamp * 1000).toLocaleString()}</div>
                    </div>
                  )}
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

          {/* Action */}
          {token.status === 0 && !isExpired() && (
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
              <h3 className='text-sm font-semibold text-ink mb-3'>Invest</h3>
              <Link
                href={`/start/funding?token=${tokenAddress}`}
                className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-mint text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity'
              >
                Fund This Receivable
              </Link>
              <p className='text-[10px] text-ink/30 mt-2 text-center'>
                Min: {formatAmount(token.minInvestment)}
              </p>
            </div>
          )}

          {isExpired() && (
            <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
              <p className='text-sm text-ink/40 text-center'>This receivable has expired</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
