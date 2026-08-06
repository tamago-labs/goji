'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { COMPLIANCE_REGISTRY_ABI } from '../../../lib/complianceRegistry'
import { IDENTITY_PASS_ABI, IDENTITY_PASS_ADDRESS } from '../../../lib/identityPass'
import { RECEIVABLE_POOL_ABI } from '../../../lib/receivablePool'

const ZERO = '0x0000000000000000000000000000000000000000'

function RwaPoolContent() {
  const params = useSearchParams()
  const poolAddress = params.get('address') as `0x${string}` | null
  const publicClient = usePublicClient({ chainId: arcTestnet.id })
  const { address: walletAddress } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()
  const [pool, setPool] = useState<{
    name: string
    manager: string
    registry: string
    tier: number
    apy: bigint
    assets: bigint
    supply: bigint
    depositsOpen: boolean
    redemptionsOpen: boolean
    minimumStake: bigint
    term: bigint
    metadata: string
  } | null>(null)
  const [balance, setBalance] = useState(BigInt(0))
  const [amountInput, setAmountInput] = useState('')
  const [eligible, setEligible] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!publicClient || !poolAddress) return
    async function load() {
      const [
        name,
        manager,
        registry,
        tier,
        apy,
        assets,
        supply,
        depositsOpen,
        redemptionsOpen,
        minimumStake,
        metadata,
        term
      ] = await Promise.all([
        publicClient!.readContract({
          address: poolAddress!,
          abi: RECEIVABLE_POOL_ABI,
          functionName: 'name'
        }),
        publicClient!.readContract({
          address: poolAddress!,
          abi: RECEIVABLE_POOL_ABI,
          functionName: 'owner'
        }),
        publicClient!.readContract({
          address: poolAddress!,
          abi: RECEIVABLE_POOL_ABI,
          functionName: 'complianceRegistry'
        }),
        publicClient!.readContract({
          address: poolAddress!,
          abi: RECEIVABLE_POOL_ABI,
          functionName: 'requiredComplianceTier'
        }),
        publicClient!.readContract({
          address: poolAddress!,
          abi: RECEIVABLE_POOL_ABI,
          functionName: 'targetApyBps'
        }),
        publicClient!.readContract({
          address: poolAddress!,
          abi: RECEIVABLE_POOL_ABI,
          functionName: 'totalAssets'
        }),
        publicClient!.readContract({
          address: poolAddress!,
          abi: RECEIVABLE_POOL_ABI,
          functionName: 'totalSupply'
        }),
        publicClient!.readContract({
          address: poolAddress!,
          abi: RECEIVABLE_POOL_ABI,
          functionName: 'depositsOpen'
        }),
        publicClient!.readContract({
          address: poolAddress!,
          abi: RECEIVABLE_POOL_ABI,
          functionName: 'redemptionsOpen'
        }),
        publicClient!.readContract({
          address: poolAddress!,
          abi: RECEIVABLE_POOL_ABI,
          functionName: 'minimumStakePeriod'
        }),
        publicClient!.readContract({
          address: poolAddress!,
          abi: RECEIVABLE_POOL_ABI,
          functionName: 'poolMetadata'
        }),
        publicClient!.readContract({
          address: poolAddress!,
          abi: RECEIVABLE_POOL_ABI,
          functionName: 'poolTerm'
        })
      ])
      setPool({
        name: String(name),
        manager: String(manager),
        registry: String(registry),
        tier: Number(tier),
        apy: apy as bigint,
        assets: assets as bigint,
        supply: supply as bigint,
        depositsOpen: Boolean(depositsOpen),
        redemptionsOpen: Boolean(redemptionsOpen),
        minimumStake: minimumStake as bigint,
        term: term as bigint,
        metadata: String(metadata)
      })
      if (walletAddress)
        setBalance(
          (await publicClient!.readContract({
            address: poolAddress!,
            abi: RECEIVABLE_POOL_ABI,
            functionName: 'balanceOf',
            args: [walletAddress]
          })) as bigint
        )
    }
    void load().catch((error) =>
      setMessage(error instanceof Error ? error.message : 'Could not load pool')
    )
  }, [poolAddress, publicClient, walletAddress])

  useEffect(() => {
    if (!pool || !walletAddress || !publicClient || pool.registry === ZERO) {
      const handle = window.setTimeout(() => setEligible(pool?.registry === ZERO ? true : null), 0)
      return () => window.clearTimeout(handle)
    }
    async function check() {
      const valid = await publicClient!.readContract({
        address: IDENTITY_PASS_ADDRESS,
        abi: IDENTITY_PASS_ABI,
        functionName: 'isValid',
        args: [walletAddress!]
      })
      const approved =
        valid &&
        (await publicClient!.readContract({
          address: pool!.registry as `0x${string}`,
          abi: COMPLIANCE_REGISTRY_ABI,
          functionName: 'isEligible',
          args: [walletAddress!, pool!.tier]
        }))
      setEligible(Boolean(approved))
    }
    void check().catch(() => setEligible(false))
  }, [pool, publicClient, walletAddress])

  async function transact(functionName: 'deposit' | 'redeem', value?: bigint) {
    if (!walletClient || !publicClient || !walletAddress || !poolAddress) return
    setBusy(true)
    setMessage('')
    try {
      if ((await walletClient.getChainId()) !== arcTestnet.id && switchChainAsync)
        await switchChainAsync({ chainId: arcTestnet.id })
      const simulation = await publicClient.simulateContract({
        address: poolAddress,
        abi: RECEIVABLE_POOL_ABI,
        functionName: functionName as never,
        ...(value !== undefined ? { value } : { args: [balance] }),
        account: walletAddress
      } as never)
      const hash = await walletClient.writeContract(simulation.request)
      await publicClient.waitForTransactionReceipt({ hash })
      setMessage('Transaction confirmed on Arc Testnet.')
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Transaction failed')
    } finally {
      setBusy(false)
    }
  }

  if (!poolAddress)
    return <main className='p-8 text-center text-sm text-ink/40'>Pool address is missing.</main>
  if (!pool)
    return (
      <main className='flex min-h-[500px] items-center justify-center'>
        <Loader2 className='h-6 w-6 animate-spin text-ink/35' />
      </main>
    )
  const depositValue =
    amountInput && Number(amountInput) > 0
      ? BigInt(Math.floor(Number(amountInput) * 1e18))
      : BigInt(0)
  return (
    <main className='min-h-screen bg-lavender px-6 py-12'>
      <div className='mx-auto max-w-5xl'>
        <Link href='/rwa' className='mb-8 inline-flex items-center gap-2 text-xs text-ink/45'>
          <ArrowLeft className='h-4 w-4' />
          All pools
        </Link>
        <div className='mb-8 flex items-start justify-between gap-4'>
          <div>
            <p className='text-[10px] uppercase tracking-[0.2em] text-ink/35'>
              Verified manager pool
            </p>
            <h1 className='mt-2 font-display text-3xl font-semibold'>{pool.name}</h1>
            <p className='mt-2 font-mono text-xs text-ink/35'>Manager {pool.manager}</p>
          </div>
          <span className='rounded-full bg-mint/15 px-3 py-1 text-xs font-medium text-[#1B7A50]'>
            {pool.depositsOpen ? 'Deposits open' : 'Deposits closed'}
          </span>
        </div>
        <div className='grid gap-3 sm:grid-cols-5'>
          <Stat label='Projected APY' value={`${Number(pool.apy) / 100}%`} />
          <Stat label='Pool assets' value={amount(pool.assets)} />
          <Stat label='Compliance' value={pool.tier ? `Tier ${pool.tier}+` : 'Open'} />
          <Stat label='Term' value={pool.term ? `${Number(pool.term) / 86400} days` : 'Open'} />
          <Stat label='Minimum stake' value={`${Number(pool.minimumStake) / 86400} days`} />
        </div>
        <div className='mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]'>
          <section className='space-y-5'>
            <Panel title='Pool overview'>
              <p className='text-sm leading-6 text-ink/55'>
                {pool.metadata || 'Managed pool of verified company receivable positions.'}
              </p>
            </Panel>
            <Panel title='Investment and redemption'>
              <p className='text-xs text-ink/45'>
                Pool shares represent a pro-rata claim on cash and receivable positions held by the
                pool.
              </p>
              {walletAddress && (
                <div className='mt-4 rounded-2xl bg-ink/[0.03] p-4'>
                  <Stat label='Your pool shares' value={amount(balance)} />
                  {pool.redemptionsOpen && (
                    <button
                      type='button'
                      onClick={() => void transact('redeem')}
                      disabled={busy || balance === BigInt(0)}
                      className='mt-4 w-full rounded-xl bg-mint px-4 py-2.5 text-xs font-medium text-white disabled:opacity-40'
                    >
                      Redeem shares
                    </button>
                  )}
                </div>
              )}
            </Panel>
          </section>
          <aside>
            <Panel title='Invest'>
              <div className='space-y-3'>
                <div
                  className={`rounded-xl p-3 text-xs ${eligible === true ? 'bg-mint/10 text-[#1B7A50]' : 'bg-amber-100 text-amber-700'}`}
                >
                  {pool.registry === ZERO
                    ? 'Open to investors'
                    : eligible
                      ? 'Wallet eligible'
                      : 'Identity approval required'}
                </div>
                <input
                  type='number'
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  placeholder='Amount in USDC'
                  className='w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm outline-none'
                />
                <button
                  type='button'
                  onClick={() => void transact('deposit', depositValue)}
                  disabled={busy || !pool.depositsOpen || !depositValue || eligible === false}
                  className='w-full rounded-xl bg-ink px-4 py-2.5 text-xs font-medium text-lavender disabled:opacity-40'
                >
                  Invest in pool
                </button>
                <p className='text-[10px] text-ink/35'>
                  Deposits and redemptions are settled by smart contract.
                </p>
              </div>
            </Panel>
            {message && (
              <p className='mt-3 rounded-xl bg-ink/5 p-3 text-xs text-ink/55'>{message}</p>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}

export default function RwaPoolPage() {
  return (
    <Suspense
      fallback={
        <main className='flex min-h-screen items-center justify-center bg-lavender'>
          <Loader2 className='h-6 w-6 animate-spin text-ink/35' />
        </main>
      }
    >
      <RwaPoolContent />
    </Suspense>
  )
}

function amount(value: bigint) {
  return `${(Number(value) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='rounded-3xl bg-card p-5 shadow-[0_8px_30px_rgba(43,36,64,0.06)]'>
      <h2 className='mb-4 text-sm font-semibold'>{title}</h2>
      {children}
    </section>
  )
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-2xl bg-card p-4 shadow-[0_5px_20px_rgba(43,36,64,0.04)]'>
      <p className='text-[10px] text-ink/35'>{label}</p>
      <p className='mt-1 text-sm font-semibold'>{value}</p>
    </div>
  )
}
