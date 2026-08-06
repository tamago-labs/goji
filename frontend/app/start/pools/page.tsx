'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import { parseUnits, type WalletClient } from 'viem'
import { Loader2, Plus, X } from 'lucide-react'
import { COMPLIANCE_REGISTRY_ADDRESS } from '../../../lib/complianceRegistry'
import {
  ERC20_RECEIVABLE_ABI,
  RECEIVABLE_POOL_ABI,
  RECEIVABLE_POOL_FACTORY_ABI,
  RECEIVABLE_POOL_FACTORY_ADDRESS
} from '../../../lib/receivablePool'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`
const COUNTRIES = [
  ['US', 'United States'],
  ['TH', 'Thailand'],
  ['VN', 'Vietnam'],
  ['SG', 'Singapore'],
  ['JP', 'Japan'],
  ['GB', 'United Kingdom'],
  ['DE', 'Germany']
] as const

function countryCodeToBytes2(code: string): `0x${string}` {
  return `0x${Array.from(code)
    .map((character) => character.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')}`
}

interface PoolApi {
  publicClient: ReturnType<typeof usePublicClient>
  walletClient?: WalletClient
  address?: `0x${string}`
  switchChainAsync?: ReturnType<typeof useSwitchChain>['switchChainAsync']
}

interface PoolSummary {
  address: string
  name: string
  apy: bigint
  term: bigint
  assets: bigint
  depositsOpen: boolean
}

export default function PoolsPage() {
  const { address } = useAccount()
  const publicClient = usePublicClient({ chainId: arcTestnet.id })
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()
  const [pools, setPools] = useState<PoolSummary[]>([])
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('GPOOL')
  const [tier, setTier] = useState('0')
  const [apy, setApy] = useState('')
  const [minimumStake, setMinimumStake] = useState('')
  const [termDays, setTermDays] = useState('')
  const [complianceEnabled, setComplianceEnabled] = useState(false)
  const [allowedCountries, setAllowedCountries] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedPool, setSelectedPool] = useState<PoolSummary | null>(null)

  const load = useCallback(async () => {
    if (!publicClient || !address) return
    const result = await publicClient.readContract({
      address: RECEIVABLE_POOL_FACTORY_ADDRESS,
      abi: RECEIVABLE_POOL_FACTORY_ABI,
      functionName: 'getPoolsByManager',
      args: [address]
    })
    const addresses = result as string[]
    const summaries = await Promise.all(
      addresses.map(async (poolAddress) => {
        const pool = poolAddress as `0x${string}`
        const [poolName, poolApy, poolTerm, assets, depositsOpen] = await Promise.all([
          publicClient.readContract({
            address: pool,
            abi: RECEIVABLE_POOL_ABI,
            functionName: 'name'
          }),
          publicClient.readContract({
            address: pool,
            abi: RECEIVABLE_POOL_ABI,
            functionName: 'targetApyBps'
          }),
          publicClient.readContract({
            address: pool,
            abi: RECEIVABLE_POOL_ABI,
            functionName: 'poolTerm'
          }),
          publicClient.readContract({
            address: pool,
            abi: RECEIVABLE_POOL_ABI,
            functionName: 'totalAssets'
          }),
          publicClient.readContract({
            address: pool,
            abi: RECEIVABLE_POOL_ABI,
            functionName: 'depositsOpen'
          })
        ])
        return {
          address: poolAddress,
          name: String(poolName),
          apy: poolApy as bigint,
          term: poolTerm as bigint,
          assets: assets as bigint,
          depositsOpen: Boolean(depositsOpen)
        }
      })
    )
    setPools(summaries)
  }, [address, publicClient])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load().catch(() => {})
    }, 0)
    return () => window.clearTimeout(handle)
  }, [load])

  async function createPool() {
    if (!walletClient || !publicClient || !address) return
    setBusy(true)
    setMessage('')
    try {
      await ensureArc(walletClient, switchChainAsync)
      const simulation = await publicClient.simulateContract({
        address: RECEIVABLE_POOL_FACTORY_ADDRESS,
        abi: RECEIVABLE_POOL_FACTORY_ABI,
        functionName: 'createPool',
        args: [
          name,
          symbol,
          Number(tier) === 0 ? ZERO_ADDRESS : COMPLIANCE_REGISTRY_ADDRESS,
          complianceEnabled ? Number(tier) : 0,
          complianceEnabled ? allowedCountries.map(countryCodeToBytes2) : []
        ],
        account: address
      })
      const hash = await walletClient.writeContract(simulation.request)
      await publicClient.waitForTransactionReceipt({ hash })
      const createdPool = simulation.result as `0x${string}`
      const policy = await publicClient.simulateContract({
        address: createdPool,
        abi: RECEIVABLE_POOL_ABI,
        functionName: 'setPoolPolicy',
        args: [
          BigInt(Math.floor(Number(apy) * 100)),
          'Managed pool of verified receivable positions.',
          BigInt(Math.floor(Number(minimumStake) * 86400)),
          BigInt(0),
          BigInt(Math.floor(Number(termDays) * 86400))
        ],
        account: address
      })
      const policyHash = await walletClient.writeContract(policy.request)
      await publicClient.waitForTransactionReceipt({ hash: policyHash })
      await load()
      setMessage('Pool created.')
      setShowCreate(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Pool creation failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className='mb-6 flex items-start justify-between gap-4'>
        <div>
          <h2 className='font-display text-xl font-semibold'>Your Pools</h2>
          <p className='mt-1 text-sm text-ink/40'>
            Manage receivable custody, pool terms, and investor funding.
          </p>
        </div>
        <button
          type='button'
          onClick={() => setShowCreate(true)}
          className='inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-medium text-lavender'
        >
          <Plus className='h-3.5 w-3.5' />
          Create Pool
        </button>
      </div>
      <div className='mb-6 grid grid-cols-2 gap-3 md:grid-cols-4'>
        <Summary label='Pools' value={String(pools.length)} />
        <Summary label='Open' value='On-chain' />
        <Summary label='Assets' value='Arc USDC' />
        <Summary label='Mode' value='Managed' />
      </div>
      <div className='space-y-3'>
        {pools.length > 0 && (
          <div className='overflow-hidden rounded-2xl bg-card shadow-[0_4px_20px_rgba(43,36,64,0.05)]'>
            <table className='w-full text-left text-xs'>
              <thead>
                <tr className='border-b border-ink/8 text-[10px] uppercase tracking-wider text-ink/35'>
                  <th className='px-5 py-3'>Pool</th>
                  <th className='px-5 py-3'>APY</th>
                  <th className='px-5 py-3'>Term</th>
                  <th className='px-5 py-3'>Assets</th>
                  <th className='px-5 py-3'>Status</th>
                  <th className='px-5 py-3' />
                </tr>
              </thead>
              <tbody>
                {pools.map((pool) => (
                  <tr key={pool.address} className='border-b border-ink/5 last:border-0'>
                    <td className='px-5 py-4'>
                      <p className='font-medium text-ink/75'>{pool.name}</p>
                      <p className='mt-1 font-mono text-[10px] text-ink/30'>{pool.address}</p>
                    </td>
                    <td className='px-5 py-4 text-ink/60'>{Number(pool.apy) / 100}%</td>
                    <td className='px-5 py-4 text-ink/60'>
                      {pool.term ? `${Number(pool.term) / 86400} days` : 'Not set'}
                    </td>
                    <td className='px-5 py-4 text-ink/60'>{formatAmount(pool.assets)}</td>
                    <td className='px-5 py-4'>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] ${pool.depositsOpen ? 'bg-mint/15 text-[#1B7A50]' : 'bg-ink/10 text-ink/45'}`}
                      >
                        {pool.depositsOpen ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className='px-5 py-4 text-right'>
                      <button
                        type='button'
                        onClick={() => setSelectedPool(pool)}
                        className='rounded-lg bg-ink px-3 py-1.5 text-[10px] font-medium text-lavender'
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pools.length === 0 && (
          <div className='rounded-2xl bg-card p-8 text-center text-sm text-ink/35'>
            No pools created by this wallet yet.
          </div>
        )}
      </div>
      {showCreate && (
        <CreatePoolDrawer
          name={name}
          setName={setName}
          symbol={symbol}
          setSymbol={setSymbol}
          tier={tier}
          setTier={setTier}
          apy={apy}
          setApy={setApy}
          minimumStake={minimumStake}
          setMinimumStake={setMinimumStake}
          termDays={termDays}
          setTermDays={setTermDays}
          complianceEnabled={complianceEnabled}
          setComplianceEnabled={setComplianceEnabled}
          allowedCountries={allowedCountries}
          setAllowedCountries={setAllowedCountries}
          busy={busy}
          message={message}
          onClose={() => setShowCreate(false)}
          onCreate={() => void createPool()}
        />
      )}
      {selectedPool && (
        <div className='fixed inset-0 z-50'>
          <div className='absolute inset-0 bg-black/30' onClick={() => setSelectedPool(null)} />
          <aside className='absolute inset-y-0 right-0 w-full max-w-3xl overflow-y-auto bg-lavender p-6 shadow-2xl'>
            <div className='mb-5 flex items-center justify-between'>
              <div>
                <p className='text-[10px] uppercase tracking-wider text-ink/35'>Pool management</p>
                <h3 className='font-display text-xl font-semibold'>{selectedPool.name}</h3>
              </div>
              <button
                type='button'
                onClick={() => setSelectedPool(null)}
                className='rounded-lg p-2 text-ink/35 hover:bg-ink/5'
              >
                <X className='h-4 w-4' />
              </button>
            </div>
            <PoolManagerCard
              address={selectedPool.address}
              api={{ publicClient, walletClient, address, switchChainAsync }}
              targetApy={String(Number(selectedPool.apy) / 100)}
              minimumStakeDays={minimumStake}
            />
          </aside>
        </div>
      )}
    </div>
  )
}

function PoolManagerCard({
  address,
  api,
  targetApy,
  minimumStakeDays
}: {
  address: string
  api: PoolApi
  targetApy: string
  minimumStakeDays: string
}) {
  const [receivable, setReceivable] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [financeAmount, setFinanceAmount] = useState('')
  const [metadata, setMetadata] = useState('Managed pool of verified receivable positions.')
  const [capacity, setCapacity] = useState('0')
  const [poolTermDays, setPoolTermDays] = useState('')
  const [country, setCountry] = useState('')
  const [countryAllowed, setCountryAllowed] = useState(true)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function transact(
    functionName:
      | 'addReceivable'
      | 'removeReceivable'
      | 'setPoolPolicy'
      | 'setAllowedCountry'
      | 'financeReceivable'
      | 'redeemReceivable'
      | 'closeDeposits'
      | 'openRedemptions',
    args: readonly unknown[] = []
  ) {
    if (!api.publicClient || !api.walletClient || !api.address) return
    setBusy(true)
    setMessage('')
    try {
      await ensureArc(api.walletClient, api.switchChainAsync)
      const simulation = await api.publicClient.simulateContract({
        address: address as `0x${string}`,
        abi: RECEIVABLE_POOL_ABI,
        functionName: functionName as never,
        args: args as never,
        account: api.address
      } as never)
      const hash = await api.walletClient.writeContract(simulation.request as never)
      await api.publicClient.waitForTransactionReceipt({ hash })
      setMessage('Pool updated.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Pool update failed')
    } finally {
      setBusy(false)
    }
  }

  async function custodyReceivable() {
    if (!api.publicClient || !api.walletClient || !api.address || !receivable || !tokenAmount)
      return
    setBusy(true)
    setMessage('')
    try {
      await ensureArc(api.walletClient, api.switchChainAsync)
      const amount = parseUnits(tokenAmount, 6)
      const approval = await api.publicClient.simulateContract({
        address: receivable as `0x${string}`,
        abi: ERC20_RECEIVABLE_ABI,
        functionName: 'approve',
        args: [address as `0x${string}`, amount],
        account: api.address
      })
      const approvalHash = await api.walletClient.writeContract(approval.request)
      await api.publicClient.waitForTransactionReceipt({ hash: approvalHash })
      await transact('addReceivable', [receivable, amount])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not custody receivable')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className='rounded-2xl bg-card p-5 shadow-[0_4px_20px_rgba(43,36,64,0.05)]'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='font-medium'>Verified Receivables Pool</p>
          <p className='mt-1 font-mono text-xs text-ink/35'>{address}</p>
        </div>
        <div className='flex items-center gap-2'>
          <span className='rounded-full bg-violet/10 px-2.5 py-1 text-[10px] text-[#5A4FB8]'>
            Manager
          </span>
          <button
            type='button'
            onClick={() => setExpanded((value) => !value)}
            className='rounded-lg bg-ink px-3 py-1.5 text-[10px] font-medium text-lavender'
          >
            {expanded ? 'Close' : 'Manage'}
          </button>
        </div>
      </div>
      {!expanded ? (
        <div className='mt-4 grid grid-cols-3 gap-3 text-xs'>
          <Summary label='Target APY' value={`${targetApy}%`} />
          <Summary label='Term' value={poolTermDays ? `${poolTermDays} days` : 'Not set'} />
          <Summary label='Status' value='Ready to manage' />
        </div>
      ) : (
        <>
          <div className='mt-4 grid gap-3 md:grid-cols-3'>
            <input
              value={receivable}
              onChange={(event) => setReceivable(event.target.value)}
              placeholder='Receivable token address'
              className='rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs outline-none'
            />
            <input
              value={tokenAmount}
              onChange={(event) => setTokenAmount(event.target.value)}
              placeholder='Token amount'
              type='number'
              className='rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs outline-none'
            />
            <button
              type='button'
              onClick={() => void custodyReceivable()}
              disabled={busy || !receivable || !tokenAmount}
              className='rounded-xl bg-ink px-3 py-2 text-xs text-lavender disabled:opacity-40'
            >
              Custody receivable
            </button>
            <input
              value={financeAmount}
              onChange={(event) => setFinanceAmount(event.target.value)}
              placeholder='Finance amount USDC'
              type='number'
              className='rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs outline-none'
            />
            <button
              type='button'
              onClick={() =>
                void transact('financeReceivable', [
                  receivable,
                  parseUnits(financeAmount || '0', 18)
                ])
              }
              disabled={busy || !receivable || !financeAmount}
              className='rounded-xl bg-ink/5 px-3 py-2 text-xs text-ink/60 disabled:opacity-40'
            >
              Finance from pool cash
            </button>
            <button
              type='button'
              onClick={() => void transact('redeemReceivable', [receivable])}
              disabled={busy || !receivable}
              className='rounded-xl bg-mint/15 px-3 py-2 text-xs text-[#1B7A50] disabled:opacity-40'
            >
              Redeem underlying
            </button>
          </div>
          <div className='mt-3 grid gap-3 md:grid-cols-3'>
            <input
              value={metadata}
              onChange={(event) => setMetadata(event.target.value)}
              placeholder='Pool description'
              className='rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs outline-none md:col-span-2'
            />
            <input
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              placeholder='Capacity USDC (0 = unlimited)'
              type='number'
              className='rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs outline-none'
            />
            <input
              value={poolTermDays}
              onChange={(event) => setPoolTermDays(event.target.value)}
              placeholder='Pool duration days'
              type='number'
              className='rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs outline-none'
            />
            <button
              type='button'
              onClick={() =>
                void transact('setPoolPolicy', [
                  BigInt(Math.floor(Number(targetApy) * 100)),
                  metadata,
                  BigInt(Math.floor(Number(minimumStakeDays) * 86400)),
                  parseUnits(capacity || '0', 18),
                  BigInt(Math.floor(Number(poolTermDays) * 86400))
                ])
              }
              disabled={busy}
              className='rounded-xl bg-ink/5 px-3 py-2 text-xs text-ink/60'
            >
              Save pool terms
            </button>
          </div>
          <div className='mt-3 flex flex-wrap gap-2'>
            <input
              value={country}
              onChange={(event) => setCountry(event.target.value.toUpperCase().slice(0, 2))}
              placeholder='Country ISO2'
              className='w-32 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs outline-none'
            />
            <button
              type='button'
              onClick={() =>
                void transact('setAllowedCountry', [
                  `0x${Array.from(country)
                    .map((character) => character.charCodeAt(0).toString(16).padStart(2, '0'))
                    .join('')}`,
                  countryAllowed
                ])
              }
              disabled={busy || country.length !== 2}
              className='rounded-xl bg-ink/5 px-3 py-2 text-xs text-ink/60'
            >
              {countryAllowed ? 'Allow country' : 'Block country'}
            </button>
            <button
              type='button'
              onClick={() => setCountryAllowed((value) => !value)}
              className='rounded-xl bg-ink/5 px-3 py-2 text-xs text-ink/60'
            >
              Toggle action
            </button>
            <button
              type='button'
              onClick={() => void transact('closeDeposits')}
              disabled={busy}
              className='rounded-xl bg-ink/5 px-3 py-2 text-xs text-ink/60'
            >
              Close deposits
            </button>
            <button
              type='button'
              onClick={() => void transact('openRedemptions')}
              disabled={busy}
              className='rounded-xl bg-mint/15 px-3 py-2 text-xs text-[#1B7A50]'
            >
              Open redemptions
            </button>
          </div>
          {message && <p className='mt-3 text-xs text-ink/55'>{message}</p>}
        </>
      )}
    </section>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-2xl bg-card p-4 shadow-[0_4px_20px_rgba(43,36,64,0.04)]'>
      <p className='text-[10px] text-ink/35'>{label}</p>
      <p className='mt-1 text-sm font-semibold'>{value}</p>
    </div>
  )
}

function CreatePoolDrawer({
  name,
  setName,
  symbol,
  setSymbol,
  tier,
  setTier,
  apy,
  setApy,
  minimumStake,
  setMinimumStake,
  termDays,
  setTermDays,
  complianceEnabled,
  setComplianceEnabled,
  allowedCountries,
  setAllowedCountries,
  busy,
  message,
  onClose,
  onCreate
}: {
  name: string
  setName: (value: string) => void
  symbol: string
  setSymbol: (value: string) => void
  tier: string
  setTier: (value: string) => void
  apy: string
  setApy: (value: string) => void
  minimumStake: string
  setMinimumStake: (value: string) => void
  termDays: string
  setTermDays: (value: string) => void
  complianceEnabled: boolean
  setComplianceEnabled: (value: boolean) => void
  allowedCountries: string[]
  setAllowedCountries: (value: string[]) => void
  busy: boolean
  message: string
  onClose: () => void
  onCreate: () => void
}) {
  return (
    <div className='fixed inset-0 z-50'>
      <div className='absolute inset-0 bg-black/30' onClick={onClose} />
      <aside className='absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-card p-6 shadow-2xl'>
        <div className='mb-8 flex items-start justify-between'>
          <div>
            <p className='text-[10px] uppercase tracking-wider text-ink/35'>Pool setup</p>
            <h3 className='mt-1 font-display text-2xl font-semibold'>Create Pool</h3>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-lg p-2 text-ink/35 hover:bg-ink/5'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
        <div className='space-y-6'>
          <section>
            <h4 className='mb-3 text-xs font-semibold uppercase tracking-wider text-ink/45'>
              Basic information
            </h4>
            <div className='space-y-3'>
              <label className='block text-xs text-ink/50'>
                Pool name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className='mt-1.5 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm text-ink placeholder:text-ink/30 outline-none'
                />
              </label>
              <label className='block text-xs text-ink/50'>
                Target pool duration (days)
                <input
                  value={termDays}
                  onChange={(event) => setTermDays(event.target.value)}
                  type='number'
                  className='mt-1.5 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm text-ink placeholder:text-ink/30 outline-none'
                />
                <span className='mt-1 block text-[10px] text-ink/35'>
                  Expected lifecycle of this pool.
                </span>
              </label>
              <label className='block text-xs text-ink/50'>
                Pool symbol
                <input
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value)}
                  className='mt-1.5 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm text-ink placeholder:text-ink/30 outline-none'
                />
              </label>
            </div>
          </section>
          <section>
            <h4 className='mb-3 text-xs font-semibold uppercase tracking-wider text-ink/45'>
              Investor policy
            </h4>
            <div className='grid grid-cols-2 gap-3'>
              <label className='block text-xs text-ink/50'>
                Target APY (%)
                <input
                  value={apy}
                  onChange={(event) => setApy(event.target.value)}
                  type='number'
                  className='mt-1.5 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm text-ink placeholder:text-ink/30 outline-none'
                />
              </label>
              <label className='block text-xs text-ink/50'>
                Minimum investor lock-up (days)
                <input
                  value={minimumStake}
                  onChange={(event) => setMinimumStake(event.target.value)}
                  type='number'
                  className='mt-1.5 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm text-ink placeholder:text-ink/30 outline-none'
                />
                <span className='mt-1 block text-[10px] text-ink/35'>
                  Earliest time an investor can request redemption.
                </span>
              </label>
            </div>
            <div className='mt-4 rounded-2xl border border-ink/8 bg-ink/[0.02] p-4'>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <p className='text-xs font-medium text-ink/65'>Compliance requirements</p>
                  <p className='mt-1 text-[11px] leading-4 text-ink/40'>
                    Require an approved Identity Pass, tier, and country policy for investors.
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setComplianceEnabled(!complianceEnabled)}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${complianceEnabled ? 'bg-mint' : 'bg-ink/15'}`}
                  aria-pressed={complianceEnabled}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${complianceEnabled ? 'translate-x-4' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
              {complianceEnabled && (
                <div className='mt-4 space-y-3'>
                  <label className='block text-xs text-ink/50'>
                    Minimum identity tier
                    <select
                      value={tier}
                      onChange={(event) => setTier(event.target.value)}
                      className='mt-1.5 w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm text-ink outline-none'
                    >
                      <option value='1'>Tier 1+</option>
                      <option value='2'>Tier 2+</option>
                      <option value='3'>Tier 3+</option>
                    </select>
                  </label>
                  <div>
                    <p className='text-xs text-ink/50'>Allowed countries</p>
                    <div className='mt-2 flex flex-wrap gap-1.5'>
                      {COUNTRIES.map(([code, label]) => (
                        <button
                          type='button'
                          key={code}
                          onClick={() =>
                            setAllowedCountries(
                              allowedCountries.includes(code)
                                ? allowedCountries.filter((item) => item !== code)
                                : [...allowedCountries, code]
                            )
                          }
                          className={`rounded-full px-2.5 py-1 text-[10px] ${allowedCountries.includes(code) ? 'bg-mint/20 text-[#1B7A50]' : 'bg-ink/5 text-ink/45'}`}
                        >
                          {label} ({code})
                        </button>
                      ))}
                    </div>
                    {allowedCountries.length === 0 && (
                      <p className='mt-2 text-[10px] text-coral'>Select at least one country.</p>
                    )}
                  </div>
                  <p className='text-[10px] text-ink/40'>
                    Investors must have an approved Identity Pass at the selected tier and be from
                    an allowed country.
                  </p>
                </div>
              )}
            </div>
          </section>
          <p className='rounded-xl bg-ink/[0.03] p-3 text-xs leading-5 text-ink/45'>
            After creation, open Manage to custody receivable positions, set capacity and term, and
            control deposits and redemptions.
          </p>
        </div>
        {message && <p className='mt-5 rounded-xl bg-ink/5 p-3 text-xs text-ink/55'>{message}</p>}
        <div className='mt-8 flex justify-end gap-2 border-t border-ink/8 pt-5'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-xl px-4 py-2.5 text-xs text-ink/50'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onCreate}
            disabled={
              busy ||
              !name ||
              !symbol ||
              !apy ||
              !minimumStake ||
              !termDays ||
              (complianceEnabled && allowedCountries.length === 0)
            }
            className='inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-medium text-lavender disabled:opacity-40'
          >
            {busy && <Loader2 className='h-3.5 w-3.5 animate-spin' />}Create Pool
          </button>
        </div>
      </aside>
    </div>
  )
}

async function ensureArc(
  walletClient: WalletClient,
  switchChainAsync: PoolApi['switchChainAsync']
) {
  if ((await walletClient.getChainId()) !== arcTestnet.id) {
    if (!switchChainAsync) throw new Error('Wallet cannot switch to Arc Testnet')
    await switchChainAsync({ chainId: arcTestnet.id })
  }
}

function formatAmount(value: bigint) {
  return `${(Number(value) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`
}
