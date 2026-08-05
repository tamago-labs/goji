'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Loader2, Search } from 'lucide-react'
import { useStart } from '../../components/start/StartProvider'
import { knowledgeApi, type KnowledgeModelStatus, type KnowledgeResult } from '../../components/start/knowledge'

export default function KnowledgePage() {
  const { apiUrl, health } = useStart()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<KnowledgeResult[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<KnowledgeModelStatus | null>(null)

  useEffect(() => {
    if (health?.role !== 'company') return
    const handle = window.setTimeout(() => {
      knowledgeApi.model(apiUrl).then(setModel).catch(() => setModel(null))
    }, 0)
    return () => window.clearTimeout(handle)
  }, [apiUrl, health?.role])

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    setError(null)
    try {
      const response = await knowledgeApi.search(apiUrl, query.trim())
      setResults(response.results || [])
    } catch (err) {
      setResults([])
      setError(err instanceof Error ? err.message : 'Knowledge search failed')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div>
      <div className='mb-6 flex items-start justify-between gap-4'>
        <div>
          <h1 className='font-display text-2xl font-semibold text-ink'>Knowledge Base</h1>
          <p className='mt-1 text-sm text-ink/40'>Search your company&apos;s private AI knowledge through the P2P workspace.</p>
        </div>
        <div className='flex flex-col items-end gap-1'>
          <span className='text-[10px] uppercase tracking-wider text-ink/30'>Workspace AI</span>
          <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${health?.role === 'company' ? (model?.status === 'ready' ? 'bg-mint/15 text-[#1B7A50]' : 'bg-amber-100 text-amber-700') : health?.peers ? 'bg-mint/15 text-[#1B7A50]' : 'bg-coral/10 text-coral'}`}>
            {health?.role === 'company' ? model?.status === 'ready' ? 'Model ready' : 'Model stopped' : health?.peers ? 'Available via P2P' : 'Host unavailable'}
          </span>
        </div>
      </div>

      <div className='rounded-2xl bg-card p-5 shadow-[0_4px_20px_rgba(43,36,64,0.06)]'>
        <form className='flex gap-2' onSubmit={(event) => { event.preventDefault(); void search() }}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Ask about policies, invoices, payroll, or company processes...' className='min-w-0 flex-1 rounded-xl border border-ink/10 bg-ink/[0.02] px-4 py-3 text-sm text-ink outline-none focus:border-ink/30' />
          <button type='submit' disabled={searching || !query.trim()} className='flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-medium text-lavender transition-opacity disabled:cursor-not-allowed disabled:opacity-40'>
            {searching ? <Loader2 className='h-4 w-4 animate-spin' /> : <Search className='h-4 w-4' />} Search
          </button>
        </form>
      </div>

      {error && <div className='mt-4 rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral'>{error}</div>}
      {results.length > 0 ? (
        <div className='mt-5 space-y-3'>
          {results.map((result, index) => (
            <article key={result.id || index} className='rounded-2xl bg-card p-5 shadow-[0_4px_20px_rgba(43,36,64,0.05)]'>
              <div className='mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink/30'>
                <BookOpen className='h-3.5 w-3.5' /> Relevant passage
                {typeof result.score === 'number' && <span className='rounded-full bg-mint/15 px-2 py-0.5 text-[#1B7A50]'>{Math.round(result.score * 100)}% match</span>}
              </div>
              <p className='whitespace-pre-wrap text-sm leading-6 text-ink/70'>{result.content}</p>
            </article>
          ))}
        </div>
      ) : !searching && query && !error ? <div className='mt-5 rounded-2xl bg-card p-10 text-center text-sm text-ink/40'>No matching passages found.</div> : !query && <div className='mt-5 rounded-2xl bg-card p-10 text-center'><BookOpen className='mx-auto mb-3 h-6 w-6 text-ink/20' /><p className='text-sm text-ink/40'>Search the private company knowledge base to get started.</p></div>}
    </div>
  )
}
