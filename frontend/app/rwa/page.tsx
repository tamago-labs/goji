'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePublicClient } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import { Search, Loader2, ExternalLink, Shield, Package } from 'lucide-react'
import { RECEIVABLE_POOL_FACTORY_ABI, RECEIVABLE_POOL_FACTORY_ADDRESS, RECEIVABLE_POOL_ABI } from '../../lib/receivablePool'

interface PoolSummary {
  address: string
  name: string
  apy: number
  tier: number
  depositsOpen: boolean
  assets: bigint
  totalSupply: bigint
  receivables: number
  term: number
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='text-center'>
      <div className='text-lg font-semibold text-ink'>{value}</div>
      <div className='text-[10px] text-ink/40 uppercase tracking-wider'>{label}</div>
    </div>
  )
}

export default function RWAPage() {
  const publicClient = usePublicClient({ chainId: arcTestnet.id })
  const [pools, setPools] = useState<PoolSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open')

  useEffect(() => {
    if (!publicClient) return

    async function loadPools() {
      try {
        const addresses = await publicClient!.readContract({
          address: RECEIVABLE_POOL_FACTORY_ADDRESS,
          abi: RECEIVABLE_POOL_FACTORY_ABI,
          functionName: 'getPools'
        }) as string[]

        const data: PoolSummary[] = []
        for (const addr of addresses) {
          const pool = addr as `0x${string}`
          try {
            const [name, apy, tier, depositsOpen, assets, totalSupply, receivables, term] = await Promise.all([
              publicClient!.readContract({ address: pool, abi: RECEIVABLE_POOL_ABI, functionName: 'name' }),
              publicClient!.readContract({ address: pool, abi: RECEIVABLE_POOL_ABI, functionName: 'targetApyBps' }),
              publicClient!.readContract({ address: pool, abi: RECEIVABLE_POOL_ABI, functionName: 'requiredComplianceTier' }),
              publicClient!.readContract({ address: pool, abi: RECEIVABLE_POOL_ABI, functionName: 'depositsOpen' }),
              publicClient!.readContract({ address: pool, abi: RECEIVABLE_POOL_ABI, functionName: 'totalAssets' }),
              publicClient!.readContract({ address: pool, abi: RECEIVABLE_POOL_ABI, functionName: 'totalSupply' }),
              publicClient!.readContract({ address: pool, abi: RECEIVABLE_POOL_ABI, functionName: 'receivableCount' }),
              publicClient!.readContract({ address: pool, abi: RECEIVABLE_POOL_ABI, functionName: 'poolTerm' })
            ])

            data.push({
              address: pool,
              name: String(name || 'Unnamed Pool'),
              apy: Number(apy) / 100,
              tier: Number(tier),
              depositsOpen: Boolean(depositsOpen),
              assets: assets as bigint,
              totalSupply: totalSupply as bigint,
              receivables: Number(receivables),
              term: Number(term)
            })
          } catch (e) {
            console.error('Failed to load pool:', addr, e)
          }
        }
        setPools(data)
      } catch (e) {
        console.error('Failed to load pools:', e)
      }
      setLoading(false)
    }

    loadPools()
  }, [publicClient])

  const formatAmount = (amount: bigint) => {
    return `$${(Number(amount) / 1e18).toLocaleString()}`
  }

  const filtered = pools.filter(p => {
    if (filter === 'open' && !p.depositsOpen) return false
    if (filter === 'closed' && p.depositsOpen) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Calculate stats
  const totalTVL = pools.reduce((sum, p) => sum + p.assets, BigInt(0))
  const avgApy = pools.length > 0 ? pools.reduce((sum, p) => sum + p.apy, 0) / pools.length : 0
  const openPools = pools.filter(p => p.depositsOpen).length

  return (
    <div>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='font-display text-3xl font-bold text-ink mb-2'>RWA Pools</h1>
        <p className='text-ink/50 max-w-2xl'>
          Invest in verified receivable pools managed by compliant financial partners. Earn yield from real-world assets on Arc.
        </p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-4 gap-4 mb-8'>
        <div className='bg-card rounded-xl p-4 text-center shadow-[0_2px_8px_rgba(43,36,64,0.04)]'>
          <Stat label="Total Value Locked" value={formatAmount(totalTVL)} />
        </div>
        <div className='bg-card rounded-xl p-4 text-center shadow-[0_2px_8px_rgba(43,36,64,0.04)]'>
          <Stat label="Average APY" value={`${avgApy.toFixed(1)}%`} />
        </div>
        <div className='bg-card rounded-xl p-4 text-center shadow-[0_2px_8px_rgba(43,36,64,0.04)]'>
          <Stat label="Open Pools" value={String(openPools)} />
        </div>
        <div className='bg-card rounded-xl p-4 text-center shadow-[0_2px_8px_rgba(43,36,64,0.04)]'>
          <Stat label="Total Pools" value={String(pools.length)} />
        </div>
      </div>

      {/* Filters */}
      <div className='flex items-center gap-4 mb-6'>
        <div className='relative flex-1 max-w-xs'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30' />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search pools...'
            className='w-full text-xs text-ink bg-ink/5 border border-ink/10 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-ink/20'
          />
        </div>
        <div className='flex gap-2'>
          {(['all', 'open', 'closed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f
                  ? 'bg-ink text-lavender'
                  : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Pool Table */}
      {loading ? (
        <div className='flex items-center justify-center min-h-[300px]'>
          <Loader2 className='w-6 h-6 text-ink/40 animate-spin' />
        </div>
      ) : filtered.length === 0 ? (
        <div className='bg-card rounded-2xl p-12 text-center shadow-[0_2px_8px_rgba(43,36,64,0.04)]'>
          <Package className='w-10 h-10 text-ink/20 mx-auto mb-3' />
          <p className='text-ink/40 text-sm font-medium mb-1'>No pools available</p>
          <p className='text-ink/30 text-xs'>Check back later for new investment opportunities.</p>
        </div>
      ) : (
        <div className='bg-card rounded-2xl shadow-[0_2px_8px_rgba(43,36,64,0.04)] overflow-hidden'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-ink/5 text-left'>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Pool</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>APY</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>TVL</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Compliance</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Term</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Status</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pool) => (
                <tr key={pool.address} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                  <td className='px-6 py-4'>
                    <div className='text-sm font-medium text-ink'>{pool.name}</div>
                    <div className='text-[10px] text-ink/40 font-mono mt-0.5'>{pool.address.slice(0, 10)}...</div>
                  </td>
                  <td className='px-6 py-4 text-[#28C840] font-semibold text-sm'>{pool.apy}%</td>
                  <td className='px-6 py-4 font-mono text-ink/60 text-sm'>{formatAmount(pool.assets)}</td>
                  <td className='px-6 py-4'>
                    {pool.tier > 0 ? (
                      <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet/15 text-[#5A4FB8]'>
                        Tier {pool.tier}+
                      </span>
                    ) : (
                      <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink/10 text-ink/40'>
                        Open
                      </span>
                    )}
                  </td>
                  <td className='px-6 py-4 text-ink/50 text-xs'>
                    {pool.term > 0 ? `${Math.floor(pool.term / 86400)} days` : 'Open'}
                  </td>
                  <td className='px-6 py-4'>
                    {pool.depositsOpen ? (
                      <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>Open</span>
                    ) : (
                      <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-ink/10 text-ink/40'>Closed</span>
                    )}
                  </td>
                  <td className='px-6 py-4'>
                    <Link
                      href={`/rwa/pool?address=${pool.address}`}
                      className='text-[10px] text-mint hover:text-[#1B7A50] font-medium transition-colors'
                    >
                      Invest
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info */}
      <div className='mt-8 bg-card rounded-2xl p-6 shadow-[0_2px_8px_rgba(43,36,64,0.04)]'>
        <div className='flex items-start gap-3'>
          <Shield className='w-5 h-5 text-mint mt-0.5' />
          <div>
            <h3 className='text-sm font-semibold text-ink mb-1'>Compliance-Ready Investments</h3>
            <p className='text-xs text-ink/50'>
              All pools on Goji are backed by verified payment proofs on Arc. Financial partners manage pools with built-in compliance rules. Contact us for enterprise approval and custom configurations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
