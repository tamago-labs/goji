'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { TrendingUp, ExternalLink, Loader2 } from 'lucide-react'
import { usePublicClient } from 'wagmi'
import { RECEIVABLE_FACTORY_ABI, RECEIVABLE_FACTORY_ADDRESS } from '../../../../lib/receivableFactory'
import { RECEIVABLE_TOKEN_ABI, getTokenStatusLabel, getTokenStatusColor } from '../../../../lib/receivableToken'

interface ReceivableInfo {
  address: string
  name: string
  type: string
  totalReceivable: bigint
  interestRate: bigint
  fundedAmount: bigint
  expiresAt: bigint
  status: number
}

export default function ReceivablesListPage() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [receivables, setReceivables] = useState<ReceivableInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address || !publicClient) {
      setLoading(false)
      return
    }

    async function load() {
      try {
        // Get token addresses from factory
        let tokenAddresses: string[] = []
        try {
          tokenAddresses = await publicClient!.readContract({
            address: RECEIVABLE_FACTORY_ADDRESS,
            abi: RECEIVABLE_FACTORY_ABI,
            functionName: 'getReceivables',
            args: [address!]
          }) as string[]
        } catch (e) {
          console.error('Failed to get receivables from factory:', e)
          setLoading(false)
          return
        }

        // Get info from each token
        const infos: ReceivableInfo[] = []
        for (const tokenAddr of tokenAddresses) {
          if (!tokenAddr || tokenAddr === '0x0000000000000000000000000000000000000000') continue
          try {
            const info = await publicClient!.readContract({
              address: tokenAddr as `0x${string}`,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'getReceivableInfo'
            }) as [string, string, bigint, bigint, bigint, bigint, bigint, bigint, number]

            const name = await publicClient!.readContract({
              address: tokenAddr as `0x${string}`,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'name'
            }) as string

            infos.push({
              address: tokenAddr as `0x${string}`,
              name,
              type: info[0],
              totalReceivable: info[2],
              interestRate: info[3],
              fundedAmount: info[7],
              expiresAt: info[6],
              status: info[8]
            })
          } catch (e) {
            console.error('Failed to load token:', tokenAddr, e)
          }
        }

        setReceivables(infos)
      } catch (e) {
        console.error('Failed to load receivables:', e)
      }
      setLoading(false)
    }

    load()
  }, [address, publicClient])

  const formatAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toLocaleString()} USDC`
  }

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }

  const getFundingPercent = (funded: bigint, total: bigint) => {
    if (total === BigInt(0)) return 0
    return Number((funded * BigInt(100)) / total)
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='font-display text-xl font-semibold'>My Receivables</h2>
        <Link
          href='/start/receivables/create'
          className='px-4 py-2 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 transition-opacity'
        >
          Create New
        </Link>
      </div>

      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
        {loading ? (
          <div className='flex items-center justify-center min-h-[200px]'>
            <Loader2 className='w-6 h-6 text-ink/40 animate-spin' />
          </div>
        ) : receivables.length === 0 ? (
          <div className='p-8 text-center'>
            <TrendingUp className='w-8 h-8 text-ink/20 mx-auto mb-2' />
            <p className='text-ink/40 text-sm font-medium mb-1'>No receivables yet</p>
            <p className='text-ink/30 text-xs mb-4'>Create your first receivable from verified payment proofs.</p>
            <Link
              href='/start/receivables/create'
              className='inline-flex items-center gap-2 px-4 py-2 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 transition-opacity'
            >
              Create Receivable
            </Link>
          </div>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-ink/5 text-left'>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Name</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Type</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Amount</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Interest</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Funded</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Expires</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Status</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'></th>
              </tr>
            </thead>
            <tbody>
              {receivables.map((r) => (
                <tr key={r.address} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                  <td className='px-6 py-3 text-ink/70 text-sm font-medium'>{r.name}</td>
                  <td className='px-6 py-3 text-ink/50 text-xs capitalize'>{r.type}</td>
                  <td className='px-6 py-3 font-mono text-ink/60 text-sm'>{formatAmount(r.totalReceivable)}</td>
                  <td className='px-6 py-3 text-ink/60 text-sm'>{Number(r.interestRate) / 100}%</td>
                  <td className='px-6 py-3'>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 h-1.5 bg-ink/10 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-mint rounded-full'
                          style={{ width: `${getFundingPercent(r.fundedAmount, r.totalReceivable)}%` }}
                        />
                      </div>
                      <span className='text-[10px] text-ink/40 font-mono'>
                        {getFundingPercent(r.fundedAmount, r.totalReceivable)}%
                      </span>
                    </div>
                  </td>
                  <td className='px-6 py-3 text-ink/50 text-xs'>{formatDate(r.expiresAt)}</td>
                  <td className='px-6 py-3'>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getTokenStatusColor(r.status)}`}>
                      {getTokenStatusLabel(r.status)}
                    </span>
                  </td>
                  <td className='px-6 py-3'>
                    <Link
                      href={`/start/receivables/${r.address}`}
                      className='text-[10px] text-mint hover:text-[#1B7A50] font-medium transition-colors'
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
