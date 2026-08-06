'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { usePublicClient, useWalletClient } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import { Wallet, Loader2 } from 'lucide-react'
import { RECEIVABLE_TOKEN_ABI, getTokenStatusLabel, getTokenStatusColor } from '../../../lib/receivableToken'
import { useStart } from './StartProvider'

interface PortfolioItem {
  address: string
  name: string
  type: string
  myTokens: bigint
  projectedShare: bigint
  myInterest: bigint
  status: number
}

export default function Portfolio() {
  const { address } = useAccount()
  const { apiUrl } = useStart()
  const publicClient = usePublicClient({ chainId: arcTestnet.id })
  const { data: walletClient } = useWalletClient()
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!publicClient || !address) {
      const handle = window.setTimeout(() => setLoading(false), 0)
      return () => window.clearTimeout(handle)
    }

    async function loadPortfolio() {
      try {
        const receivablesResponse = await fetch(`${apiUrl}/api/receivables`)
        const receivables = receivablesResponse.ok ? await receivablesResponse.json() : []
        const tokenAddresses = receivables.map((receivable: { tokenAddress: string }) => receivable.tokenAddress)

        const items: PortfolioItem[] = []
        for (const addr of tokenAddresses) {
          if (!addr || addr === '0x0000000000000000000000000000000000000000') continue

          try {
            const myTokens = await publicClient!.readContract({
              address: addr as `0x${string}`,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'balanceOf',
              args: [address!]
            }) as bigint

            if (myTokens === BigInt(0)) continue

            const info = await publicClient!.readContract({
              address: addr as `0x${string}`,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'getReceivableInfo'
            }) as [string, string, bigint, bigint, bigint, bigint, bigint, bigint, number]

            const name = await publicClient!.readContract({
              address: addr as `0x${string}`,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'name'
            }) as string

            const myInterest = await publicClient!.readContract({
              address: addr as `0x${string}`,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'calculateInvestorInterest',
              args: [address!]
            }) as bigint

            const totalReceivable = info[2]
            const projectedPrincipal = (myTokens * totalReceivable) / BigInt(1_000_000_000_000)
            const projectedShare = projectedPrincipal + myInterest

            items.push({
              address: addr as `0x${string}`,
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
      setLoading(false)
    }

    loadPortfolio()
  }, [apiUrl, publicClient, address])

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

  if (loading) {
    return (
      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
        <div className='flex items-center justify-center min-h-[100px]'>
          <Loader2 className='w-5 h-5 text-ink/40 animate-spin' />
        </div>
      </div>
    )
  }

  return (
    <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
      <div className='px-6 py-3 border-b border-ink/8 flex items-center justify-between'>
        <span className='text-xs text-ink/40 uppercase tracking-wider'>Your Investments</span>
        <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-ink/10 text-ink/50'>
          {portfolio.length}
        </span>
      </div>

      {portfolio.length === 0 ? (
        <div className='p-6 text-center'>
          <Wallet className='w-6 h-6 text-ink/20 mx-auto mb-2' />
          <p className='text-ink/40 text-xs'>No investments yet</p>
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
  )
}
