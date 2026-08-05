'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePublicClient } from 'wagmi'
import { ArrowLeft, ExternalLink, Loader2, Calculator } from 'lucide-react'
import Link from 'next/link'
import { RECEIVABLE_TOKEN_ABI, getTokenStatusLabel, getTokenStatusColor } from '../../../lib/receivableToken'

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
}

function RWATokenDetailContent() {
  const searchParams = useSearchParams()
  const tokenAddress = searchParams.get('address')
  const publicClient = usePublicClient()

  const [token, setToken] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [calcAmount, setCalcAmount] = useState('')
  const [calcDays, setCalcDays] = useState('30')

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
          status: info[8]
        })
      } catch (e) {
        console.error('Failed to load token:', e)
      }
      setLoading(false)
    }

    load()
  }, [publicClient, tokenAddress])

  const formatAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toLocaleString()} USDC`
  }

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  const getFundingPercent = () => {
    if (!token || token.totalReceivable === BigInt(0)) return 0
    return Number((token.fundedAmount * BigInt(100)) / token.totalReceivable)
  }

  const getTermDays = () => {
    if (!token) return 0
    return Math.ceil((Number(token.expiresAt) - Number(token.issuedAt)) / 86400)
  }

  if (!tokenAddress) {
    return (
      <div className='text-center py-12'>
        <p className='text-ink/40'>No token specified</p>
        <Link href='/rwa' className='text-sm text-mint hover:text-[#1B7A50] mt-2 inline-block'>
          Back to explorer
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
        <Link href='/rwa' className='text-sm text-mint hover:text-[#1B7A50] mt-2 inline-block'>
          Back to explorer
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className='flex items-center gap-4 mb-6'>
        <Link href='/rwa' className='p-2 hover:bg-ink/5 rounded-lg transition-colors'>
          <ArrowLeft className='w-4 h-4 text-ink/40' />
        </Link>
        <div className='flex-1'>
          <div className='flex items-center gap-3'>
            <h1 className='font-display text-2xl font-bold text-ink'>{token.name}</h1>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTokenStatusColor(token.status)}`}>
              {getTokenStatusLabel(token.status)}
            </span>
          </div>
          <p className='text-xs text-ink/40 mt-1 font-mono'>{tokenAddress}</p>
        </div>
      </div>

      <div className='grid grid-cols-3 gap-6'>
        <div className='col-span-2 space-y-6'>
          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h2 className='text-sm font-semibold text-ink mb-4'>Terms</h2>
            <div className='grid grid-cols-3 gap-4'>
              <div className='bg-ink/[0.02] rounded-xl p-4'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Type</div>
                <div className='text-sm text-ink capitalize'>{token.type}</div>
              </div>
              <div className='bg-ink/[0.02] rounded-xl p-4'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Amount</div>
                <div className='text-lg font-semibold text-ink'>{formatAmount(token.totalReceivable)}</div>
              </div>
              <div className='bg-ink/[0.02] rounded-xl p-4'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Interest</div>
                <div className='text-sm text-ink'>Up to {Number(token.interestRate) / 100}%</div>
              </div>
              <div className='bg-ink/[0.02] rounded-xl p-4'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Term</div>
                <div className='text-sm text-ink'>{getTermDays()} days</div>
              </div>
              <div className='bg-ink/[0.02] rounded-xl p-4'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Min Investment</div>
                <div className='text-sm text-ink'>{formatAmount(token.minInvestment)}</div>
              </div>
              <div className='bg-ink/[0.02] rounded-xl p-4'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Expires</div>
                <div className='text-sm text-ink'>{formatDate(token.expiresAt)}</div>
              </div>
            </div>
          </div>

          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h2 className='text-sm font-semibold text-ink mb-4'>Funding Progress</h2>
            <div className='h-3 bg-ink/10 rounded-full overflow-hidden'>
              <div className='h-full bg-mint rounded-full' style={{ width: `${getFundingPercent()}%` }} />
            </div>
            <div className='text-right text-xs text-ink/40 mt-2'>{getFundingPercent()}% funded</div>
          </div>

          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h2 className='text-sm font-semibold text-ink mb-4 flex items-center gap-2'>
              <Calculator className='w-4 h-4' />
              Investment Calculator
            </h2>
            <div className='grid grid-cols-2 gap-4 mb-4'>
              <div>
                <label className='block text-xs text-ink/40 mb-1.5'>Amount (USDC)</label>
                <input type='number' value={calcAmount} onChange={(e) => setCalcAmount(e.target.value)} placeholder='1000'
                  className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20' />
              </div>
              <div>
                <label className='block text-xs text-ink/40 mb-1.5'>Duration (days)</label>
                <input type='number' value={calcDays} onChange={(e) => setCalcDays(e.target.value)} placeholder='30'
                  className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20' />
              </div>
            </div>
            {calcAmount && parseFloat(calcAmount) > 0 && (
              <div className='bg-ink/[0.02] rounded-xl p-4 space-y-2 text-xs'>
                <div className='flex justify-between'><span className='text-ink/40'>Investment</span><span className='text-ink/60'>{calcAmount} USDC</span></div>
                <div className='flex justify-between'><span className='text-ink/40'>Tokens</span><span className='text-ink/60'>{((parseFloat(calcAmount) * 1_000_000) / (Number(token.totalReceivable) / 1e18)).toLocaleString()}</span></div>
                <div className='flex justify-between'><span className='text-ink/40'>Ownership</span><span className='text-ink/60'>{((parseFloat(calcAmount) * 100) / (Number(token.totalReceivable) / 1e18)).toFixed(4)}%</span></div>
              </div>
            )}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h2 className='text-sm font-semibold text-ink mb-3'>Token</h2>
            <div className='flex items-center gap-2'>
              <span className='text-xs font-mono text-ink/60 truncate'>{tokenAddress}</span>
              <a href={`https://testnet.arcscan.app/address/${tokenAddress}`} target='_blank' rel='noopener noreferrer'>
                <ExternalLink className='w-3 h-3 text-ink/30 hover:text-ink/60' />
              </a>
            </div>
          </div>

          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h2 className='text-sm font-semibold text-ink mb-3'>Interested in Funding?</h2>
            <p className='text-xs text-ink/50 mb-4'>Connect with the issuer through their private workspace.</p>
            <a href='/start' className='block w-full text-center px-4 py-2 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 transition-opacity'>Open App</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RWATokenDetailPage() {
  return (
    <Suspense fallback={<div className='flex items-center justify-center min-h-[400px]'><Loader2 className='w-6 h-6 text-ink/40 animate-spin' /></div>}>
      <RWATokenDetailContent />
    </Suspense>
  )
}
