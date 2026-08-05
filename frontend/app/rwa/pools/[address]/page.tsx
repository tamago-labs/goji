'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import { ArrowLeft, CheckCircle, Loader2, ShieldAlert } from 'lucide-react'
import { RECEIVABLE_POOL_ABI } from '../../../../lib/receivablePool'
import { COMPLIANCE_REGISTRY_ABI } from '../../../../lib/complianceRegistry'
import { IDENTITY_PASS_ABI, IDENTITY_PASS_ADDRESS } from '../../../../lib/identityPass'

interface PoolState {
  name: string
  address: string
  owner: string
  registry: string
  tier: number
  apy: number
  depositsOpen: boolean
  redemptionsOpen: boolean
}

export default function PoolDetailPage({ params }: { params: Promise<{ address: string }> }) {
  const [address, setAddress] = useState<string | null>(null)
  const [pool, setPool] = useState<PoolState | null>(null)
  const [eligible, setEligible] = useState<boolean | null>(null)
  const [deposit, setDeposit] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const { address: walletAddress } = useAccount()
  const publicClient = usePublicClient({ chainId: arcTestnet.id })
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()

  useEffect(() => { void params.then((value) => setAddress(value.address)) }, [params])

  useEffect(() => {
    if (!address || !publicClient) return
    async function load() {
      const poolAddress = address as `0x${string}`
      const [name, owner, registry, tier, apy, depositsOpen, redemptionsOpen] = await Promise.all([
        publicClient!.readContract({ address: poolAddress, abi: RECEIVABLE_POOL_ABI, functionName: 'name' }),
        publicClient!.readContract({ address: poolAddress, abi: RECEIVABLE_POOL_ABI, functionName: 'owner' }),
        publicClient!.readContract({ address: poolAddress, abi: RECEIVABLE_POOL_ABI, functionName: 'complianceRegistry' }),
        publicClient!.readContract({ address: poolAddress, abi: RECEIVABLE_POOL_ABI, functionName: 'requiredComplianceTier' }),
        publicClient!.readContract({ address: poolAddress, abi: RECEIVABLE_POOL_ABI, functionName: 'targetApyBps' }),
        publicClient!.readContract({ address: poolAddress, abi: RECEIVABLE_POOL_ABI, functionName: 'depositsOpen' }),
        publicClient!.readContract({ address: poolAddress, abi: RECEIVABLE_POOL_ABI, functionName: 'redemptionsOpen' })
      ])
      setPool({ name: String(name), address, owner: String(owner), registry: String(registry), tier: Number(tier), apy: Number(apy) / 100, depositsOpen: Boolean(depositsOpen), redemptionsOpen: Boolean(redemptionsOpen) })
    }
    void load().catch((error) => setMessage(error instanceof Error ? error.message : 'Could not load pool'))
  }, [address, publicClient])

  useEffect(() => {
    if (!pool || !walletAddress || !publicClient || !IDENTITY_PASS_ADDRESS) return
    async function checkEligibility() {
      if (pool!.registry === '0x0000000000000000000000000000000000000000') { setEligible(true); return }
      const validPass = await publicClient!.readContract({ address: IDENTITY_PASS_ADDRESS, abi: IDENTITY_PASS_ABI, functionName: 'isValid', args: [walletAddress as `0x${string}`] })
      if (!validPass) { setEligible(false); return }
      const country = await publicClient!.readContract({ address: pool!.registry as `0x${string}`, abi: COMPLIANCE_REGISTRY_ABI, functionName: 'countryOf', args: [walletAddress as `0x${string}`] })
      const countryAllowed = await publicClient!.readContract({ address: pool!.address as `0x${string}`, abi: RECEIVABLE_POOL_ABI, functionName: 'allowedCountries', args: [country as `0x${string}`] })
      const approved = await publicClient!.readContract({ address: pool!.registry as `0x${string}`, abi: COMPLIANCE_REGISTRY_ABI, functionName: 'isEligibleForCountry', args: [walletAddress as `0x${string}`, pool!.tier, country as `0x${string}`] })
      setEligible(Boolean(countryAllowed && approved))
    }
    void checkEligibility().catch(() => setEligible(false))
  }, [pool, publicClient, walletAddress])

  async function invest() {
    if (!pool || !walletClient || !publicClient || !walletAddress || !deposit) return
    setBusy(true); setMessage('')
    try {
      if (await walletClient.getChainId() !== arcTestnet.id) {
        if (!switchChainAsync) throw new Error('Wallet cannot switch to Arc Testnet')
        await switchChainAsync({ chainId: arcTestnet.id })
      }
      const hash = await walletClient.writeContract({ address: pool.address as `0x${string}`, abi: RECEIVABLE_POOL_ABI, functionName: 'deposit', value: BigInt(Math.floor(Number(deposit) * 1e18)), chain: arcTestnet, account: walletAddress })
      await publicClient.waitForTransactionReceipt({ hash })
      setDeposit('')
      setMessage('Deposit confirmed. Your pool shares are now on-chain.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Deposit failed') } finally { setBusy(false) }
  }

  return <div className='max-w-3xl'><Link href='/rwa' className='mb-6 inline-flex items-center gap-2 text-xs text-ink/45 hover:text-ink'><ArrowLeft className='h-3.5 w-3.5' />Back to RWA Explorer</Link>{pool ? <><div className='mb-6'><p className='text-[10px] uppercase tracking-wider text-ink/35'>Receivable pool</p><h1 className='font-display text-3xl font-semibold'>{pool.name}</h1><p className='mt-1 font-mono text-xs text-ink/40'>{pool.address}</p></div><div className='grid grid-cols-2 gap-3 md:grid-cols-4'><Stat label='Target APY' value={`${pool.apy}%`} /><Stat label='Required tier' value={pool.tier ? `Tier ${pool.tier}` : 'Open'} /><Stat label='Deposits' value={pool.depositsOpen ? 'Open' : 'Closed'} /><Stat label='Redemptions' value={pool.redemptionsOpen ? 'Open' : 'Pending'} /></div><div className='mt-5 rounded-2xl bg-card p-6'>{pool.registry === '0x0000000000000000000000000000000000000000' ? <p className='mb-5 text-xs text-ink/40'>This pool does not require identity eligibility.</p> : <div className={`mb-5 flex items-center gap-3 rounded-xl p-4 ${eligible ? 'bg-mint/10 text-[#1B7A50]' : 'bg-amber-100 text-amber-700'}`}>{eligible ? <CheckCircle className='h-5 w-5' /> : <ShieldAlert className='h-5 w-5' />}<div><p className='text-sm font-medium'>{eligible ? 'Wallet eligible' : 'Wallet not eligible'}</p><p className='text-xs opacity-75'>{eligible ? 'Identity Pass, approval, tier, and country policy passed.' : 'An approved Identity Pass and allowed country are required.'}</p></div></div>}<div className='flex gap-2'><input type='number' value={deposit} onChange={(event) => setDeposit(event.target.value)} placeholder='Deposit USDC' className='min-w-0 flex-1 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm outline-none' /><button type='button' onClick={() => void invest()} disabled={busy || !pool.depositsOpen || eligible === false || !walletAddress || !deposit} className='flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-medium text-lavender disabled:opacity-40'>{busy && <Loader2 className='h-3.5 w-3.5 animate-spin' />}Invest</button></div>{message && <p className='mt-3 text-xs text-ink/55'>{message}</p>}</div></> : <div className='p-10 text-center text-sm text-ink/40'>Loading pool...</div>}</div>
}

function Stat({ label, value }: { label: string; value: string }) { return <div className='rounded-2xl bg-card p-4'><p className='text-[10px] text-ink/35'>{label}</p><p className='mt-1 text-lg font-semibold'>{value}</p></div> }
