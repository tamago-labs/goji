'use client'

import { useEffect, useState } from 'react'
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import { Loader2, Plus } from 'lucide-react'
import { COMPLIANCE_REGISTRY_ADDRESS } from '../../../lib/complianceRegistry'
import { RECEIVABLE_POOL_ABI, RECEIVABLE_POOL_FACTORY_ABI, RECEIVABLE_POOL_FACTORY_ADDRESS } from '../../../lib/receivablePool'

export default function PoolsPage() {
  const { address } = useAccount()
  const publicClient = usePublicClient({ chainId: arcTestnet.id })
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()
  const [pools, setPools] = useState<string[]>([])
  const [name, setName] = useState('Verified Receivables Pool')
  const [symbol, setSymbol] = useState('GPOOL')
  const [tier, setTier] = useState('1')
  const [apy, setApy] = useState('20')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    if (!publicClient || !address) return
    const result = await publicClient.readContract({ address: RECEIVABLE_POOL_FACTORY_ADDRESS, abi: RECEIVABLE_POOL_FACTORY_ABI, functionName: 'getPoolsByManager', args: [address] })
    setPools(result as string[])
  }
  useEffect(() => { const handle = window.setTimeout(() => { void load().catch(() => {}) }, 0); return () => window.clearTimeout(handle) }, [address, publicClient])

  async function createPool() {
    if (!walletClient || !publicClient || !address) return
    setBusy(true); setMessage('')
    try {
      if (await walletClient.getChainId() !== arcTestnet.id) { if (!switchChainAsync) throw new Error('Wallet cannot switch to Arc Testnet'); await switchChainAsync({ chainId: arcTestnet.id }) }
      const { request } = await publicClient.simulateContract({ address: RECEIVABLE_POOL_FACTORY_ADDRESS, abi: RECEIVABLE_POOL_FACTORY_ABI, functionName: 'createPool', args: [name, symbol, COMPLIANCE_REGISTRY_ADDRESS, Number(tier)], account: address })
      const hash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash })
      await load()
      setMessage('Pool created.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Pool creation failed') } finally { setBusy(false) }
  }

  return <div><div className='mb-6'><h2 className='font-display text-xl font-semibold'>Receivable Pools</h2><p className='mt-1 text-sm text-ink/40'>Create and manage pools for on-chain investors.</p></div><div className='mb-6 rounded-2xl bg-card p-5 shadow-[0_4px_20px_rgba(43,36,64,0.06)]'><h3 className='mb-4 text-sm font-medium'>Create pool</h3><div className='grid grid-cols-1 gap-3 md:grid-cols-4'><input value={name} onChange={(event) => setName(event.target.value)} placeholder='Pool name' className='rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm outline-none' /><input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder='Symbol' className='rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm outline-none' /><select value={tier} onChange={(event) => setTier(event.target.value)} className='rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm outline-none'><option value='0'>Open tier</option><option value='1'>Minimum tier 1</option><option value='2'>Minimum tier 2</option><option value='3'>Minimum tier 3</option></select><input value={apy} onChange={(event) => setApy(event.target.value)} placeholder='Target APY %' type='number' className='rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm outline-none' /></div><button type='button' onClick={() => void createPool()} disabled={busy || !name || !symbol} className='mt-4 flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-medium text-lavender disabled:opacity-40'>{busy ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Plus className='h-3.5 w-3.5' />}Create Pool</button>{message && <p className='mt-3 text-xs text-ink/55'>{message}</p>}</div><div className='space-y-3'>{pools.map((pool) => <PoolManagerCard key={pool} address={pool} api={{ publicClient, walletClient, address, switchChainAsync }} targetApy={apy} />)}{pools.length === 0 && <div className='rounded-2xl bg-card p-8 text-center text-sm text-ink/35'>No pools created by this wallet.</div>}</div></div>
}

function PoolManagerCard({ address, api, targetApy }: { address: string; api: { publicClient: ReturnType<typeof usePublicClient>; walletClient: ReturnType<typeof useWalletClient>['data']; address?: `0x${string}`; switchChainAsync?: ReturnType<typeof useSwitchChain>['switchChainAsync'] }; targetApy: string }) {
  const [receivable, setReceivable] = useState('')
  async function update(fn: string, args: readonly unknown[] = []) {
    if (!api.publicClient || !api.walletClient || !api.address) return
    const { request } = await api.publicClient.simulateContract({ address: address as `0x${string}`, abi: RECEIVABLE_POOL_ABI, functionName: fn as never, args: args as never, account: api.address })
    const hash = await (api.walletClient as any).writeContract(request)
    await api.publicClient.waitForTransactionReceipt({ hash })
  }
  return <div className='rounded-2xl bg-card p-5 shadow-[0_4px_20px_rgba(43,36,64,0.05)]'><p className='font-medium'>Pool {address.slice(0, 10)}</p><p className='mt-1 font-mono text-xs text-ink/35'>{address}</p><p className='mt-2 text-xs text-ink/45'>Target APY: {targetApy}%</p><div className='mt-4 flex flex-wrap gap-2'><input value={receivable} onChange={(event) => setReceivable(event.target.value)} placeholder='Receivable token address' className='min-w-[260px] flex-1 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs outline-none' /><button type='button' onClick={() => void update('addReceivable', [receivable])} className='rounded-xl bg-ink px-3 py-2 text-xs text-lavender'>Add receivable</button><button type='button' onClick={() => void update('closeDeposits')} className='rounded-xl bg-ink/5 px-3 py-2 text-xs text-ink/60'>Close deposits</button><button type='button' onClick={() => void update('openRedemptions')} className='rounded-xl bg-mint/15 px-3 py-2 text-xs text-[#1B7A50]'>Open redemptions</button></div></div>
}
