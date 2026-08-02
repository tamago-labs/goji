const { loadModel, unloadModel, GTE_LARGE_FP16, ragIngest, ragSearch, ragDeleteEmbeddings } = require('@qvac/sdk')
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

const WORKSPACE = 'goji-knowledge-base'
const DATA_DIR = path.join(process.env.GOJI_STORAGE || path.join(require('os').homedir(), '.goji'), 'knowledge-base')
const METADATA_FILE = path.join(DATA_DIR, 'documents.json')
let modelId = null
let status = 'unloaded'
let progress = null

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

function loadMetadata() {
  ensureDir()
  try {
    return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'))
  } catch {
    return []
  }
}

function saveMetadata(documents) {
  ensureDir()
  fs.writeFileSync(METADATA_FILE, JSON.stringify(documents, null, 2))
}

async function ensureEmbeddingModel() {
  if (modelId && status === 'ready') return modelId
  status = 'loading'
  try {
    modelId = await loadModel({
      modelSrc: GTE_LARGE_FP16,
      modelType: 'embeddings',
      onProgress: (value) => { progress = value }
    })
    status = 'ready'
    progress = null
    return modelId
  } catch (error) {
    modelId = null
    status = 'unloaded'
    progress = null
    throw error
  }
}

async function unloadEmbeddingModel() {
  if (!modelId) return
  try { await unloadModel({ modelId }) } catch {}
  modelId = null
  status = 'unloaded'
  progress = null
}

function getModelStatus() {
  return { status, progress }
}

function fetchUrlContent(url) {
  return new Promise((resolve) => {
    let parsed
    try { parsed = new URL(url) } catch { resolve({ success: false, error: 'Invalid URL' }); return }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      resolve({ success: false, error: 'Only HTTP and HTTPS URLs are supported' })
      return
    }
    const client = parsed.protocol === 'https:' ? https : http
    const request = client.get(parsed, (response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume()
        resolve({ success: false, error: `HTTP ${response.statusCode}` })
        return
      }
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => { body += chunk })
      response.on('end', () => {
        const text = body
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/\s+/g, ' ')
          .trim()
        resolve(text ? { success: true, content: text } : { success: false, error: 'No text content found' })
      })
    })
    request.setTimeout(15000, () => request.destroy(new Error('Request timed out')))
    request.on('error', (error) => resolve({ success: false, error: error.message }))
  })
}

async function ingestDocument(name, content, source = 'text') {
  const activeModelId = await ensureEmbeddingModel()
  const result = await ragIngest({ modelId: activeModelId, workspace: WORKSPACE, documents: [content], chunk: true, chunkOpts: { chunkSize: 256, chunkOverlap: 50 } })
  const ids = result.processed.filter((item) => item.status === 'fulfilled' && item.id).map((item) => item.id)
  const documents = loadMetadata()
  const document = { id: `doc_${Date.now().toString(36)}`, name, source, createdAt: new Date().toISOString(), qvacIds: ids, chunkCount: ids.length }
  documents.push(document)
  saveMetadata(documents)
  return { success: true, document }
}

async function searchDocuments(query, topK = 5) {
  const activeModelId = await ensureEmbeddingModel()
  const result = await ragSearch({ modelId: activeModelId, workspace: WORKSPACE, query, topK: Math.min(Math.max(Number(topK) || 5, 1), 10) })
  return { success: true, results: (result || []).map((item) => ({ id: item.id, score: item.score, content: item.content })) }
}

async function deleteDocument(id) {
  const documents = loadMetadata()
  const document = documents.find((item) => item.id === id)
  if (!document) return { success: false, error: 'Document not found' }
  if (document.qvacIds?.length) {
    const activeModelId = await ensureEmbeddingModel()
    await ragDeleteEmbeddings({ modelId: activeModelId, workspace: WORKSPACE, ids: document.qvacIds })
  }
  saveMetadata(documents.filter((item) => item.id !== id))
  return { success: true }
}

module.exports = { ensureEmbeddingModel, unloadEmbeddingModel, getModelStatus, fetchUrlContent, ingestDocument, searchDocuments, deleteDocument, listDocuments: loadMetadata }
