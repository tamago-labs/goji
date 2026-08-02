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
        // Get latest block number
        const latestBlock = await publicClient!.getBlockNumber()
        const chunkSize = 1000n
        const allEvents: any[] = []

        // Paginate through blocks in chunks
        for (let from = 0n; from <= latestBlock; from += chunkSize) {
          const to = from + chunkSize - 1n > latestBlock ? latestBlock : from + chunkSize - 1n
          try {
            const events = await publicClient!.getLogs({
              address: RECEIVABLE_FACTORY_ADDRESS,
              event: {
                type: 'event',
                name: 'ReceivableCreated',
                inputs: [
                  { type: 'address', name: 'token', indexed: true },
                  { type: 'address', name: 'issuer', indexed: true },
                  { type: 'string', name: 'name', indexed: false },
                  { type: 'uint256', name: 'amount', indexed: false },
                  { type: 'uint256', name: 'interestRate', indexed: false },
                  { type: 'uint256', name: 'expiresAt', indexed: false }
                ]
              },
              fromBlock: from,
              toBlock: to
            })
            allEvents.push(...events)
          } catch (e) {
            console.error(`Failed to fetch events for blocks ${from}-${to}:`, e)
          }
        }

        // Get unique token addresses
        const tokenAddresses = [...new Set(allEvents.map(e => e.args.token))]

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
          Browse verified real-world assets from businesses. Each asset is backed by cryptographic proofs on Arc.
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
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Interest</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Term</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Status</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Issuer</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((token) => (
                <tr key={token.address} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                  <td className='px-6 py-4 text-ink/70 text-sm font-medium'>{token.name}</td>
                  <td className='px-6 py-4 text-ink/50 text-xs capitalize'>{token.type}</td>
                  <td className='px-6 py-4 font-mono text-ink/60 text-sm'>{formatAmount(token.amount)}</td>
                  <td className='px-6 py-4 text-ink/60 text-sm'>{Number(token.interestRate) / 100}%</td>
                  <td className='px-6 py-4 text-ink/50 text-xs'>{getTermDays(token.issuedAt, token.expiresAt)} days</td>
                  <td className='px-6 py-4'>
                    {token.status === 0 && <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700'>Active</span>}
                    {token.status === 1 && <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>Funded</span>}
                    {token.status === 2 && <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'>Expired</span>}
                    {token.status === 3 && <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>Redeemed</span>}
                  </td>
                  <td className='px-6 py-4 text-ink/40 text-xs font-mono'>{shortenAddress(token.issuer)}</td>
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

      {/* Contact Message */}
      <div className='mt-8 bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6 text-center'>
        <p className='text-ink/50 text-sm mb-2'>
          Interested in funding these assets?
        </p>
        <p className='text-ink/40 text-xs max-w-xl mx-auto'>
          Connect your wallet and visit the app to invest, or contact the company directly to discuss investment opportunities.
        </p>
        <a
          href='/start'
          className='inline-block mt-4 px-6 py-2 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 transition-opacity'
        >
          Open App
        </a>
      </div>
    </div>
  )
}
