export interface KnowledgeDocument {
  id: string
  name: string
  source: string
  createdAt: string
  chunkCount?: number
}

export interface KnowledgeResult {
  id?: string
  score?: number
  content: string
}

export interface KnowledgeModelStatus {
  status: 'unloaded' | 'loading' | 'ready'
  progress?: { percentage?: number } | null
}

async function request<T>(apiUrl: string, path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, options)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`)
  return body as T
}

export const knowledgeApi = {
  model: (apiUrl: string) => request<KnowledgeModelStatus>(apiUrl, '/api/knowledge/model'),
  loadModel: (apiUrl: string) => request<KnowledgeModelStatus>(apiUrl, '/api/knowledge/model/load', { method: 'POST' }),
  unloadModel: (apiUrl: string) => request<KnowledgeModelStatus>(apiUrl, '/api/knowledge/model/unload', { method: 'POST' }),
  documents: (apiUrl: string) => request<KnowledgeDocument[]>(apiUrl, '/api/knowledge/documents'),
  addDocument: (apiUrl: string, input: { name: string; content: string; source: string }) => request(apiUrl, '/api/knowledge/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  }),
  fetchUrl: (apiUrl: string, url: string) => request<{ success: boolean; content: string }>(apiUrl, '/api/knowledge/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  }),
  deleteDocument: (apiUrl: string, id: string) => request(apiUrl, `/api/knowledge/documents/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  search: (apiUrl: string, query: string, topK = 5) => request<{ success: boolean; results: KnowledgeResult[] }>(apiUrl, '/api/knowledge/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, topK })
  })
}
