'use client'

import { useEffect, useState } from 'react'
import { parseUnits, type WalletClient } from 'viem'
import { Loader2 } from 'lucide-react'
import { RECEIVABLE_POOL_ABI, ERC20_RECEIVABLE_ABI } from '../../../lib/receivablePool'
import { useStart } from '../../components/start/StartProvider'

const COUNTRIES = [
  ['US', 'United States'],
  ['TH', 'Thailand'],
  ['VN', 'Vietnam'],
  ['SG', 'Singapore'],
  ['JP', 'Japan'],
  ['GB', 'United Kingdom'],
  ['DE', 'Germany']
] as const

interface PoolApi {
  publicClient: any
  walletClient?: WalletClient
  address?: `0x${string}`
  switchChainAsync?: any
}

async function ensureArc(walletClient: any, switchChainAsync?: any) {
  if (!walletClient) return
  const chainId = await walletClient.getChainId()
  if (chainId !== 5042002 && switchChainAsync) {
    await switchChainAsync({ chainId: 5042002 })
  }
}

interface Props {
  address: string
  api: PoolApi
  targetApy: string
  minimumStakeDays: string
}

export default function PoolManagerCard({ address, api, targetApy, minimumStakeDays }: Props) {
  const { apiUrl } = useStart()
  const [receivable, setReceivable] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [metadata, setMetadata] = useState('Managed pool of verified receivable positions.')
  const [capacity, setCapacity] = useState('0')
  const [poolTermDays, setPoolTermDays] = useState('')
  const [country, setCountry] = useState('')
  const [countryAllowed, setCountryAllowed] = useState(true)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [custodiedReceivables, setCustodiedReceivables] = useState<{ address: string; amount: bigint }[]>([])
  const [loadingReceivables, setLoadingReceivables] = useState(false)
  const [availableReceivables, setAvailableReceivables] = useState<{ tokenAddress: string; name: string; amount: string }[]>([])

  // Fetch available receivables from P2P
  useEffect(() => {
    async function loadAvailable() {
      try {
        const res = await fetch(`${apiUrl}/api/receivables`)
        if (res.ok) {
          const data = await res.json()
          console.log('[PoolManagerCard] Available receivables:', data)
          setAvailableReceivables(data)
        }
      } catch (e) {
        console.error('[PoolManagerCard] Failed to load available receivables:', e)
      }
    }
    loadAvailable()
  }, [apiUrl])
  const [confirmStop, setConfirmStop] = useState(false)

  useEffect(() => {
    if (!api.publicClient || !address) return
    async function load() {
      setLoadingReceivables(true)
      try {
        const [addrs, meta, cap] = await Promise.all([
          api.publicClient!.readContract({ address: address as `0x${string}`, abi: RECEIVABLE_POOL_ABI, functionName: 'getReceivables' }) as Promise<string[]>,
          api.publicClient!.readContract({ address: address as `0x${string}`, abi: RECEIVABLE_POOL_ABI, functionName: 'poolMetadata' }) as Promise<string>,
          api.publicClient!.readContract({ address: address as `0x${string}`, abi: RECEIVABLE_POOL_ABI, functionName: 'poolCapacity' }) as Promise<bigint>
        ])
        setMetadata(String(meta || ''))
        setCapacity(String(Number(cap) / 1e18 || '0'))
        const items = await Promise.all(addrs.map(async (a: string) => {
          const amt = await api.publicClient!.readContract({ address: address as `0x${string}`, abi: RECEIVABLE_POOL_ABI, functionName: 'custodiedAmounts', args: [a] }) as bigint
          return { address: a, amount: amt }
        }))
        setCustodiedReceivables(items)
      } catch (e) { console.error(e) }
      setLoadingReceivables(false)
    }
    load()
  }, [address, api.publicClient])

  async function transact(fn: string, args: readonly unknown[] = []) {
    if (!api.publicClient || !api.walletClient || !api.address) return
    setBusy(true); setMessage('')
    try {
      await ensureArc(api.walletClient, api.switchChainAsync)
      const sim = await api.publicClient.simulateContract({ address: address as `0x${string}`, abi: RECEIVABLE_POOL_ABI, functionName: fn as never, args: args as never, account: api.address } as never)
      const hash = await api.walletClient.writeContract(sim.request as never)
      await api.publicClient.waitForTransactionReceipt({ hash })
      setMessage('Done!')
      // Refresh
      if (fn === 'addReceivable' || fn === 'removeReceivable') {
        const addrs = await api.publicClient!.readContract({ address: address as `0x${string}`, abi: RECEIVABLE_POOL_ABI, functionName: 'getReceivables' }) as string[]
        const items = await Promise.all(addrs.map(async (a: string) => {
          const amt = await api.publicClient!.readContract({ address: address as `0x${string}`, abi: RECEIVABLE_POOL_ABI, functionName: 'custodiedAmounts', args: [a] }) as bigint
          return { address: a, amount: amt }
        }))
        setCustodiedReceivables(items)
      }
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(false) }
  }

  async function custodyReceivable() {
    if (!api.publicClient || !api.walletClient || !api.address || !receivable || !tokenAmount) return
    setBusy(true); setMessage('')
    try {
      await ensureArc(api.walletClient, api.switchChainAsync)
      const amount = parseUnits(tokenAmount, 6)
      const app = await api.publicClient.simulateContract({ address: receivable as `0x${string}`, abi: ERC20_RECEIVABLE_ABI, functionName: 'approve', args: [address as `0x${string}`, amount], account: api.address })
      const h = await api.walletClient.writeContract(app.request)
      await api.publicClient.waitForTransactionReceipt({ hash: h })
      await transact('addReceivable', [receivable, amount])
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(false) }
  }

  const fmt = (a: bigint) => `$${(Number(a) / 1e18).toLocaleString()}`

  return (
    <div className='flex h-full flex-col p-5'>
      {/* Header */}
      <div className='mb-5 flex items-start justify-between'>
        <div>
          <p className='text-[10px] uppercase tracking-wider text-ink/35'>Pool Management</p>
          <h3 className='mt-1 font-display text-lg font-semibold'>Manager</h3>
          <p className='mt-1 font-mono text-[10px] text-ink/40 truncate max-w-[280px]'>{address}</p>
        </div>
      </div>

      {/* Stats */}
      <div className='mb-5 grid grid-cols-3 gap-2'>
        <div className='rounded-xl bg-ink/[0.02] p-2.5 text-center'>
          <div className='text-sm font-semibold text-ink'>{targetApy}%</div>
          <div className='text-[9px] text-ink/40'>APY</div>
        </div>
        <div className='rounded-xl bg-ink/[0.02] p-2.5 text-center'>
          <div className='text-sm font-semibold text-ink'>{poolTermDays || '—'}d</div>
          <div className='text-[9px] text-ink/40'>Term</div>
        </div>
        <div className='rounded-xl bg-ink/[0.02] p-2.5 text-center'>
          <div className='text-sm font-semibold text-ink'>{custodiedReceivables.length}</div>
          <div className='text-[9px] text-ink/40'>Assets</div>
        </div>
      </div>

      {/* Custodied Receivables */}
      <div className='mb-5'>
        <h4 className='mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink/45'>Custodied Receivables</h4>
        {loadingReceivables ? (
          <div className='flex justify-center py-3'><Loader2 className='w-4 h-4 text-ink/40 animate-spin' /></div>
        ) : custodiedReceivables.length === 0 ? (
          <div className='rounded-xl bg-ink/5 p-3 text-center text-[11px] text-ink/40'>No receivables yet</div>
        ) : (
          <div className='space-y-1.5'>
            {custodiedReceivables.map((item) => (
              <div key={item.address} className='flex items-center justify-between rounded-lg bg-ink/5 px-3 py-2'>
                <div className='flex-1 min-w-0'>
                  <p className='text-[10px] font-mono text-ink/60 truncate'>{item.address}</p>
                  <p className='text-[9px] text-ink/40'>{fmt(item.amount)}</p>
                </div>
                <div className='flex gap-1.5'>
                  <button onClick={() => { setReceivable(item.address); setTokenAmount(String(Number(item.amount) / 1e6)) }} className='rounded-md bg-ink/5 px-2 py-1 text-[9px] text-ink/60 hover:bg-ink/10'>Select</button>
                  <button onClick={() => void transact('removeReceivable', [item.address, item.amount])} disabled={busy} className='rounded-md bg-coral/10 px-2 py-1 text-[9px] text-coral'>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Receivable */}
      <div className='mb-5'>
        <h4 className='mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink/45'>Add Receivable</h4>
        <div className='space-y-2'>
          <select
            value={receivable}
            onChange={(e) => {
              setReceivable(e.target.value)
              const selected = availableReceivables.find(r => r.tokenAddress === e.target.value)
              if (selected) setTokenAmount(String(parseFloat(selected.amount)))
            }}
            className='w-full rounded-lg border border-ink/10 bg-ink/5 px-3 py-2 text-[11px] outline-none'
          >
            <option value=''>Select receivable token</option>
            {availableReceivables.map((r) => (
              <option key={r.tokenAddress} value={r.tokenAddress}>
                {r.name} — 1,000,000 GOJ tokens
              </option>
            ))}
          </select>
          <input value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} placeholder='Amount' type='number' className='w-full rounded-lg border border-ink/10 bg-ink/5 px-3 py-2 text-[11px] outline-none' />
          <button onClick={() => void custodyReceivable()} disabled={busy || !receivable || !tokenAmount} className='w-full rounded-lg bg-ink px-3 py-2 text-[11px] text-lavender disabled:opacity-40'>Add to Pool</button>
        </div>
      </div>

      {/* Settings */}
      <div className='mb-5'>
        <h4 className='mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink/45'>Settings</h4>
        <div className='space-y-2'>
          <input value={metadata} onChange={(e) => setMetadata(e.target.value)} placeholder='Description' className='w-full rounded-lg border border-ink/10 bg-ink/5 px-3 py-2 text-[11px] outline-none' />
          <div className='grid grid-cols-2 gap-2'>
            <input value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder='Capacity USDC' type='number' className='rounded-lg border border-ink/10 bg-ink/5 px-3 py-2 text-[11px] outline-none' />
            <input value={poolTermDays} onChange={(e) => setPoolTermDays(e.target.value)} placeholder='Term days' type='number' className='rounded-lg border border-ink/10 bg-ink/5 px-3 py-2 text-[11px] outline-none' />
          </div>
          <button onClick={() => void transact('setPoolPolicy', [BigInt(Math.floor(Number(targetApy) * 100)), metadata, BigInt(Math.floor(Number(minimumStakeDays) * 86400)), parseUnits(capacity || '0', 18), BigInt(Math.floor(Number(poolTermDays) * 86400))])} disabled={busy} className='w-full rounded-lg bg-ink px-3 py-2 text-[11px] text-lavender disabled:opacity-40'>Save</button>
        </div>
      </div>

      {/* Compliance */}
      <div className='mb-5'>
        <h4 className='mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink/45'>Compliance</h4>
        <div className='flex gap-2'>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className='flex-1 rounded-lg border border-ink/10 bg-ink/5 px-3 py-2 text-[11px] outline-none'
          >
            <option value=''>Select country</option>
            {COUNTRIES.map(([code, name]) => (
              <option key={code} value={code}>{name} ({code})</option>
            ))}
          </select>
          <button onClick={() => void transact('setAllowedCountry', [`0x${Array.from(country).map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')}`, countryAllowed])} disabled={busy || country.length !== 2} className='rounded-lg bg-ink px-3 py-2 text-[11px] text-lavender disabled:opacity-40'>{countryAllowed ? 'Allow' : 'Block'}</button>
        </div>
      </div>

      {/* Actions */}
      <div className='mt-auto flex gap-2'>
        {confirmStop ? (
          <div className='flex-1 flex gap-2'>
            <button onClick={() => { setConfirmStop(false); void transact('closeDeposits') }} disabled={busy} className='flex-1 rounded-lg bg-coral/15 px-3 py-2 text-[11px] text-coral font-medium disabled:opacity-40'>Confirm Stop</button>
            <button onClick={() => setConfirmStop(false)} disabled={busy} className='rounded-lg bg-ink/10 px-3 py-2 text-[11px] text-ink/60 hover:bg-ink/20'>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmStop(true)} disabled={busy} className='flex-1 rounded-lg bg-ink px-3 py-2 text-[11px] text-lavender disabled:opacity-40'>Stop Pool</button>
        )}
        <button onClick={() => void transact('openRedemptions')} disabled={busy} className='flex-1 rounded-lg bg-mint/15 px-3 py-2 text-[11px] text-[#1B7A50] disabled:opacity-40'>Open Redemptions</button>
      </div>

      {message && <p className='mt-2 text-center text-[10px] text-ink/55'>{message}</p>}
    </div>
  )
}
