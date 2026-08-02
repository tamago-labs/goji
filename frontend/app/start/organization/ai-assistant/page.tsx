'use client'

import { useCallback, useEffect, useState } from 'react'
import { FileText, Globe, Loader2, Play, Square, Trash2 } from 'lucide-react'
import { useStart } from '../../../components/start/StartProvider'
import { knowledgeApi, type KnowledgeDocument, type KnowledgeModelStatus } from '../../../components/start/knowledge'

export default function AIAssistantPage() {
  const { apiUrl, health } = useStart()
  const [model, setModel] = useState<KnowledgeModelStatus | null>(null)
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [mode, setMode] = useState<'text' | 'url' | null>(null)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [nextModel, nextDocuments] = await Promise.all([knowledgeApi.model(apiUrl), knowledgeApi.documents(apiUrl)])
      setModel(nextModel)
      setDocuments(nextDocuments)
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Could not load knowledge service') }
  }, [apiUrl])

  useEffect(() => {
    const handle = window.setTimeout(() => { void refresh() }, 0)
    return () => window.clearTimeout(handle)
  }, [refresh])

  async function toggleModel() {
    setBusy(true); setMessage(null)
    try { setModel(model?.status === 'ready' ? await knowledgeApi.unloadModel(apiUrl) : await knowledgeApi.loadModel(apiUrl)) } catch (err) { setMessage(err instanceof Error ? err.message : 'Model operation failed') } finally { setBusy(false) }
  }

  async function addDocument() {
    if (!name.trim() || !content.trim()) return
    setBusy(true); setMessage(null)
    try { await knowledgeApi.addDocument(apiUrl, { name: name.trim(), content: content.trim(), source: mode || 'text' }); setName(''); setContent(''); setUrl(''); setMode(null); await refresh() } catch (err) { setMessage(err instanceof Error ? err.message : 'Document ingestion failed') } finally { setBusy(false) }
  }

  async function importUrl() {
    if (!url.trim()) return
    setBusy(true); setMessage(null)
    try { const result = await knowledgeApi.fetchUrl(apiUrl, url.trim()); setContent(result.content); if (!name.trim()) setName(new URL(url).hostname) } catch (err) { setMessage(err instanceof Error ? err.message : 'Website import failed') } finally { setBusy(false) }
  }

  async function removeDocument(id: string) {
    if (!window.confirm('Delete this document and its embeddings?')) return
    try { await knowledgeApi.deleteDocument(apiUrl, id); await refresh() } catch (err) { setMessage(err instanceof Error ? err.message : 'Delete failed') }
  }

  if (health?.role !== 'employer') return <div className='rounded-2xl bg-card p-8 text-center text-sm text-ink/50'>Only the company administrator can manage the private knowledge base.</div>

  return (
    <div>
      <div className='mb-6 flex items-start justify-between gap-4'><div><h2 className='font-display text-2xl font-semibold text-ink'>AI Assistant</h2><p className='mt-1 text-sm text-ink/40'>Manage the private AI knowledge service for your workspace.</p></div><button type='button' onClick={() => void toggleModel()} disabled={busy} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium ${model?.status === 'ready' ? 'bg-coral/10 text-coral' : 'bg-ink text-lavender'}`}>{busy ? <Loader2 className='h-4 w-4 animate-spin' /> : model?.status === 'ready' ? <Square className='h-4 w-4' /> : <Play className='h-4 w-4' />}{model?.status === 'ready' ? 'Stop Service' : 'Start Service'}</button></div>
      <div className='mb-5 flex items-center gap-3 rounded-2xl bg-card p-4 shadow-[0_4px_20px_rgba(43,36,64,0.05)]'><span className={`h-2.5 w-2.5 rounded-full ${model?.status === 'ready' ? 'bg-[#42B883]' : model?.status === 'loading' ? 'animate-pulse bg-amber-400' : 'bg-ink/20'}`} /><div><p className='text-sm font-medium text-ink'>{model?.status === 'ready' ? 'Embedding model ready' : model?.status === 'loading' ? 'Loading embedding model...' : 'Embedding model stopped'}</p><p className='text-xs text-ink/35'>GTE-Large runs on the employer terminal; authorized members search via encrypted P2P.</p></div></div>
      {message && <div className='mb-5 rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral'>{message}</div>}
      <div className='mb-5 flex gap-2'><button type='button' onClick={() => { setMode(mode === 'text' ? null : 'text'); setContent('') }} className='rounded-xl border border-ink/10 bg-card px-4 py-2.5 text-xs font-medium text-ink/60'><FileText className='mr-1.5 inline h-4 w-4' />Add Text</button><button type='button' onClick={() => { setMode(mode === 'url' ? null : 'url'); setContent('') }} className='rounded-xl border border-ink/10 bg-card px-4 py-2.5 text-xs font-medium text-ink/60'><Globe className='mr-1.5 inline h-4 w-4' />Import Website</button></div>
      {mode && <div className='mb-5 rounded-2xl bg-card p-5 shadow-[0_4px_20px_rgba(43,36,64,0.05)]'><input value={name} onChange={(event) => setName(event.target.value)} placeholder='Document name' className='mb-3 w-full rounded-xl border border-ink/10 bg-ink/[0.02] px-3 py-2.5 text-sm outline-none' />{mode === 'url' && <div className='mb-3 flex gap-2'><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder='https://example.com/handbook' className='min-w-0 flex-1 rounded-xl border border-ink/10 bg-ink/[0.02] px-3 py-2.5 text-sm outline-none' /><button type='button' onClick={() => void importUrl()} disabled={busy || !url.trim()} className='rounded-xl border border-ink/10 px-3 text-xs font-medium disabled:opacity-40'>Fetch</button></div>}<textarea value={content} onChange={(event) => setContent(event.target.value)} rows={8} placeholder={mode === 'url' ? 'Fetch a website to preview its text...' : 'Paste company policies, procedures, or other private knowledge...'} className='w-full resize-y rounded-xl border border-ink/10 bg-ink/[0.02] px-3 py-2.5 font-mono text-xs outline-none' /><div className='mt-3 flex justify-end'><button type='button' onClick={() => void addDocument()} disabled={busy || !name.trim() || !content.trim()} className='rounded-xl bg-ink px-4 py-2.5 text-xs font-medium text-lavender disabled:opacity-40'>{busy ? 'Ingesting...' : 'Add to Knowledge Base'}</button></div></div>}
      <div className='overflow-hidden rounded-2xl bg-card shadow-[0_4px_20px_rgba(43,36,64,0.05)]'><div className='border-b border-ink/8 px-5 py-4 text-xs font-medium uppercase tracking-wider text-ink/35'>Documents ({documents.length})</div>{documents.length === 0 ? <div className='p-10 text-center text-sm text-ink/35'>No documents indexed yet.</div> : <div className='divide-y divide-ink/5'>{documents.map((document) => <div key={document.id} className='flex items-center justify-between gap-3 px-5 py-4'><div className='flex min-w-0 items-center gap-3'><div className='rounded-xl bg-ink/5 p-2 text-ink/40'>{document.source === 'url' ? <Globe className='h-4 w-4' /> : <FileText className='h-4 w-4' />}</div><div className='min-w-0'><p className='truncate text-sm font-medium text-ink'>{document.name}</p><p className='text-xs text-ink/35'>{document.source} · {new Date(document.createdAt).toLocaleDateString()}</p></div></div><button type='button' onClick={() => void removeDocument(document.id)} className='rounded-lg p-2 text-coral/60 hover:bg-coral/10'><Trash2 className='h-4 w-4' /></button></div>)}</div>}</div>
    </div>
  )
}
