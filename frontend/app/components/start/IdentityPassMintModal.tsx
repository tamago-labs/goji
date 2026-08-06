'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import { IDENTITY_PASS_ABI, IDENTITY_PASS_ADDRESS } from '../../../lib/identityPass'
import type { PassInfo } from './IdentityPassStatus'

export default function IdentityPassMintModal({ open, address, onClose, onMinted }: { open: boolean; address: string; onClose: () => void; onMinted: (pass: PassInfo) => void }) {
  const { address: connectedAddress } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient({ chainId: arcTestnet.id })
  const { switchChainAsync } = useSwitchChain()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function mint() {
    if (!IDENTITY_PASS_ADDRESS || !walletClient || !publicClient || connectedAddress?.toLowerCase() !== address.toLowerCase()) { setError('Connect this wallet before minting its pass.'); return }
    setBusy(true); setError('')
    try {
      if (await walletClient.getChainId() !== arcTestnet.id) {
        if (!switchChainAsync) throw new Error('Wallet cannot switch to Arc Testnet')
        await switchChainAsync({ chainId: arcTestnet.id })
      }
      const hash = await walletClient.writeContract({ address: IDENTITY_PASS_ADDRESS, abi: IDENTITY_PASS_ABI, functionName: 'mint', account: connectedAddress, chain: arcTestnet })
      await publicClient.waitForTransactionReceipt({ hash })
      const [tokenId, passId] = await Promise.all([
        publicClient.readContract({ address: IDENTITY_PASS_ADDRESS, abi: IDENTITY_PASS_ABI, functionName: 'tokenIdOf', args: [address as `0x${string}`] }),
        publicClient.readContract({ address: IDENTITY_PASS_ADDRESS, abi: IDENTITY_PASS_ABI, functionName: 'passIdOf', args: [address as `0x${string}`] })
      ])
      onMinted({ tokenId: String(tokenId), passId: String(passId) })
      onClose()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Minting failed') } finally { setBusy(false) }
  }

  return <AnimatePresence>{open && <><motion.div className='fixed inset-0 z-50 bg-black/30' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} /><motion.div className='fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-card p-6 shadow-xl' initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .96 }}><div className='mb-5 flex items-start justify-between'><div><h3 className='font-display text-lg font-semibold'>Mint Identity Pass</h3><p className='mt-1 text-xs text-ink/40'>One non-transferable pass for this wallet on Arc Testnet.</p></div><button type='button' onClick={onClose}><X className='h-4 w-4 text-ink/35' /></button></div><div className='mb-5 rounded-xl bg-ink/5 p-3 font-mono text-xs text-ink/60'>{address}</div>{error && <p className='mb-4 rounded-xl bg-coral/10 p-3 text-xs text-coral'>{error}</p>}<button type='button' onClick={() => void mint()} disabled={busy} className='flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-medium text-lavender disabled:opacity-40'>{busy && <Loader2 className='h-3.5 w-3.5 animate-spin' />} {busy ? 'Minting...' : 'Mint Identity Pass'}</button></motion.div></>}</AnimatePresence>
}
