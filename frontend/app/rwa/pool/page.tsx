'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAccount, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import { ArrowLeft, ExternalLink, Loader2, Shield, CheckCircle, ShieldAlert } from 'lucide-react'
import { RECEIVABLE_POOL_ABI } from '../../../lib/receivablePool'
import { COMPLIANCE_REGISTRY_ABI } from '../../../lib/complianceRegistry'
import { IDENTITY_PASS_ABI, IDENTITY_PASS_ADDRESS } from '../../../lib/identityPass'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='text-center px-4 py-3 bg-ink/[0.02] rounded-xl'>
      <div className='text-lg font-semibold text-ink'>{value}</div>
      <div className='text-[10px] text-ink/40 uppercase tracking-wider mt-1'>{label}</div>
    </div>
  )
}

export default function PoolDetailPage() {
  const searchParams = useSearchParams()
  const poolAddress = searchParams.get('address') as `0x${string}` | null
  const { address: walletAddress } = useAccount()
  const publicClient = usePublicClient({ chainId: arcTestnet.id })
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()

  const [pool, setPool] = useState<{
    name: string; manager: string; registry: string; tier: number; apy: number;
    assets: bigint; totalSupply: bigint; depositsOpen: boolean; redemptionsOpen: boolean;
    term: number; minimumStake: number; metadata: string; receivables: number;
  } | null>(null)
  const [eligible, setEligible] = useState<boolean | null>(null)
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0))
  const [depositAmount, setDepositAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'invest' | 'redeem'>('invest')

  useEffect(() => {
    if (!publicClient || !poolAddress) { setLoading(false); return }

    async function load() {
      try {
        const [name, manager, registry, tier, apy, assets, totalSupply, depositsOpen, redemptionsOpen, term, minimumStake, metadata, receivables] = await Promise.all([
          publicClient!.readContract({ address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'name' }),
          publicClient!.readContract({ address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'owner' }),
          publicClient!.readContract({ address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'complianceRegistry' }),
          publicClient!.readContract({ address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'requiredComplianceTier' }),
          publicClient!.readContract({ address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'targetApyBps' }),
          publicClient!.readContract({ address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'totalAssets' }),
          publicClient!.readContract({ address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'totalSupply' }),
          publicClient!.readContract({ address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'depositsOpen' }),
          publicClient!.readContract({ address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'redemptionsOpen' }),
          publicClient!.readContract({ address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'poolTerm' }),
          publicClient!.readContract({ address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'minimumStakePeriod' }),
          publicClient!.readContract({ address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'poolMetadata' }),
          publicClient!.readContract({ address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'receivableCount' })
        ])

        setPool({
          name: String(name || 'Unnamed Pool'),
          manager: String(manager),
          registry: String(registry),
          tier: Number(tier),
          apy: Number(apy) / 100,
          assets: assets as bigint,
          totalSupply: totalSupply as bigint,
          depositsOpen: Boolean(depositsOpen),
          redemptionsOpen: Boolean(redemptionsOpen),
          term: Number(term),
          minimumStake: Number(minimumStake),
          metadata: String(metadata || ''),
          receivables: Number(receivables)
        })
      } catch (e) {
        console.error('Failed to load pool:', e)
      }
      setLoading(false)
    }

    load()
  }, [publicClient, poolAddress])

  useEffect(() => {
    if (!publicClient || !poolAddress || !walletAddress || !pool) return

    async function loadUserData() {
      try {
        const balance = await publicClient!.readContract({
          address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'balanceOf', args: [walletAddress!]
        }) as bigint
        setUserBalance(balance)

        if (pool.registry !== '0x0000000000000000000000000000000000000000') {
          const validPass = await publicClient!.readContract({
            address: IDENTITY_PASS_ADDRESS, abi: IDENTITY_PASS_ABI, functionName: 'isValid', args: [walletAddress!]
          }) as boolean
          if (!validPass) { setEligible(false); return }
          const country = await publicClient!.readContract({
            address: pool.registry as `0x${string}`, abi: COMPLIANCE_REGISTRY_ABI, functionName: 'countryOf', args: [walletAddress!]
          }) as `0x${string}`
          const approved = await publicClient!.readContract({
            address: pool.registry as `0x${string}`, abi: COMPLIANCE_REGISTRY_ABI, functionName: 'isEligibleForCountry', args: [walletAddress!, pool.tier, country]
          }) as boolean
          setEligible(approved)
        } else {
          setEligible(true)
        }
      } catch {
        setEligible(false)
      }
    }

    loadUserData()
  }, [publicClient, poolAddress, walletAddress, pool])

  const formatAmount = (amount: bigint) => `$${(Number(amount) / 1e18).toLocaleString()}`

  const handleInvest = async () => {
    if (!walletClient || !publicClient || !walletAddress || !pool || !depositAmount) return
    setBusy(true); setMessage('')
    try {
      if ((await walletClient.getChainId()) !== arcTestnet.id) {
        if (!switchChainAsync) throw new Error('Cannot switch chain')
        await switchChainAsync({ chainId: arcTestnet.id })
      }
      const hash = await walletClient.writeContract({
        address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'deposit',
        value: BigInt(Math.floor(Number(depositAmount) * 1e18)), chain: arcTestnet, account: walletAddress
      })
      await publicClient!.waitForTransactionReceipt({ hash })
      setMessage('Deposit confirmed!')
      window.location.reload()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Deposit failed')
    } finally { setBusy(false) }
  }

  const handleRedeem = async () => {
    if (!walletClient || !publicClient || !walletAddress || !pool) return
    setBusy(true); setMessage('')
    try {
      if ((await walletClient.getChainId()) !== arcTestnet.id) {
        if (!switchChainAsync) throw new Error('Cannot switch chain')
        await switchChainAsync({ chainId: arcTestnet.id })
      }
      const hash = await walletClient.writeContract({
        address: poolAddress!, abi: RECEIVABLE_POOL_ABI, functionName: 'redeem',
        args: [userBalance], chain: arcTestnet, account: walletAddress
      })
      await publicClient!.waitForTransactionReceipt({ hash })
      setMessage('Redemption confirmed!')
      window.location.reload()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Redemption failed')
    } finally { setBusy(false) }
  }

  if (loading) {
    return <div className='flex items-center justify-center min-h-[400px]'><Loader2 className='w-6 h-6 text-ink/40 animate-spin' /></div>
  }

  if (!pool) {
    return <div className='text-center py-12'><p className='text-ink/40'>Pool not found</p><Link href='/rwa' className='text-sm text-mint'>Back to pools</Link></div>
  }

  return (
    <div className='max-w-5xl'>
      {/* Back link */}
      <Link href='/rwa' className='mb-6 inline-flex items-center gap-2 text-xs text-ink/45 hover:text-ink'>
        <ArrowLeft className='h-3.5 w-3.5' /> All pools
      </Link>

      {/* Header */}
      <div className='flex items-start justify-between mb-6'>
        <div>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>Verified manager pool</span>
          </div>
          <h1 className='font-display text-3xl font-semibold'>{pool.name}</h1>
          <p className='mt-1 font-mono text-xs text-ink/40'>{poolAddress}</p>
        </div>
        <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${pool.depositsOpen ? 'bg-mint/15 text-[#1B7A50]' : 'bg-ink/10 text-ink/45'}`}>
          {pool.depositsOpen ? 'Deposits Open' : 'Deposits Closed'}
        </span>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-5 gap-3 mb-8'>
        <Stat label='Projected APY' value={`${pool.apy}%`} />
        <Stat label='Pool Assets' value={formatAmount(pool.assets)} />
        <Stat label='Compliance' value={pool.tier ? `Tier ${pool.tier}+` : 'Open'} />
        <Stat label='Term' value={pool.term ? `${Math.floor(pool.term / 86400)} days` : 'Open'} />
        <Stat label='Receivables' value={String(pool.receivables)} />
      </div>

      {/* Two Column Layout */}
      <div className='grid grid-cols-2 gap-6'>
        {/* Left Column */}
        <div className='space-y-6'>
          {/* Pool Overview */}
          <div className='bg-card rounded-2xl shadow-[0_2px_8px_rgba(43,36,64,0.04)] p-6'>
            <h3 className='text-sm font-semibold text-ink mb-3'>Pool Overview</h3>
            <p className='text-sm text-ink/60 mb-4'>
              {pool.metadata || 'This pool aggregates verified receivable assets from compliant businesses. Investors deposit USDC and receive pool shares proportional to their investment.'}
            </p>
            <div className='grid grid-cols-2 gap-3 text-xs text-ink/50'>
              <div>Manager: <span className='font-mono text-ink/60'>{pool.manager.slice(0, 10)}...</span></div>
              <div>Receivables: {pool.receivables}</div>
            </div>
          </div>

          {/* Compliance */}
          <div className='bg-card rounded-2xl shadow-[0_2px_8px_rgba(43,36,64,0.04)] p-6'>
            <h3 className='text-sm font-semibold text-ink mb-3'>Compliance Requirements</h3>
            {pool.registry !== '0x0000000000000000000000000000000000000000' ? (
              <div className='space-y-2 text-xs text-ink/60'>
                <div className='flex items-center gap-2'>
                  <Shield className='w-4 h-4 text-mint' />
                  <span>Identity Pass required</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='w-4 h-4 text-mint' />
                  <span>Tier {pool.tier}+ compliance needed</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='w-4 h-4 text-mint' />
                  <span>Country allowlist enforced</span>
                </div>
              </div>
            ) : (
              <p className='text-xs text-ink/50'>Open pool — no compliance required.</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className='space-y-6'>
          {/* Invest / Redeem Tabs */}
          <div className='bg-card rounded-2xl shadow-[0_2px_8px_rgba(43,36,64,0.04)] p-6'>
            <div className='flex gap-1 mb-4 bg-ink/5 rounded-lg p-1'>
              <button onClick={() => setActiveTab('invest')} className={`flex-1 py-2 text-sm font-medium rounded-md ${activeTab === 'invest' ? 'bg-card shadow-sm text-ink' : 'text-ink/50 hover:text-ink/70'}`}>Invest</button>
              <button onClick={() => setActiveTab('redeem')} className={`flex-1 py-2 text-sm font-medium rounded-md ${activeTab === 'redeem' ? 'bg-card shadow-sm text-ink' : 'text-ink/50 hover:text-ink/70'}`}>Redeem</button>
            </div>

            {!walletAddress ? (
              <div className='text-center py-6'>
                <p className='text-sm text-ink/50'>Connect your wallet to invest in this pool.</p>
              </div>
            ) : eligible === false ? (
              <div className='bg-amber-50 rounded-xl p-4 flex items-center gap-3 mb-4'>
                <ShieldAlert className='w-5 h-5 text-amber-600' />
                <div>
                  <p className='text-sm font-medium text-amber-700'>Not eligible</p>
                  <p className='text-xs text-amber-600'>Identity Pass and compliance approval required.</p>
                </div>
              </div>
            ) : activeTab === 'invest' ? (
              <>
                {pool.registry !== '0x0000000000000000000000000000000000000000' && eligible && (
                  <div className='bg-mint/5 rounded-xl p-3 flex items-center gap-2 mb-4 text-xs text-[#1B7A50]'>
                    <CheckCircle className='w-4 h-4' /> Wallet eligible for this pool
                  </div>
                )}
                {pool.minimumStake > 0 && (
                  <div className='mb-4 rounded-xl bg-ink/[0.02] p-3 text-xs text-ink/50'>
                    Minimum stake period: {Math.floor(pool.minimumStake / 86400)} days
                  </div>
                )}
                <div className='mb-4'>
                  <label className='block text-xs text-ink/40 mb-1.5'>Amount (USDC)</label>
                  <input
                    type='number'
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder='1000'
                    className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink-200'
                  />
                </div>
                {depositAmount && parseFloat(depositAmount) > 0 && (
                  <div className='bg-ink/[0.02] rounded-xl p-3 mb-4 text-xs space-y-1'>
                    <div className='flex justify-between'>
                      <span className='text-ink/40'>You invest</span>
                      <span className='text-ink/60'>{depositAmount} USDC</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-ink/40'>Pool shares</span>
                      <span className='text-ink/60'>
                        {pool.totalSupply > BigInt(0) ? ((parseFloat(depositAmount) * 1e18 * Number(pool.totalSupply)) / Number(pool.assets)).toLocaleString() : '—'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-ink/40'>Ownership</span>
                      <span className='text-ink/60'>
                        {pool.assets > BigInt(0) ? ((parseFloat(depositAmount) * 100e18) / Number(pool.assets)).toFixed(2) : '0'}%
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleInvest}
                  disabled={busy || !pool.depositsOpen || eligible === false || !depositAmount}
                  className='w-full px-4 py-2.5 bg-mint text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-30 transition-opacity'
                >
                  {busy ? <Loader2 className='w-4 h-4 animate-spin mx-auto' /> : 'Invest Now'}
                </button>
                {message && <p className='mt-3 text-xs text-ink/50'>{message}</p>}
              </>
            ) : (
              <>
                {userBalance > BigInt(0) ? (
                  <>
                    <div className='mb-4 space-y-2 text-xs'>
                      <div className='flex justify-between'>
                        <span className='text-ink/40'>Your shares</span>
                        <span className='text-ink font-medium'>{(Number(userBalance) / 1e18).toLocaleString()}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-ink/40'>Value</span>
                        <span className='text-ink font-medium'>
                          {pool.totalSupply > BigInt(0) ? formatAmount((userBalance * pool.assets) / pool.totalSupply) : '—'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleRedeem}
                      disabled={busy || !pool.redemptionsOpen}
                      className='w-full px-4 py-2.5 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-30 transition-opacity'
                    >
                      {busy ? <Loader2 className='w-4 h-4 animate-spin mx-auto' /> : 'Redeem All'}
                    </button>
                    {!pool.redemptionsOpen && <p className='mt-2 text-xs text-ink/40'>Redemptions are not currently open.</p>}
                  </>
                ) : (
                  <p className='text-sm text-ink/40 text-center py-4'>You have no shares in this pool.</p>
                )}
                {message && <p className='mt-3 text-xs text-ink/50'>{message}</p>}
              </>
            )}
          </div>

          {/* Your Position */}
          {walletAddress && userBalance > BigInt(0) && (
            <div className='bg-card rounded-2xl shadow-[0_2px_8px_rgba(43,36,64,0.04)] p-6'>
              <h3 className='text-sm font-semibold text-ink mb-3'>Your Position</h3>
              <div className='space-y-2'>
                <div className='flex justify-between text-xs'>
                  <span className='text-ink/40'>Balance</span>
                  <span className='text-ink font-medium'>{(Number(userBalance) / 1e18).toLocaleString()} shares</span>
                </div>
                <div className='flex justify-between text-xs'>
                  <span className='text-ink/40'>Value</span>
                  <span className='text-ink font-medium'>
                    {pool.totalSupply > BigInt(0) ? formatAmount((userBalance * pool.assets) / pool.totalSupply) : '—'}
                  </span>
                </div>
                <div className='flex justify-between text-xs'>
                  <span className='text-ink/40'>Ownership</span>
                  <span className='text-ink font-medium'>
                    {pool.totalSupply > BigInt(0) ? ((Number(userBalance) * 100) / Number(pool.totalSupply)).toFixed(2) : '0'}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
