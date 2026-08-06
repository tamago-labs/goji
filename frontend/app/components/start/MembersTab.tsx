'use client'

import { useState, useEffect } from 'react'
import { Users, ChevronDown } from 'lucide-react'

interface Member {
  writerKey: string
  displayName: string
  role: string
  assignedBy: string | null
  assignedAt: number | null
  updatedAt: number
}

interface MembersTabProps {
  apiUrl: string
  currentWriterKey?: string
}

const ROLES = ['company', 'counterparty', 'compliance', 'partner', 'pending'] as const

const ROLE_COLORS: Record<string, string> = {
  company: 'bg-mint/15 text-[#1B7A50]',
  counterparty: 'bg-blue-100 text-blue-700',
  compliance: 'bg-violet/15 text-[#5A4FB8]',
  partner: 'bg-violet/15 text-[#5A4FB8]',
  pending: 'bg-ink/10 text-ink/50'
}

const ROLE_LABELS: Record<string, string> = {
  company: 'COMPANY',
  counterparty: 'COUNTERPARTY',
  compliance: 'COMPLIANCE',
  partner: 'PARTNER',
  pending: 'PENDING'
}

export default function MembersTab({ apiUrl, currentWriterKey }: MembersTabProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${apiUrl}/api/members`)
        if (res.ok) {
          setMembers(await res.json())
          setError(null)
        } else if (res.status === 403) {
          setError('Only company or compliance can manage members')
        }
      } catch {
        setError('Failed to load members')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [apiUrl])

  const handleAssignRole = async (writerKey: string, role: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/members/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ writerKey, role })
      })
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.writerKey === writerKey ? { ...m, role, assignedAt: Date.now() } : m))
        )
        setOpenDropdown(null)
      }
    } catch {}
  }

  const formatDate = (ts: number | null) => {
    if (!ts) return '—'
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[200px]'>
        <div className='w-6 h-6 border-2 border-ink/20 border-t-ink/60 rounded-full animate-spin' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='bg-card rounded-2xl p-8 shadow-[0_4px_20px_rgba(43,36,64,0.06)] text-center'>
        <p className='text-ink/40 text-sm'>{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-display text-xl font-semibold'>Members</h2>
      </div>

      {members.length === 0 ? (
        <div className='bg-card rounded-2xl p-8 shadow-[0_4px_20px_rgba(43,36,64,0.06)] text-center'>
          <Users className='w-8 h-8 text-ink/20 mx-auto mb-2' />
          <p className='text-ink/40 text-sm'>No members connected yet</p>
        </div>
      ) : (
        <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)]'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-ink/8'>
                <th className='text-left text-[11px] text-ink/40 font-medium px-4 py-3'>Name</th>
                <th className='text-left text-[11px] text-ink/40 font-medium px-4 py-3'>Peer ID</th>
                <th className='text-left text-[11px] text-ink/40 font-medium px-4 py-3'>Role</th>
                <th className='text-left text-[11px] text-ink/40 font-medium px-4 py-3'>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isCurrent = m.writerKey === currentWriterKey
                const canChangeRole = !isCurrent

                return (
                  <tr key={m.writerKey} className='border-b border-ink/5 last:border-0 hover:bg-ink/[0.02] transition-colors'>
                    <td className='px-4 py-3 text-sm text-ink font-medium'>
                      {m.displayName}
                      {isCurrent && <span className='ml-1.5 text-[10px] text-ink/30'>(you)</span>}
                    </td>
                    <td className='px-4 py-3 text-sm text-ink/50 font-mono'>{m.writerKey.slice(0, 8)}...{m.writerKey.slice(-4)}</td>
                    <td className='px-4 py-3'>
                      <div className='relative inline-block'>
                        <button
                          onClick={() => canChangeRole && setOpenDropdown(openDropdown === m.writerKey ? null : m.writerKey)}
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[m.role] || ROLE_COLORS.pending} ${canChangeRole ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                        >
                          {ROLE_LABELS[m.role] || m.role.toUpperCase()}
                          {canChangeRole && <ChevronDown className='w-3 h-3' />}
                        </button>
                        {openDropdown === m.writerKey && canChangeRole && (
                          <div className='absolute left-0 mt-1 bg-card rounded-xl shadow-[0_10px_40px_rgba(43,36,64,0.15)] border border-ink/8 py-1 z-50 min-w-[120px]'>
                            {ROLES.map((role) => (
                              <button
                                key={role}
                                onClick={() => handleAssignRole(m.writerKey, role)}
                                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-ink/5 transition-colors ${m.role === role ? 'text-ink font-medium' : 'text-ink/60'}`}
                              >
                                {ROLE_LABELS[role]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className='px-4 py-3 text-sm text-ink/40'>{formatDate(m.assignedAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
