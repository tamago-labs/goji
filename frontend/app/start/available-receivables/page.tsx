'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Search, Loader2 } from 'lucide-react'
import { useStart } from '../../components/start/StartProvider'

interface Receivable {
  id: string
  tokenAddress: string
  name: string
  type: string
  amount: string
  interestRate: string
  minInvestment: string
  expiryDays: string
  proofs: string[]
  status: string
  issuer: string
  createdAt: number
  updatedAt: number
}

export default function AvailableReceivablesPage() {
  const { apiUrl } = useStart()
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${apiUrl}/api/receivables`)
        if (res.ok) {
          const data = await res.json()
          setReceivables(data)
        }
      } catch (e) {
        console.error('Failed to load receivables:', e)
      }
      setLoading(false)
    }
    load()
  }, [apiUrl])

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return '0 USDC'
    return `${num.toLocaleString()} USDC`
  }

  const filtered = receivables.filter(r => {
    if (filterType !== 'all' && r.type !== filterType) return false
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <h2 className='font-display text-xl font-semibold mb-4'>Available Receivables</h2>

      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
        {/* Filters */}
        <div className='px-6 py-3 border-b border-ink/8 flex items-center gap-4'>
          <div className='relative flex-1 max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30' />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search receivables...'
              className='w-full text-xs text-ink bg-ink/5 border border-ink/10 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-ink/20'
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className='text-xs text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-ink/20'
          >
            <option value='all'>All Types</option>
            <option value='invoice'>Invoice</option>
            <option value='payment'>Payment</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className='text-xs text-ink bg-ink/5 border border-ink/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-ink/20'
          >
            <option value='all'>All Status</option>
            <option value='active'>Active</option>
            <option value='funded'>Funded</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className='flex items-center justify-center min-h-[200px]'>
            <Loader2 className='w-6 h-6 text-ink/40 animate-spin' />
          </div>
        ) : filtered.length === 0 ? (
          <div className='p-8 text-center'>
            <Package className='w-8 h-8 text-ink/20 mx-auto mb-2' />
            <p className='text-ink/40 text-sm font-medium mb-1'>No receivables found</p>
            <p className='text-ink/30 text-xs'>Check back later for new investment opportunities.</p>
          </div>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-ink/5 text-left'>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Name</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Type</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Amount</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Interest</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Term</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Status</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                  <td className='px-6 py-3 text-ink/70 text-sm font-medium'>{r.name}</td>
                  <td className='px-6 py-3 text-ink/50 text-xs capitalize'>{r.type}</td>
                  <td className='px-6 py-3 font-mono text-ink/60 text-sm'>{formatAmount(r.amount)}</td>
                  <td className='px-6 py-3 text-ink/60 text-sm'>{r.interestRate}%</td>
                  <td className='px-6 py-3 text-ink/50 text-xs'>{r.expiryDays} days</td>
                  <td className='px-6 py-3'>
                    {r.status === 'active' && <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700'>Active</span>}
                    {r.status === 'funded' && <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>Funded</span>}
                    {r.status === 'expired' && <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'>Expired</span>}
                    {r.status === 'redeemed' && <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>Redeemed</span>}
                  </td>
                  <td className='px-6 py-3'>
                    <Link
                      href={`/start/available-receivables/${r.tokenAddress}`}
                      className='text-[10px] text-mint hover:text-[#1B7A50] font-medium transition-colors'
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
