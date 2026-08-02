'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Loader2, ExternalLink, Package } from 'lucide-react'
import { usePublicClient } from 'wagmi'
import { RECEIVABLE_FACTORY_ABI, RECEIVABLE_FACTORY_ADDRESS } from '../../lib/receivableFactory'
import { RECEIVABLE_TOKEN_ABI, getTokenStatusLabel, getTokenStatusColor } from '../../lib/receivableToken'

interface TokenData {
  address: string
  name: string
  type: string
  amount: bigint
  interestRate: bigint
  expiresAt: bigint
  issuedAt: bigint
  fundedAmount: bigint
  status: number
  issuer: string
}

export default function RWAPage() {
  const publicClient = usePublicClient()
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (!publicClient) return

    async function load() {
      try {
        // Known issuers (hardcoded for now)
        const knownIssuers = [
          '0x3D63Ce608deB81f9436198A93BCC2e8f3D79F56E'
        ]

        // Get token addresses for each issuer
        const allTokenAddresses: string[] = []
        for (const issuer of knownIssuers) {
          try {
            const addresses = await publicClient!.readContract({
              address: RECEIVABLE_FACTORY_ADDRESS,
              abi: RECEIVABLE_FACTORY_ABI,
              functionName: 'getReceivables',
              args: [issuer as `0x${string}`]
            }) as string[]
            allTokenAddresses.push(...addresses)
          } catch (e) {
            console.error('Failed to get receivables for issuer:', issuer, e)
          }
        }

        // Get unique token addresses
        const tokenAddresses = [...new Set(allTokenAddresses.filter(a => a !== '0x0000000000000000000000000000000000000000'))]

        // Fetch details for each token
        const tokenData: TokenData[] = []
        for (const addr of tokenAddresses) {
          try {
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

            tokenData.push({
              address: addr,
              name,
              type: info[0],
              issuer: info[1],
              amount: info[2],
              interestRate: info[3],
              expiresAt: info[6],
              issuedAt: info[5],
              fundedAmount: info[7],
              status: info[8]
            })
          } catch (e) {
            console.error('Failed to load token:', addr, e)
          }
        }

        setTokens(tokenData)
      } catch (e) {
        console.error('Failed to load events:', e)
      }
      setLoading(false)
    }

    load()
  }, [publicClient])

  const formatAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toLocaleString()} USDC`
  }

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getTermDays = (issuedAt: bigint, expiresAt: bigint) => {
    return Math.ceil((Number(expiresAt) - Number(issuedAt)) / 86400)
  }

  const getFundingPercent = (funded: bigint, total: bigint) => {
    if (total === 0n) return 0
    return Number((funded * 100n) / total)
  }

  const filtered = tokens.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (filterStatus !== 'all') {
      const statusNum = filterStatus === 'active' ? 0 : filterStatus === 'funded' ? 1 : -1
      if (t.status !== statusNum) return false
    }
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='font-display text-3xl font-bold text-ink mb-2'>RWA Explorer</h1>
        <p className='text-ink/50 max-w-2xl'>
          Browse real-world assets verified on Arc. Each asset has cryptographic proof of payment history.
        </p>
      </div>

      {/* Table */}
      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
        {/* Filters */}
        <div className='px-6 py-3 border-b border-ink/8 flex items-center gap-4'>
          <div className='relative flex-1 max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30' />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search assets...'
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

        {/* Content */}
        {loading ? (
          <div className='flex items-center justify-center min-h-[300px]'>
            <Loader2 className='w-6 h-6 text-ink/40 animate-spin' />
          </div>
        ) : filtered.length === 0 ? (
          <div className='p-12 text-center'>
            <Package className='w-10 h-10 text-ink/20 mx-auto mb-3' />
            <p className='text-ink/40 text-sm font-medium mb-1'>No assets found</p>
            <p className='text-ink/30 text-xs'>Check back later for new investment opportunities.</p>
          </div>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-ink/5 text-left'>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Name</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Type</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Amount</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium' title='Interest is pro-rata: earlier investors earn more'>Interest*</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Tokens</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Funded</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Status</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((token) => (
                <tr key={token.address} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                  <td className='px-6 py-4 text-ink/70 text-sm font-medium'>{token.name}</td>
                  <td className='px-6 py-4 text-ink/50 text-xs capitalize'>{token.type}</td>
                  <td className='px-6 py-4 font-mono text-ink/60 text-sm'>{formatAmount(token.amount)}</td>
                  <td className='px-6 py-4 text-ink/60 text-sm' title='Pro-rata: earlier investors earn more'>
                    {Number(token.interestRate) / 100}%*
                  </td>
                  <td className='px-6 py-4 font-mono text-ink/50 text-xs'>1,000,000</td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-2'>
                      <div className='w-16 h-1.5 bg-ink/10 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-mint rounded-full'
                          style={{ width: `${getFundingPercent(token.fundedAmount, token.amount)}%` }}
                        />
                      </div>
                      <span className='text-[10px] text-ink/40 font-mono'>
                        {getFundingPercent(token.fundedAmount, token.amount)}%
                      </span>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    {token.status === 0 && <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700'>Active</span>}
                    {token.status === 1 && <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>Funded</span>}
                    {token.status === 2 && <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'>Expired</span>}
                    {token.status === 3 && <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>Redeemed</span>}
                  </td>
                  <td className='px-6 py-4'>
                    <Link
                      href={`/rwa/${token.address}`}
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

      {/* Note */}
      <div className='mt-4 text-[10px] text-ink/30'>
        * Interest is pro-rata: calculated based on how long your funds are invested. Earlier investors earn more interest than later investors.
      </div>
    </div>
  )
}
