'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, Loader2, Search } from 'lucide-react'
import { useStart } from '../../components/start/StartProvider'

interface AuditRow {
  id: string
  date: number
  board: string
  from: string
  to: string
  fromWallet: string
  toWallet: string
  amount: string
  status: string
  merkleRoot?: string
  fromIdentity: string
  toIdentity: string
}
interface Identity {
  walletAddress: string
  status: string
  countryCode?: string | null
  subTier?: number | null
}

export default function TravelRulePage() {
  const { apiUrl } = useStart()
  const [rows, setRows] = useState<AuditRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [boardsResponse, identitiesResponse] = await Promise.all([
          fetch(`${apiUrl}/api/boards`),
          fetch(`${apiUrl}/api/identities/all`)
        ])
        const boards = boardsResponse.ok ? await boardsResponse.json() : []
        const identities: Identity[] = identitiesResponse.ok ? await identitiesResponse.json() : []
        const identityMap = new Map(
          identities.map((identity) => [identity.walletAddress.toLowerCase(), identity])
        )
        const audit: AuditRow[] = []
        for (const board of boards) {
          const [statusResponse, connectionResponse, cardsResponse] = await Promise.all([
            fetch(`${apiUrl}/api/flow-status?flowId=${board.id}`),
            fetch(`${apiUrl}/api/connections?boardId=${board.id}`),
            fetch(`${apiUrl}/api/cards?boardId=${board.id}`)
          ])
          if (!statusResponse.ok || !connectionResponse.ok || !cardsResponse.ok) continue
          const statuses = await statusResponse.json()
          const connections = await connectionResponse.json()
          const cards = await cardsResponse.json()
          const cardMap = new Map(
            cards.map((card: { id: string; title?: string; fields?: Record<string, string> }) => [
              card.id,
              card
            ])
          )
          for (const status of statuses) {
            const connection = connections.find(
              (item: { id: string }) => item.id === status.routeId
            )
            if (!connection) continue
            const from = cardMap.get(connection.from) as
              | { title?: string; fields?: Record<string, string> }
              | undefined
            const to = cardMap.get(connection.to) as
              | { title?: string; fields?: Record<string, string> }
              | undefined
            const fromWallet = from?.fields?.address || ''
            const toWallet = to?.fields?.address || ''
            const fromIdentity = identityMap.get(fromWallet.toLowerCase())
            const toIdentity = identityMap.get(toWallet.toLowerCase())
            audit.push({
              id: status.id,
              date: status.updatedAt || Date.now(),
              board: board.name,
              from: from?.title || 'Unknown',
              to: to?.title || 'Unknown',
              fromWallet,
              toWallet,
              amount: connection.amount || '0',
              status: status.status,
              merkleRoot: status.merkleRoot,
              fromIdentity: fromIdentity
                ? `${fromIdentity.status}${fromIdentity.countryCode ? ` · ${fromIdentity.countryCode}` : ''}`
                : 'Not found',
              toIdentity: toIdentity
                ? `${toIdentity.status}${toIdentity.countryCode ? ` · ${toIdentity.countryCode}` : ''}`
                : 'Not found'
            })
          }
        }
        setRows(audit.sort((a, b) => b.date - a.date))
      } catch (error) {
        console.error('Failed to load Travel Rule audit:', error)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [apiUrl])

  const filtered = useMemo(
    () =>
      rows.filter((row) =>
        `${row.board} ${row.from} ${row.to} ${row.fromWallet} ${row.toWallet} ${row.merkleRoot || ''}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [rows, query]
  )
  function exportCsv() {
    const header =
      'Date,Board,From,To,From Wallet,To Wallet,Amount,Status,From Identity,To Identity,Merkle Root'
    const body = filtered
      .map((row) =>
        [
          new Date(row.date).toISOString(),
          row.board,
          row.from,
          row.to,
          row.fromWallet,
          row.toWallet,
          row.amount,
          row.status,
          row.fromIdentity,
          row.toIdentity,
          row.merkleRoot || ''
        ]
          .map((value) => JSON.stringify(value))
          .join(',')
      )
      .join('\n')
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'goji-travel-rule-audit.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className='mb-6 flex items-start justify-between gap-4'>
        <div>
          <h2 className='font-display text-xl font-semibold'>Travel Rule Audit</h2>
          <p className='mt-1 text-sm text-ink/40'>
            Read-only transfer records assembled from workspace payment flows and identity data.
          </p>
        </div>
        <button
          type='button'
          onClick={exportCsv}
          disabled={!filtered.length}
          className='inline-flex items-center gap-2 rounded-xl bg-ink px-3 py-2 text-xs font-medium text-lavender disabled:opacity-40'
        >
          <Download className='h-3.5 w-3.5' />
          Export CSV
        </button>
      </div>
      <div className='mb-4 rounded-2xl bg-card p-3 shadow-[0_4px_20px_rgba(43,36,64,0.05)]'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30' />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search transaction, wallet, board, or merkle root'
            className='w-full rounded-xl bg-ink/5 py-2.5 pl-10 pr-3 text-xs outline-none'
          />
        </div>
      </div>
      {loading ? (
        <div className='flex justify-center py-16'>
          <Loader2 className='h-5 w-5 animate-spin text-ink/35' />
        </div>
      ) : (
        <div className='overflow-hidden rounded-2xl bg-card shadow-[0_4px_20px_rgba(43,36,64,0.05)]'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead>
                <tr className='border-b border-ink/8 text-[10px] uppercase tracking-wider text-ink/35'>
                  <th className='px-5 py-3'>Date</th>
                  <th className='px-5 py-3'>Transfer</th>
                  <th className='px-5 py-3'>Amount</th>
                  <th className='px-5 py-3'>Status</th>
                  <th className='px-5 py-3'>Identity coverage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className='border-b border-ink/5 last:border-0'>
                    <td className='whitespace-nowrap px-5 py-4 text-ink/45'>
                      {new Date(row.date).toLocaleString()}
                    </td>
                    <td className='px-5 py-4'>
                      <p className='font-medium text-ink/70'>
                        {row.from} → {row.to}
                      </p>
                      <p className='mt-1 text-[10px] text-ink/35'>{row.board}</p>
                      <p className='mt-1 font-mono text-[10px] text-ink/30'>
                        {row.fromWallet || 'No sender wallet'} →{' '}
                        {row.toWallet || 'No recipient wallet'}
                      </p>
                    </td>
                    <td className='whitespace-nowrap px-5 py-4 font-mono text-ink/60'>
                      {row.amount} USDC
                    </td>
                    <td className='px-5 py-4'>
                      <span className='rounded-full bg-ink/5 px-2 py-1 text-[10px] capitalize text-ink/55'>
                        {row.status}
                      </span>
                    </td>
                    <td className='px-5 py-4 text-[10px] text-ink/45'>
                      <p>From: {row.fromIdentity}</p>
                      <p className='mt-1'>To: {row.toIdentity}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className='p-10 text-center text-sm text-ink/35'>No audit records found.</p>
          )}
        </div>
      )}
    </div>
  )
}
