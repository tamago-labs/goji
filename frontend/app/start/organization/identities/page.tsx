'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight, Clock3, Lock, Search, X } from 'lucide-react'
import { useStart } from '../../../components/start/StartProvider'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import {
  COMPLIANCE_REGISTRY_ABI,
  COMPLIANCE_REGISTRY_ADDRESS
} from '../../../../lib/complianceRegistry'

type Status = 'pending' | 'approved' | 'rejected' | 'locked' | 'expired'
interface AuditEntry {
  action: string
  actor?: string
  at: number
  reason?: string | null
}
interface IdentityRecord {
  id: string
  ownerName: string
  walletAddress: string
  passId: string
  tokenId: string
  status: Status
  countryCode?: string | null
  subTier?: number | null
  identityData?: {
    fullName?: string
    idType?: string
    idNumber?: string
    validUntil?: string
    issuingCountryISO2?: string
  }[]
  rejectionReason?: string | null
  auditLog?: AuditEntry[]
}

const statusStyles: Record<Status, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-mint/15 text-[#1B7A50]',
  rejected: 'bg-coral/10 text-coral',
  locked: 'bg-ink/10 text-ink/60',
  expired: 'bg-ink/10 text-ink/40'
}

export default function IdentitiesPage() {
  const { apiUrl, health } = useStart()
  const { address } = useAccount()
  const publicClient = usePublicClient({ chainId: arcTestnet.id })
  const { data: walletClient } = useWalletClient()
  const [identities, setIdentities] = useState<IdentityRecord[]>([])
  const [selected, setSelected] = useState<IdentityRecord | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    const response = await fetch(`${apiUrl}/api/identities/all`)
    if (response.ok) setIdentities(await response.json())
  }, [apiUrl])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(handle)
  }, [load])

  const countries = useMemo(
    () => Array.from(new Set(identities.map((item) => item.countryCode).filter(Boolean))).sort(),
    [identities]
  )
  const filtered = identities.filter((item) => {
    const text = `${item.ownerName} ${item.walletAddress} ${item.passId}`.toLowerCase()
    return (
      (statusFilter === 'all' || item.status === statusFilter) &&
      (countryFilter === 'all' || item.countryCode === countryFilter) &&
      text.includes(query.toLowerCase())
    )
  })

  async function review(id: string, action: 'approve' | 'reject' | 'lock' | 'unlock' | 'expire') {
    const reason =
      action === 'reject'
        ? window.prompt('Reason for requesting changes?') || 'Changes requested'
        : undefined
    const identity = identities.find((item) => item.id === id)
    let approvalTier: number | null = identity?.subTier ?? null
    if (action === 'approve' && identity) {
      if (!walletClient || !publicClient || !address) {
        window.alert('Connect the compliance reviewer wallet before approving an identity.')
        return
      }
      if (!identity.countryCode) {
        window.alert('The identity needs a country before approval.')
        return
      }
      const requestedTier = window.prompt('Compliance tier (1-3)', String(identity.subTier || 1))
      approvalTier = Number(requestedTier)
      if (!Number.isInteger(approvalTier) || approvalTier < 1 || approvalTier > 3) {
        window.alert('Choose a compliance tier from 1 to 3.')
        return
      }
      try {
        const country = `0x${Array.from(identity.countryCode.slice(0, 2))
          .map((character) => character.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')}` as `0x${string}`
        const validUntil = identity.identityData?.[0]?.validUntil
        const expiresAt = validUntil
          ? BigInt(Math.floor(new Date(validUntil).getTime() / 1000))
          : BigInt(0)
        const simulation = await publicClient.simulateContract({
          address: COMPLIANCE_REGISTRY_ADDRESS,
          abi: COMPLIANCE_REGISTRY_ABI,
          functionName: 'approveIdentity',
          args: [identity.walletAddress as `0x${string}`, approvalTier, country, expiresAt],
          account: address
        })
        const hash = await walletClient.writeContract(simulation.request)
        await publicClient.waitForTransactionReceipt({ hash })
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'On-chain identity approval failed.')
        return
      }
    }
    const response = await fetch(`${apiUrl}/api/identities/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, ...(approvalTier ? { subTier: approvalTier } : {}) })
    })
    if (response.ok) {
      setSelected(null)
      await load()
    }
  }

  if (health?.role !== 'company' && health?.role !== 'compliance')
    return (
      <div className='rounded-2xl bg-card p-8 text-center text-sm text-ink/45'>
        Compliance Officer access is required to review identities.
      </div>
    )

  return (
    <div>
      <div className='mb-6 flex items-start justify-between gap-4'>
        <div>
          <h2 className='font-display text-xl font-semibold'>Identity Review</h2>
          <p className='mt-1 text-sm text-ink/40'>
            Review wallet-bound identities for this private workspace.
          </p>
        </div>
        <span className='rounded-full bg-amber-100 px-3 py-1 text-[11px] font-medium text-amber-700'>
          {identities.filter((item) => item.status === 'pending').length} pending
        </span>
      </div>
      <div className='mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_150px_150px]'>
        <label className='relative'>
          <Search className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/30' />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search member, wallet, or pass ID'
            className='w-full rounded-xl border border-ink/10 bg-card py-2.5 pl-9 pr-3 text-xs outline-none'
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className='rounded-xl border border-ink/10 bg-card px-3 py-2.5 text-xs outline-none'
        >
          <option value='all'>All statuses</option>
          {Object.keys(statusStyles).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={countryFilter}
          onChange={(event) => setCountryFilter(event.target.value)}
          className='rounded-xl border border-ink/10 bg-card px-3 py-2.5 text-xs outline-none'
        >
          <option value='all'>All countries</option>
          {countries.map((country) => (
            <option key={country} value={country || ''}>
              {country}
            </option>
          ))}
        </select>
      </div>
      <div className='overflow-hidden rounded-2xl bg-card shadow-[0_4px_20px_rgba(43,36,64,0.06)]'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-ink/8 text-left text-[11px] text-ink/40'>
              <th className='px-5 py-3'>Member</th>
              <th className='px-5 py-3'>Country</th>
              <th className='px-5 py-3'>Pass</th>
              <th className='px-5 py-3'>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className='border-b border-ink/5 text-sm last:border-0'>
                <td className='px-5 py-4'>
                  <p className='font-medium'>{item.ownerName}</p>
                  <p className='font-mono text-[10px] text-ink/35'>
                    {item.walletAddress.slice(0, 8)}...{item.walletAddress.slice(-6)}
                  </p>
                </td>
                <td className='px-5 py-4 text-xs text-ink/55'>{item.countryCode || '—'}</td>
                <td className='px-5 py-4 font-mono text-xs text-ink/55'>
                  {item.passId.slice(0, 12)}...
                </td>
                <td className='px-5 py-4'>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium capitalize ${statusStyles[item.status]}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className='px-5 py-4 text-right'>
                  <button
                    type='button'
                    onClick={() => setSelected(item)}
                    className='inline-flex items-center gap-1 text-xs font-medium text-ink/55 hover:text-ink'
                  >
                    Review <ChevronRight className='h-3.5 w-3.5' />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className='p-10 text-center text-sm text-ink/35'>
            No identities match the current filters.
          </div>
        )}
      </div>
      {selected && (
        <div
          className='fixed inset-0 z-50 flex justify-end bg-black/30'
          onClick={() => setSelected(null)}
        >
          <aside
            className='h-full w-full max-w-xl overflow-y-auto bg-card p-6 shadow-xl'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='mb-6 flex items-start justify-between'>
              <div>
                <p className='text-[10px] uppercase tracking-wider text-ink/35'>Identity details</p>
                <h3 className='font-display text-xl font-semibold'>{selected.ownerName}</h3>
                <p className='mt-1 font-mono text-xs text-ink/40'>{selected.walletAddress}</p>
              </div>
              <button type='button' onClick={() => setSelected(null)}>
                <X className='h-4 w-4 text-ink/35' />
              </button>
            </div>
            <div className='mb-5 grid grid-cols-2 gap-3 text-xs'>
              <div className='rounded-xl bg-ink/5 p-3'>
                <span className='text-ink/35'>Status</span>
                <p className='mt-1 capitalize'>{selected.status}</p>
              </div>
              <div className='rounded-xl bg-ink/5 p-3'>
                <span className='text-ink/35'>Country / Tier</span>
                <p className='mt-1'>
                  {selected.countryCode || '—'} / {selected.subTier ?? '—'}
                </p>
              </div>
              <div className='rounded-xl bg-ink/5 p-3'>
                <span className='text-ink/35'>Pass ID</span>
                <p className='mt-1 break-all font-mono'>{selected.passId}</p>
              </div>
              <div className='rounded-xl bg-ink/5 p-3'>
                <span className='text-ink/35'>Token ID</span>
                <p className='mt-1 font-mono'>{selected.tokenId}</p>
              </div>
            </div>
            <section className='mb-5 rounded-xl bg-ink/5 p-4 text-sm'>
              <h4 className='mb-3 font-medium'>Identity data</h4>
              {(selected.identityData || []).map((item, index) => (
                <div key={index} className='space-y-1 text-ink/65'>
                  <p>
                    {item.fullName || 'Unnamed'} · {item.idType || 'ID'} ·{' '}
                    {item.issuingCountryISO2 || '—'}
                  </p>
                  <p className='font-mono text-xs'>
                    {item.idNumber || 'No ID number'} · valid until {item.validUntil || '—'}
                  </p>
                </div>
              ))}
            </section>
            <section className='mb-6'>
              <h4 className='mb-3 flex items-center gap-2 text-sm font-medium'>
                <Clock3 className='h-4 w-4 text-ink/40' />
                Audit history
              </h4>
              <div className='space-y-2'>
                {(selected.auditLog || [])
                  .slice()
                  .reverse()
                  .map((entry, index) => (
                    <div key={index} className='rounded-xl border border-ink/8 px-3 py-2 text-xs'>
                      <div className='flex justify-between'>
                        <span className='capitalize text-ink/70'>
                          {entry.action.replace('-', ' ')}
                        </span>
                        <span className='text-ink/35'>{new Date(entry.at).toLocaleString()}</span>
                      </div>
                      {entry.reason && <p className='mt-1 text-coral'>{entry.reason}</p>}
                    </div>
                  ))}
              </div>
            </section>
            {selected.rejectionReason && (
              <p className='mb-5 rounded-xl bg-coral/10 p-3 text-xs text-coral'>
                {selected.rejectionReason}
              </p>
            )}
            <div className='flex flex-wrap justify-end gap-2'>
              {(selected.status === 'pending' || selected.status === 'rejected') && (
                <>
                  <button
                    type='button'
                    onClick={() => void review(selected.id, 'reject')}
                    className='rounded-xl bg-coral/10 px-3 py-2 text-xs text-coral'
                  >
                    Request changes
                  </button>
                  <button
                    type='button'
                    onClick={() => void review(selected.id, 'approve')}
                    className='inline-flex items-center gap-1 rounded-xl bg-ink px-3 py-2 text-xs text-lavender'
                  >
                    <Check className='h-3.5 w-3.5' />
                    Approve
                  </button>
                </>
              )}
              {selected.status === 'approved' && (
                <>
                  <button
                    type='button'
                    onClick={() => void review(selected.id, 'approve')}
                    className='inline-flex items-center gap-1 rounded-xl bg-mint/15 px-3 py-2 text-xs font-medium text-[#1B7A50]'
                  >
                    Sync on-chain approval
                  </button>
                  <button
                    type='button'
                    onClick={() => void review(selected.id, 'lock')}
                    className='inline-flex items-center gap-1 rounded-xl bg-ink px-3 py-2 text-xs text-lavender'
                  >
                    <Lock className='h-3.5 w-3.5' />
                    Lock
                  </button>
                </>
              )}
              {selected.status === 'locked' && (
                <button
                  type='button'
                  onClick={() => void review(selected.id, 'unlock')}
                  className='rounded-xl bg-mint/15 px-3 py-2 text-xs font-medium text-[#1B7A50]'
                >
                  Unlock
                </button>
              )}
              {selected.status !== 'locked' && selected.status !== 'expired' && (
                <button
                  type='button'
                  onClick={() => void review(selected.id, 'expire')}
                  className='rounded-xl bg-ink/5 px-3 py-2 text-xs text-ink/55'
                >
                  Mark expired
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
