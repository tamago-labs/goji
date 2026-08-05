'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import type { PassInfo } from './IdentityPassStatus'

interface WalletData { id: string; address: string; name: string | null }
interface IdentityRecord { id: string; walletId: string; tokenId: string; passId: string; status: string; identityData?: { fullName?: string; idType?: string; idNumber?: string; validUntil?: string; issuingCountryISO2?: string }[]; bankAccountData?: { bankCountry?: string; bankName?: string; bankAccount?: string; currency?: string }[] }
const COUNTRIES = [
  ['US', 'United States'], ['GB', 'United Kingdom'], ['CA', 'Canada'], ['MX', 'Mexico'], ['BR', 'Brazil'],
  ['DE', 'Germany'], ['FR', 'France'], ['ES', 'Spain'], ['IT', 'Italy'], ['NL', 'Netherlands'], ['CH', 'Switzerland'],
  ['SE', 'Sweden'], ['NO', 'Norway'], ['AU', 'Australia'], ['NZ', 'New Zealand'], ['JP', 'Japan'], ['SG', 'Singapore'],
  ['TH', 'Thailand'], ['VN', 'Vietnam'], ['IN', 'India'], ['KR', 'South Korea'], ['AE', 'United Arab Emirates']
] as const

export default function IdentityDataDrawer({ open, apiUrl, wallet, pass, existing, onClose, onSaved }: { open: boolean; apiUrl: string; wallet: WalletData | null; pass: PassInfo | null; existing: IdentityRecord | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ fullName: '', idType: 'PASSPORT', idNumber: '', validUntil: '', country: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const identity = existing?.identityData?.[0]
    const handle = window.setTimeout(() => setForm({ fullName: identity?.fullName || '', idType: identity?.idType || 'PASSPORT', idNumber: identity?.idNumber || '', validUntil: identity?.validUntil || '', country: identity?.issuingCountryISO2 || '' }), 0)
    return () => window.clearTimeout(handle)
  }, [existing, open])
  if (!wallet || !pass) return null
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const field = (key: keyof typeof form, label: string, type = 'text') => <label className='block text-xs text-ink/45'>{label}<input type={type} value={form[key]} onChange={(event) => set(key, event.target.value)} className='mt-1.5 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm outline-none' /></label>
  const countryField = (key: 'country' | 'bankCountry', label: string) => <label className='block text-xs text-ink/45'>{label}<select value={form[key]} onChange={(event) => set(key, event.target.value)} className='mt-1.5 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm outline-none'><option value=''>Select country</option>{COUNTRIES.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}</select></label>
  async function save() {
    setBusy(true); setError('')
    const payload = { walletId: wallet.id, walletAddress: wallet.address, tokenId: pass.tokenId, passId: pass.passId, identityData: [{ idType: form.idType, fullName: form.fullName, idNumber: form.idNumber, validUntil: form.validUntil, issuingCountryISO2: form.country }], bankAccountData: [] }
    try { const response = await fetch(existing ? `${apiUrl}/api/identities/${existing.id}` : `${apiUrl}/api/identities`, { method: existing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(existing ? payload : { ...payload, identityDataList: payload.identityData, bankAccountList: payload.bankAccountData }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Could not save identity'); onSaved(); onClose() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save identity') } finally { setBusy(false) }
  }
  return <AnimatePresence>{open && <><motion.div className='fixed inset-0 z-50 bg-black/30' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} /><motion.aside className='fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-card p-6 shadow-xl' initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}><div className='mb-6 flex items-start justify-between'><div><p className='text-[10px] uppercase tracking-wider text-ink/35'>Private workspace data</p><h3 className='font-display text-xl font-semibold'>Identity details</h3><p className='mt-1 font-mono text-xs text-ink/40'>{pass.passId}</p></div><button type='button' onClick={onClose}><X className='h-4 w-4 text-ink/35' /></button></div>{error && <p className='mb-4 rounded-xl bg-coral/10 p-3 text-xs text-coral'>{error}</p>}<div className='mb-4'><p className='mb-2 text-xs text-ink/45'>Identity document</p><div className='flex gap-2'><label className='flex flex-1 items-center gap-2 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-xs'><input type='radio' checked readOnly /> Passport</label><label className='flex flex-1 items-center gap-2 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-xs text-ink/30'><input type='radio' disabled /> ID card (coming soon)</label></div></div><div className='space-y-3'>{field('fullName', 'Full name')}{field('idNumber', 'Passport number')}{field('validUntil', 'Valid until', 'date')}{countryField('country', 'Issuing country')}</div><p className='mt-5 text-xs text-ink/35'>After saving, this identity is submitted for company or compliance review.</p><button type='button' onClick={() => void save()} disabled={busy || !form.fullName || !form.idNumber} className='mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-medium text-lavender disabled:opacity-40'>{busy && <Loader2 className='h-3.5 w-3.5 animate-spin' />}Save and submit</button></motion.aside></>}</AnimatePresence>
}
