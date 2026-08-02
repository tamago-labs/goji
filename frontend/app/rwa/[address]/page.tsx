'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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

export default function RWATokenDetailPage() {
  const params = useParams()
  const tokenAddress = params.address as string
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
      {/* Header */}
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
        <div className='col-span-2 space-y-6'>
          {/* Terms */}
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
                <div className='text-[10px] text-ink/40'>Pro-rata by time</div>
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

          {/* Funding Progress */}
          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h2 className='text-sm font-semibold text-ink mb-4'>Funding Progress</h2>
            <div className='mb-3'>
              <div className='flex items-center justify-between text-sm mb-2'>
                <span className='text-ink/60'>{formatAmount(token.fundedAmount)} funded</span>
                <span className='text-ink/40'>{formatAmount(token.totalReceivable)} total</span>
              </div>
              <div className='h-3 bg-ink/10 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-mint rounded-full transition-all'
                  style={{ width: `${getFundingPercent()}%` }}
                />
              </div>
              <div className='text-right text-xs text-ink/40 mt-2'>{getFundingPercent()}% funded</div>
            </div>
          </div>

          {/* Investment Calculator */}
          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h2 className='text-sm font-semibold text-ink mb-4 flex items-center gap-2'>
              <Calculator className='w-4 h-4' />
              Investment Calculator
            </h2>
            <p className='text-xs text-ink/40 mb-4'>
              Estimate your potential returns. Interest is calculated pro-rata based on investment duration.
            </p>
            
            <div className='grid grid-cols-2 gap-4 mb-4'>
              <div>
                <label className='block text-xs text-ink/40 mb-1.5'>Investment Amount (USDC)</label>
                <input
                  type='number'
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  placeholder='1000'
                  className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
                />
              </div>
              <div>
                <label className='block text-xs text-ink/40 mb-1.5'>Investment Duration (days)</label>
                <input
                  type='number'
                  value={calcDays}
                  onChange={(e) => setCalcDays(e.target.value)}
                  placeholder='30'
                  className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
                />
              </div>
            </div>

            {calcAmount && parseFloat(calcAmount) > 0 && (
              <div className='bg-ink/[0.02] rounded-xl p-4 space-y-2'>
                <div className='flex justify-between text-xs'>
                  <span className='text-ink/40'>Investment</span>
                  <span className='text-ink/60'>{calcAmount} USDC</span>
                </div>
                <div className='flex justify-between text-xs'>
                  <span className='text-ink/40'>Tokens Received</span>
                  <span className='text-ink/60'>
                    {((parseFloat(calcAmount) * 1_000_000) / (Number(token.totalReceivable) / 1e18)).toLocaleString()} tokens
                  </span>
                </div>
                <div className='flex justify-between text-xs'>
                  <span className='text-ink/40'>Ownership</span>
                  <span className='text-ink/60'>
                    {((parseFloat(calcAmount) * 100) / (Number(token.totalReceivable) / 1e18)).toFixed(4)}%
                  </span>
                </div>
                <div className='border-t border-ink/10 pt-2 mt-2'>
                  <div className='flex justify-between text-xs'>
                    <span className='text-ink/40'>Interest Rate (APR)</span>
                    <span className='text-ink/60'>Up to {Number(token.interestRate) / 100}%</span>
                  </div>
                  <div className='flex justify-between text-xs'>
                    <span className='text-ink/40'>Duration</span>
                    <span className='text-ink/60'>{calcDays || 0} days</span>
                  </div>
                  <div className='flex justify-between text-xs font-medium mt-1'>
                    <span className='text-ink/60'>Projected Interest</span>
                    <span className='text-[#28C840]'>
                      {(() => {
                        const amount = parseFloat(calcAmount) || 0
                        const days = parseInt(calcDays) || 0
                        const rate = Number(token.interestRate) / 10000
                        const termDays = getTermDays()
                        const interest = amount * (days / termDays) * rate
                        return interest.toFixed(2)
                      })()} USDC
                    </span>
                  </div>
                  <div className='flex justify-between text-sm font-semibold mt-1'>
                    <span className='text-ink/70'>Projected Return</span>
                    <span className='text-ink'>
                      {(() => {
                        const amount = parseFloat(calcAmount) || 0
                        const days = parseInt(calcDays) || 0
                        const rate = Number(token.interestRate) / 10000
                        const termDays = getTermDays()
                        const interest = amount * (days / termDays) * rate
                        return (amount + interest).toFixed(2)
                      })()} USDC
                    </span>
                  </div>
                </div>
                <p className='text-[10px] text-ink/30 mt-2'>
                  * Actual returns depend on when you invest and when the company repays. Pro-rata interest means earlier investments earn more.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Token Address */}
          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h2 className='text-sm font-semibold text-ink mb-3'>Token</h2>
            <div className='flex items-center gap-2'>
              <span className='text-xs font-mono text-ink/60 truncate'>{tokenAddress}</span>
              <a
                href={`https://testnet.arcscan.app/address/${tokenAddress}`}
                target='_blank'
                rel='noopener noreferrer'
              >
                <ExternalLink className='w-3 h-3 text-ink/30 hover:text-ink/60' />
              </a>
            </div>
          </div>

          {/* Contact Message */}
          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
            <h2 className='text-sm font-semibold text-ink mb-3'>Interested in Funding?</h2>
            <p className='text-xs text-ink/50 mb-4'>
              Connect with the issuer company through their private workspace. Get real-time communication and access to their knowledge base powered by AI.
            </p>
            <div className='bg-ink/[0.02] rounded-xl p-4 mb-4'>
              <p className='text-[10px] text-ink/40 uppercase tracking-wider mb-2'>How to Connect</p>
              <ol className='text-xs text-ink/60 space-y-2 list-decimal list-inside'>
                <li>Contact the issuer company directly</li>
                <li>Request an invite code to their workspace</li>
                <li>Join the P2P terminal for real-time collaboration</li>
              </ol>
            </div>
            <a
              href='/start'
              className='block w-full text-center px-4 py-2 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 transition-opacity'
            >
              Open App
            </a>
            <p className='text-[10px] text-ink/30 mt-3 text-center'>
              You will need an invite code from the issuer to join their workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
