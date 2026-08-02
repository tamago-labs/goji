'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { usePublicClient, useWalletClient } from 'wagmi'
import { DollarSign, Loader2, ExternalLink, Wallet } from 'lucide-react'
import Link from 'next/link'
import { RECEIVABLE_TOKEN_ABI, getTokenStatusLabel, getTokenStatusColor } from '../../../lib/receivableToken'
import { RECEIVABLE_FACTORY_ABI, RECEIVABLE_FACTORY_ADDRESS } from '../../../lib/receivableFactory'

interface TokenInfo {
  address: string
  name: string
  type: string
  totalReceivable: bigint
  interestRate: bigint
  minInvestment: bigint
  expiresAt: bigint
  fundedAmount: bigint
  status: number
}

interface PortfolioItem {
  address: string
  name: string
  type: string
  myTokens: bigint
  projectedShare: bigint
  myInterest: bigint
  status: number
}

export default function FundingPage() {
  const searchParams = useSearchParams()
  const tokenAddress = searchParams.get('token')
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [token, setToken] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(!!tokenAddress)
  const [investAmount, setInvestAmount] = useState('')
  const [investing, setInvesting] = useState(false)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [loadingPortfolio, setLoadingPortfolio] = useState(true)

  // Load token info if token address provided
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

        setToken({
          address: tokenAddress!,
          name,
          type: info[0],
          totalReceivable: info[2],
          interestRate: info[3],
          minInvestment: info[4],
          expiresAt: info[6],
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

  // Load portfolio
  useEffect(() => {
    if (!publicClient || !address) return

    async function loadPortfolio() {
      try {
        // Get all token addresses from factory
        const tokenAddresses = await publicClient!.readContract({
          address: RECEIVABLE_FACTORY_ADDRESS,
          abi: RECEIVABLE_FACTORY_ABI,
          functionName: 'getReceivables',
          args: [address!]
        }) as string[]

        const items: PortfolioItem[] = []
        for (const addr of tokenAddresses) {
          if (!addr || addr === '0x0000000000000000000000000000000000000000') continue

          try {
            const myTokens = await publicClient!.readContract({
              address: addr,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'balanceOf',
              args: [address!]
            }) as bigint

            if (myTokens === 0n) continue

            const info = await publicClient!.readContract({
              address: addr,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'getReceivableInfo'
            }) as [string, string, bigint, bigint, bigint, bigint, bigint, bigint, number]

            const name = await publicClient!.readContract({
              address: addr,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'name'
            }) as string

            const myShare = await publicClient!.readContract({
              address: addr,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'calculateShare',
              args: [address!]
            }) as bigint

            const myInterest = await publicClient!.readContract({
              address: addr,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'calculateInvestorInterest',
              args: [address!]
            }) as bigint

            // Calculate projected share (principal + interest) since totalRedeemable is 0 before repayment
            const totalReceivable = info[2]
            const projectedPrincipal = (myTokens * totalReceivable) / 1_000_000_000_000n
            const projectedShare = projectedPrincipal + myInterest

            items.push({
              address: addr,
              name,
              type: info[0],
              myTokens,
              projectedShare,
              myInterest,
              status: info[8]
            })
          } catch (e) {
            console.error('Failed to load portfolio item:', addr, e)
          }
        }

        setPortfolio(items)
      } catch (e) {
        console.error('Failed to load portfolio:', e)
      }
      setLoadingPortfolio(false)
    }

    loadPortfolio()
  }, [publicClient, address])

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

  const handleRedeem = async (tokenAddr: string) => {
    if (!walletClient || !publicClient || !address) return

    try {
      const { request } = await publicClient.simulateContract({
        address: tokenAddr as `0x${string}`,
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

  const getFundingPercent = (funded: bigint, total: bigint) => {
    if (total === 0n) return 0
    return Number((funded * 100n) / total)
  }

  return (
    <div>
      <h2 className='font-display text-xl font-semibold mb-6'>Funding</h2>

      <div className='grid grid-cols-2 gap-6'>
        {/* Invest Section */}
        {tokenAddress && (
          <div className='col-span-2'>
            {loading ? (
              <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
                <div className='flex items-center justify-center min-h-[100px]'>
                  <Loader2 className='w-6 h-6 text-ink/40 animate-spin' />
                </div>
              </div>
            ) : token ? (
              <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
                <h3 className='text-sm font-semibold text-ink mb-4'>Invest in {token.name}</h3>

                <div className='grid grid-cols-2 gap-4 mb-4'>
                  <div className='bg-ink/[0.02] rounded-xl p-3'>
                    <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Amount</div>
                    <div className='text-sm font-semibold text-ink'>{formatAmount(token.totalReceivable)}</div>
                  </div>
                  <div className='bg-ink/[0.02] rounded-xl p-3'>
                    <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Interest</div>
                    <div className='text-sm text-ink'>Up to {Number(token.interestRate) / 100}%</div>
                  </div>
                  <div className='bg-ink/[0.02] rounded-xl p-3'>
                    <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Funded</div>
                    <div className='text-sm text-ink'>{getFundingPercent(token.fundedAmount, token.totalReceivable)}%</div>
                  </div>
                  <div className='bg-ink/[0.02] rounded-xl p-3'>
                    <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Min Investment</div>
                    <div className='text-sm text-ink'>{formatAmount(token.minInvestment)}</div>
                  </div>
                </div>

                <div className='mb-4'>
                  <label className='block text-xs text-ink/40 mb-1.5'>Investment Amount (USDC)</label>
                  <input
                    type='number'
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder='100'
                    min={Number(token.minInvestment) / 1e18}
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
              </div>
            ) : (
              <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6 text-center'>
                <p className='text-ink/40 text-sm'>Token not found</p>
              </div>
            )}
          </div>
        )}

        {/* Portfolio Section */}
        <div className={tokenAddress ? '' : 'col-span-2'}>
          <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
            <div className='px-6 py-3 border-b border-ink/8'>
              <span className='text-xs text-ink/40 uppercase tracking-wider'>Your Portfolio ({portfolio.length})</span>
            </div>

            {loadingPortfolio ? (
              <div className='flex items-center justify-center min-h-[150px]'>
                <Loader2 className='w-6 h-6 text-ink/40 animate-spin' />
              </div>
            ) : portfolio.length === 0 ? (
              <div className='p-8 text-center'>
                <Wallet className='w-8 h-8 text-ink/20 mx-auto mb-2' />
                <p className='text-ink/40 text-sm font-medium mb-1'>No investments yet</p>
                <p className='text-ink/30 text-xs'>Fund a receivable to see it here.</p>
              </div>
            ) : (
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-ink/5 text-left'>
                    <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Name</th>
                    <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Tokens</th>
                    <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Share</th>
                    <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Interest</th>
                    <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Status</th>
                    <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'></th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((item) => (
                    <tr key={item.address} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                      <td className='px-6 py-3 text-ink/70 text-sm font-medium'>{item.name}</td>
                      <td className='px-6 py-3 font-mono text-ink/60 text-xs'>{formatTokens(item.myTokens)}</td>
                      <td className='px-6 py-3 text-ink/60 text-sm'>{formatAmount(item.projectedShare)}</td>
                      <td className='px-6 py-3 text-[#28C840] text-sm'>{formatAmount(item.myInterest)}</td>
                      <td className='px-6 py-3'>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTokenStatusColor(item.status)}`}>
                          {getTokenStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className='px-6 py-3'>
                        {item.status === 3 && (
                          <button
                            onClick={() => handleRedeem(item.address)}
                            className='text-[10px] text-mint hover:text-[#1B7A50] font-medium transition-colors'
                          >
                            Redeem
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
