'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useAccount, usePublicClient } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import { IDENTITY_PASS_ABI, IDENTITY_PASS_ADDRESS } from '../../../lib/identityPass'

export interface PassInfo { tokenId: string; passId: string }

export default function IdentityPassStatus({ address, onMint, onReady }: { address: string; onMint: () => void; onReady?: (pass: PassInfo) => void }) {
  const publicClient = usePublicClient({ chainId: arcTestnet.id })
  const { address: connectedAddress } = useAccount()
  const [pass, setPass] = useState<PassInfo | null>(null)
  const [status, setStatus] = useState<'loading' | 'missing' | 'ready' | 'unavailable'>('loading')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!IDENTITY_PASS_ADDRESS || !publicClient) { setStatus('unavailable'); return }
      try {
        const hasPass = await publicClient.readContract({ address: IDENTITY_PASS_ADDRESS, abi: IDENTITY_PASS_ABI, functionName: 'hasPass', args: [address as `0x${string}`] })
        if (!hasPass) { if (!cancelled) setStatus('missing'); return }
        const [tokenId, passId] = await Promise.all([
          publicClient.readContract({ address: IDENTITY_PASS_ADDRESS, abi: IDENTITY_PASS_ABI, functionName: 'tokenIdOf', args: [address as `0x${string}`] }),
          publicClient.readContract({ address: IDENTITY_PASS_ADDRESS, abi: IDENTITY_PASS_ABI, functionName: 'passIdOf', args: [address as `0x${string}`] })
        ])
        if (!cancelled) { const nextPass = { tokenId: String(tokenId), passId: String(passId) }; setPass(nextPass); onReady?.(nextPass); setStatus('ready') }
      } catch { if (!cancelled) setStatus('unavailable') }
    }
    void load()
    return () => { cancelled = true }
  }, [address, onReady, publicClient])

  if (status === 'loading') return <span className='text-[10px] text-ink/30'>Checking...</span>
  if (status === 'unavailable') return <span className='text-[10px] text-ink/30'>Unavailable</span>
  if (status === 'missing') return <button type='button' onClick={onMint} disabled={connectedAddress?.toLowerCase() !== address.toLowerCase()} className='rounded-lg bg-amber-100 px-2.5 py-1.5 text-[11px] font-medium text-amber-700 disabled:cursor-not-allowed disabled:opacity-40'>Mint Pass</button>
  return <span title={`${pass?.passId} · Token ${pass?.tokenId}`} className='inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-1 text-[10px] font-medium text-[#1B7A50]'><ShieldCheck className='h-3 w-3' />Minted</span>
}
