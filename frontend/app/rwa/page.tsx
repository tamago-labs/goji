'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import { Layers3, Loader2 } from 'lucide-react'
import {
  RECEIVABLE_POOL_ABI,
  RECEIVABLE_POOL_FACTORY_ABI,
  RECEIVABLE_POOL_FACTORY_ADDRESS
} from '../../lib/receivablePool'

interface PoolSummary {
  address: string
  name: string
  manager: string
  apy: bigint
  tier: number
  depositsOpen: boolean
  assets: bigint
  supply: bigint
  receivables: bigint
  term: bigint
}

export default function RwaExplorerPage() {
  const publicClient = usePublicClient({ chainId: arcTestnet.id })
  const [pools, setPools] = useState<PoolSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!publicClient) return
    async function load() {
      try {
        const addresses = (await publicClient!.readContract({
          address: RECEIVABLE_POOL_FACTORY_ADDRESS,
          abi: RECEIVABLE_POOL_FACTORY_ABI,
          functionName: 'getPools'
        })) as string[]
        const summaries = await Promise.all(
          addresses.map(async (address) => {
            const pool = address as `0x${string}`
            const [name, manager, apy, tier, depositsOpen, assets, supply, receivables, term] =
              await Promise.all([
                publicClient!.readContract({
                  address: pool,
                  abi: RECEIVABLE_POOL_ABI,
                  functionName: 'name'
                }),
                publicClient!.readContract({
                  address: pool,
                  abi: RECEIVABLE_POOL_ABI,
                  functionName: 'owner'
                }),
                publicClient!.readContract({
                  address: pool,
                  abi: RECEIVABLE_POOL_ABI,
                  functionName: 'targetApyBps'
                }),
                publicClient!.readContract({
                  address: pool,
                  abi: RECEIVABLE_POOL_ABI,
                  functionName: 'requiredComplianceTier'
                }),
                publicClient!.readContract({
                  address: pool,
                  abi: RECEIVABLE_POOL_ABI,
                  functionName: 'depositsOpen'
                }),
                publicClient!.readContract({
                  address: pool,
                  abi: RECEIVABLE_POOL_ABI,
                  functionName: 'totalAssets'
                }),
                publicClient!.readContract({
                  address: pool,
                  abi: RECEIVABLE_POOL_ABI,
                  functionName: 'totalSupply'
                }),
                publicClient!.readContract({
                  address: pool,
                  abi: RECEIVABLE_POOL_ABI,
                  functionName: 'receivableCount'
                }),
                publicClient!.readContract({
                  address: pool,
                  abi: RECEIVABLE_POOL_ABI,
                  functionName: 'poolTerm'
                })
              ])
            return {
              address,
              name: String(name),
              manager: String(manager),
              apy: apy as bigint,
              tier: Number(tier),
              depositsOpen: Boolean(depositsOpen),
              assets: assets as bigint,
              supply: supply as bigint,
              receivables: receivables as bigint,
              term: term as bigint
            }
          })
        )
        setPools(summaries)
      } catch (error) {
        console.error('Failed to load RWA pools:', error)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [publicClient])

  return (
    <main className='min-h-screen bg-lavender px-6 py-12'>
      <div className='mx-auto max-w-6xl'>
        <div className='mb-10'>
          <p className='text-[10px] uppercase tracking-[0.2em] text-ink/35'>Goji RWA Explorer</p>
          <h1 className='mt-2 font-display text-4xl font-semibold'>
            Invest in verified receivable pools
          </h1>
          <p className='mt-3 max-w-2xl text-sm text-ink/45'>
            Browse pools managed by verified financial partners. Pool investments and redemptions
            are settled on Arc Testnet.
          </p>
        </div>
        {loading ? (
          <div className='flex justify-center py-20'>
            <Loader2 className='h-6 w-6 animate-spin text-ink/35' />
          </div>
        ) : pools.length === 0 ? (
          <div className='rounded-3xl bg-card p-12 text-center'>
            <Layers3 className='mx-auto h-8 w-8 text-ink/20' />
            <p className='mt-3 text-sm text-ink/45'>No pools are available yet.</p>
          </div>
        ) : (
          <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
            {pools.map((pool) => (
              <Link
                key={pool.address}
                href={`/rwa/pool?address=${pool.address}`}
                className='rounded-3xl bg-card p-5 shadow-[0_8px_30px_rgba(43,36,64,0.06)] transition-transform hover:-translate-y-0.5'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='text-[10px] uppercase tracking-wider text-ink/35'>
                      Verified manager pool
                    </p>
                    <h2 className='mt-1 text-lg font-semibold'>{pool.name}</h2>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${pool.depositsOpen ? 'bg-mint/15 text-[#1B7A50]' : 'bg-ink/10 text-ink/45'}`}
                  >
                    {pool.depositsOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className='mt-6 grid grid-cols-2 gap-3'>
                  <Stat label='Projected APY' value={`${Number(pool.apy) / 100}%`} />
                  <Stat label='Compliance' value={pool.tier ? `Tier ${pool.tier}+` : 'Open'} />
                  <Stat label='Pool assets' value={amount(pool.assets)} />
                  <Stat
                    label='Term'
                    value={pool.term ? `${Number(pool.term) / 86400} days` : 'Open'}
                  />
                  <Stat label='Receivables' value={String(pool.receivables)} />
                </div>
                <p className='mt-5 font-mono text-[10px] text-ink/30'>{pool.address}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function amount(value: bigint) {
  return `${(Number(value) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-2xl bg-ink/[0.03] p-3'>
      <p className='text-[10px] text-ink/35'>{label}</p>
      <p className='mt-1 text-sm font-semibold'>{value}</p>
    </div>
  )
}
