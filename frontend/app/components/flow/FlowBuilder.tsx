'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import Canvas from './Canvas'
import CanvasCard from './CanvasCard'
import CanvasLines from './CanvasLines'
import Toolbar from './Toolbar'
import DocumentDrawer from './DocumentDrawer'
import PreviewRoutesModal from './PreviewRoutesModal'
import FlowOverlay, { type RouteStatus } from './FlowOverlay'
import FloatingChatButton from '../chat/FloatingChatButton'
import { type FlowCard, type Connection, type CardCategory, type IdentitySummary } from './types'

const API = typeof window !== 'undefined'
  ? localStorage.getItem('goji-api-url') || 'http://localhost:3001'
  : 'http://localhost:3001'

let nextId = 1
function genId() {
  return 'card-' + nextId++
}

let connId = 1
function genConnId() {
  return 'conn-' + connId++
}

interface FlowBuilderProps {
  boardId?: string
  initialCards?: FlowCard[]
  initialConnections?: Connection[]
  flowName?: string
}

export default function FlowBuilder({
  boardId,
  initialCards = [],
  initialConnections = [],
  flowName = 'Untitled flow'
}: FlowBuilderProps) {
  const [cards, setCards] = useState<FlowCard[]>(initialCards)
  const [connections, setConnections] = useState<Connection[]>(initialConnections)
  const [selected, setSelected] = useState<string | null>(null)
  const [health, setHealth] = useState<{ name: string; peerId: string; role: string; peers: number } | null>(null)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [name, setName] = useState(flowName)
  const [zoom, setZoom] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
  const [flowStatuses, setFlowStatuses] = useState<RouteStatus[]>([])
  const [flowActive, setFlowActive] = useState(false)
  const [identityByAddress, setIdentityByAddress] = useState<Record<string, IdentitySummary>>({})
  const [selectedIdentity, setSelectedIdentity] = useState<IdentitySummary | null>(null)
  const isLocked = flowActive
  const wsRef = useRef<WebSocket | null>(null)
  const boardIdRef = useRef(boardId)
  const recentCardsRef = useRef<Set<string>>(new Set())
  const router = useRouter()

  // Load data from API on mount
  useEffect(() => {
    if (!boardId) return

    async function load() {
      try {
        const [cardsRes, connsRes, statusRes] = await Promise.all([
          fetch(`${API}/api/cards?boardId=${boardId}`),
          fetch(`${API}/api/connections?boardId=${boardId}`),
          fetch(`${API}/api/flow-status?flowId=${boardId}`)
        ])
        if (cardsRes.ok) {
          const loadedCards = await cardsRes.json()
          if (loadedCards.length > 0) setCards(loadedCards)
        }
        if (connsRes.ok) {
          const loadedConns = await connsRes.json()
          if (loadedConns.length > 0) setConnections(loadedConns)
        }
        if (statusRes.ok) {
          const loadedStatuses = await statusRes.json()
          if (loadedStatuses.length > 0) {
            setFlowStatuses(loadedStatuses)
            setFlowActive(true)
          }
        }
      } catch (err) {
        console.error('[canvas] failed to load:', err)
      }
    }
    load()
  }, [boardId])

  // Fetch health on mount
  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch(`${API}/api/health`)
        if (res.ok) setHealth(await res.json())
      } catch {}
    }
    fetchHealth()
  }, [])

  // Identity details are optional on the canvas and available to company/compliance roles.
  useEffect(() => {
    fetch(`${API}/api/identities/all`).then((response) => response.ok ? response.json() : []).then((rows: IdentitySummary[]) => {
      setIdentityByAddress(Object.fromEntries(rows.map((row) => [row.walletAddress.toLowerCase(), row])))
    }).catch(() => setIdentityByAddress({}))
  }, [])

  // WebSocket for real-time sync
  useEffect(() => {
    if (!API) return
    const wsUrl = API.replace('http', 'ws')
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'card:added' && msg.card.boardId === boardIdRef.current) {
          if (recentCardsRef.current.has(msg.card.id)) {
            recentCardsRef.current.delete(msg.card.id)
            return
          }
          setCards((prev) => {
            if (prev.some((c) => c.id === msg.card.id)) return prev
            return [...prev, msg.card]
          })
        } else if (msg.type === 'card:updated' && msg.id) {
          setCards((prev) =>
            prev.map((c) => (c.id === msg.id ? { ...c, ...msg.patch } : c))
          )
        } else if (msg.type === 'card:deleted' && msg.id) {
          setCards((prev) => prev.filter((c) => c.id !== msg.id))
          setConnections((prev) => prev.filter((c) => c.from !== msg.id && c.to !== msg.id))
        } else if (msg.type === 'connection:added' && msg.connection) {
          setConnections((prev) => {
            if (prev.some((c) => c.id === msg.connection.id)) return prev
            return [...prev, msg.connection]
          })
        } else if (msg.type === 'connection:updated' && msg.id) {
          setConnections((prev) => prev.map((c) => c.id === msg.id ? { ...c, ...msg.patch } : c))
        } else if (msg.type === 'connection:deleted' && msg.id) {
          setConnections((prev) => prev.filter((c) => c.id !== msg.id))
        } else if (msg.type === 'flow-status:updated' && msg.flowStatus) {
          setFlowStatuses((prev) => {
            const exists = prev.find((s) => s.routeId === msg.flowStatus.routeId)
            if (exists) return prev.map((s) => s.routeId === msg.flowStatus.routeId ? { ...s, ...msg.flowStatus } : s)
            return [...prev, msg.flowStatus]
          })
          setFlowActive(true)
        } else if (msg.type === 'flow-status:cleared' && msg.flowId) {
          setFlowStatuses([])
          setFlowActive(false)
        }
      } catch {}
    }

    ws.onclose = () => {
      setTimeout(() => {
        if (wsRef.current === ws) {
          wsRef.current = new WebSocket(wsUrl)
        }
      }, 3000)
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [API])

  const updateCard = useCallback(
    async (id: string, patch: Partial<FlowCard>) => {
      try {
        await fetch(`${API}/api/cards/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patch })
        })
      } catch {}
    },
    [API]
  )

  const deleteCardApi = useCallback(
    async (id: string) => {
      try {
        await fetch(`${API}/api/cards/${id}`, { method: 'DELETE' })
      } catch {}
    },
    [API]
  )

  const deleteConnectionApi = useCallback(
    async (id: string) => {
      try {
        await fetch(`${API}/api/connections/${id}`, { method: 'DELETE' })
      } catch {}
    },
    [API]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { delta, active } = event
      const placementId = active.data.current?.placementId
      if (!placementId) return
      setCards((prev) => {
        const updated = prev.map((c) =>
          c.id === placementId ? { ...c, x: c.x + delta.x, y: c.y + delta.y } : c
        )
        const card = updated.find((c) => c.id === placementId)
        if (card) updateCard(card.id, { x: card.x, y: card.y })
        return updated
      })
    },
    [updateCard]
  )

  const addCard = useCallback(
    async (category: CardCategory) => {
      const templates: Record<CardCategory, { title: string; fields: Record<string, string> }> = {
        wallet: { title: 'Wallet', fields: { address: '', balance: '' } },
        recipient: { title: 'Recipient', fields: { address: '', amount: '', doc: '' } },
        gate: { title: 'Multisig Gate', fields: { required: '2', total: '3' } },
        deposit: { title: 'Deposit Wallet', fields: { address: '', chain: '' } }
      }
      const t = templates[category]

      if (boardId) {
        // Let API + WebSocket handle adding
        try {
          await fetch(`${API}/api/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: genId(),
              category,
              title: t.title,
              x: 200 + Math.random() * 100,
              y: 150 + Math.random() * 100,
              fields: { ...t.fields },
              boardId
            })
          })
          // Card will arrive via WebSocket
        } catch {}
      } else {
        // Offline mode — add locally only
        const card: FlowCard = {
          id: genId(),
          category,
          title: t.title,
          x: 200 + Math.random() * 100,
          y: 150 + Math.random() * 100,
          fields: { ...t.fields }
        }
        setCards((prev) => [...prev, card])
      }
    },
    [boardId, API]
  )

  const addWallet = useCallback(
    async (wallet: { id: string; address: string; name: string | null; verified?: boolean }) => {
      if (boardId) {
        try {
          await fetch(`${API}/api/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: genId(),
              category: 'wallet',
              title: wallet.name || 'Wallet',
              x: 200 + Math.random() * 100,
              y: 150 + Math.random() * 100,
              fields: { address: wallet.address, balance: '', walletId: wallet.id, verified: wallet.verified || false },
              boardId
            })
          })
        } catch {}
      } else {
        const card: FlowCard = {
          id: genId(),
          category: 'wallet',
          title: wallet.name || 'Wallet',
          x: 200 + Math.random() * 100,
          y: 150 + Math.random() * 100,
          fields: { address: wallet.address, balance: '', walletId: wallet.id, verified: wallet.verified || false }
        }
        setCards((prev) => [...prev, card])
      }
    },
    [boardId, API]
  )

  const addRecipient = useCallback(
    async (recipient: { address: string; chain: string; type: 'verified' | 'custom'; name: string }) => {
      const title = recipient.name || (recipient.type === 'verified' ? 'Recipient' : 'Custom Recipient')
      if (boardId) {
        try {
          await fetch(`${API}/api/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: genId(),
              category: 'recipient',
              title,
              x: 200 + Math.random() * 100,
              y: 150 + Math.random() * 100,
              fields: { address: recipient.address, chain: recipient.chain, type: recipient.type, name: recipient.name, amount: '', doc: '' },
              boardId
            })
          })
        } catch {}
      } else {
        const card: FlowCard = {
          id: genId(),
          category: 'recipient',
          title,
          x: 200 + Math.random() * 100,
          y: 150 + Math.random() * 100,
          fields: { address: recipient.address, chain: recipient.chain, type: recipient.type, name: recipient.name, amount: '', doc: '' }
        }
        setCards((prev) => [...prev, card])
      }
    },
    [boardId, API]
  )

  const addDeposit = useCallback(
    async (deposit: { id: string; address: string; chain: string; name: string | null }) => {
      const title = deposit.name || 'Deposit Wallet'
      if (boardId) {
        try {
          await fetch(`${API}/api/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: genId(),
              category: 'deposit',
              title,
              x: 200 + Math.random() * 100,
              y: 150 + Math.random() * 100,
              fields: { address: deposit.address, chain: deposit.chain, balance: '', walletId: deposit.id },
              boardId
            })
          })
        } catch {}
      } else {
        const card: FlowCard = {
          id: genId(),
          category: 'deposit',
          title,
          x: 200 + Math.random() * 100,
          y: 150 + Math.random() * 100,
          fields: { address: deposit.address, chain: deposit.chain, balance: '', walletId: deposit.id }
        }
        setCards((prev) => [...prev, card])
      }
    },
    [boardId, API]
  )

  const deleteCard = useCallback(
    (id: string) => {
      setCards((prev) => prev.filter((c) => c.id !== id))
      setConnections((prev) => prev.filter((c) => c.from !== id && c.to !== id))
      if (selected === id) setSelected(null)
      deleteCardApi(id)
    },
    [selected, deleteCardApi]
  )

  const handlePortClick = useCallback(
    (cardId: string, portType: 'input' | 'output') => {
      if (portType === 'output') {
        setConnectFrom(cardId)
        return
      }
      if (connectFrom && portType === 'input' && connectFrom !== cardId) {
        const fromCard = cards.find((c) => c.id === connectFrom)
        const toCard = cards.find((c) => c.id === cardId)
        if (!fromCard || !toCard) {
          setConnectFrom(null)
          return
        }

        const valid =
          // Pay flow: wallet → recipient
          (fromCard.category === 'wallet' && toCard.category === 'recipient') ||
          // Invoice flow: deposit → wallet
          (fromCard.category === 'deposit' && toCard.category === 'wallet') ||
          // Gate flows
          (fromCard.category === 'wallet' && toCard.category === 'gate') ||
          (fromCard.category === 'gate' && toCard.category === 'recipient')

        if (valid) {
          const exists = connections.some((c) => c.from === connectFrom && c.to === cardId)
          if (!exists) {
            // Invoice flow: deposit → wallet should have document=1
            const isInvoiceFlow = fromCard.category === 'deposit' && toCard.category === 'wallet'
            
            if (boardId) {
              // Let API + WebSocket handle adding
              fetch(`${API}/api/connections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: genConnId(),
                  from: connectFrom,
                  fromPort: 'output',
                  to: cardId,
                  toPort: 'input',
                  boardId,
                  document: isInvoiceFlow ? 1 : undefined
                })
              }).catch(() => {})
            } else {
              // Offline mode
              const conn: Connection = {
                id: genConnId(),
                from: connectFrom,
                fromPort: 'output',
                to: cardId,
                toPort: 'input',
                document: isInvoiceFlow ? 1 : undefined
              }
              setConnections((prev) => [...prev, conn])
            }
          }
        }
        setConnectFrom(null)
      }
    },
    [connectFrom, connections, cards, boardId, API]
  )

  const deleteConnection = useCallback(
    (id: string) => {
      setConnections((prev) => prev.filter((c) => c.id !== id))
      deleteConnectionApi(id)
    },
    [deleteConnectionApi]
  )

  const updateConnection = useCallback(
    async (id: string, patch: Partial<Connection>) => {
      setConnections((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c))
      try {
        await fetch(`${API}/api/connections/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        })
      } catch {}
    },
    [API]
  )

  const onClickConnection = useCallback((conn: Connection) => {
    setSelectedConnection(conn)
  }, [])

  const loadFlowStatuses = useCallback(async () => {
    if (!boardId) return
    try {
      const res = await fetch(`${API}/api/flow-status?flowId=${boardId}`)
      if (res.ok) {
        const statuses = await res.json()
        setFlowStatuses(statuses)
        if (statuses.length > 0) setFlowActive(true)
      }
    } catch {}
  }, [boardId, API])

  const startFlow = useCallback(async () => {
    if (!boardId) return
    // Load existing statuses first (preserves settled routes)
    let existingStatuses: RouteStatus[] = []
    try {
      const existingRes = await fetch(`${API}/api/flow-status?flowId=${boardId}`)
      if (existingRes.ok) existingStatuses = await existingRes.json()
    } catch {}

    const existingMap = new Map(existingStatuses.map((s) => [s.routeId, s]))

    // Create flow status for each connection that has payment or document
    const routeConns = connections.filter((c) => c.payment || c.document)
    const statuses: RouteStatus[] = []
    for (const conn of routeConns) {
      // Skip routes that are already settled
      const existing = existingMap.get(conn.id)
      if (existing && existing.status === 'settled') {
        statuses.push(existing)
        continue
      }
      try {
        const res = await fetch(`${API}/api/flow-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flowId: boardId,
            routeId: conn.id,
            status: 'pending'
          })
        })
        const data = await res.json()
        if (data.skipped) {
          // Route was already settled server-side
          statuses.push({ ...data, status: 'settled' })
        } else {
          statuses.push(data)
        }
      } catch {}
    }
    setFlowStatuses(statuses)
    setFlowActive(true)
  }, [boardId, connections, API])

  const stopFlow = useCallback(async () => {
    if (!boardId) return
    try {
      await fetch(`${API}/api/flow-status/${boardId}`, { method: 'DELETE' })
    } catch {}
    setFlowStatuses([])
    setFlowActive(false)
  }, [boardId, API])

  const handleStatusUpdate = useCallback((status: RouteStatus) => {
    setFlowStatuses((prev) => prev.map((s) => s.routeId === status.routeId ? { ...s, ...status } : s))
  }, [])

  const handleNameChange = useCallback(
    (newName: string) => {
      setName(newName)
      const id = boardIdRef.current
      if (id) {
        fetch(`${API}/api/boards/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName })
        }).catch(() => {})
      }
    },
    [API]
  )

  const deleteBoard = useCallback(async () => {
    if (!boardId) return
    try {
      await fetch(`${API}/api/boards/${boardId}`, { method: 'DELETE' })
      router.push('/start')
    } catch {}
  }, [boardId, API, router])

  return (
    <div className='h-screen flex flex-col bg-lavender'>
      <div className='relative'>
        <Toolbar
          flowName={name}
          onNameChange={handleNameChange}
          onAddWallet={addWallet}
          onAddRecipient={addRecipient}
          onAddDeposit={addDeposit}
          onStart={async () => { await loadFlowStatuses(); setShowPreview(true) }}
          onStop={stopFlow}
          flowActive={flowActive}
          onSettings={() => setShowSettings(true)}
          zoom={zoom}
          onZoomChange={setZoom}
          health={health}
          apiUrl={API}
        />
      </div>

      {connectFrom && (
        <div className='bg-mint/10 border-b border-mint/20 px-4 py-2 text-[#1B7A50] text-xs font-medium flex items-center justify-between'>
          <span>Click an input port to connect — press Esc to cancel</span>
          <button
            onClick={() => setConnectFrom(null)}
            className='text-mint hover:text-[#1B7A50] text-xs'
          >
            Cancel
          </button>
        </div>
      )}

      {isLocked && (
        <div className='bg-blue-50 border-b border-blue-200 px-4 py-2 text-blue-700 text-xs font-medium flex items-center justify-between'>
          <span>Flow active — canvas locked. Sign pending routes from the panel below.</span>
        </div>
      )}

      <div className={`flex-1 relative overflow-hidden ${isLocked ? 'pointer-events-none' : ''}`}>
        <DndContext onDragEnd={handleDragEnd}>
          <Canvas zoom={zoom} onZoomChange={setZoom}>
            <div className='relative'>
              <CanvasLines
                cards={cards}
                connections={connections}
                onDeleteConnection={deleteConnection}
                onClickConnection={onClickConnection}
              />
              {cards.map((card) => (
                <CanvasCard
                  key={card.id}
                  card={card}
                  isSelected={selected === card.id}
                  onSelect={setSelected}
                  onDelete={deleteCard}
                  onPortClick={handlePortClick}
                  connectFrom={connectFrom}
                  locked={isLocked}
                  identity={identityByAddress[String(card.fields.address || '').toLowerCase()]}
                  onIdentityClick={setSelectedIdentity}
                />
              ))}
            </div>
          </Canvas>
        </DndContext>

        {/* Locked overlay */}
        {isLocked && (
          <div className='absolute inset-0 z-30' style={{ background: 'rgba(43,36,64,0.03)', cursor: 'not-allowed' }} />
        )}

        {cards.length === 0 && !isLocked && (
          <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
            <div className='text-center'>
              <div className='text-ink/20 text-lg mb-2'>
                Click &quot;+ Add Card&quot; to start building
              </div>
              <div className='text-ink/10 text-sm'>or choose a template from the start page</div>
            </div>
          </div>
        )}
      </div>

      {/* Flow overlay panel */}
      {isLocked && boardId && (
        <FlowOverlay
          boardId={boardId}
          cards={cards}
          connections={connections}
          flowStatuses={flowStatuses}
          apiUrl={API}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/30 z-50'
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-[0_20px_60px_rgba(43,36,64,0.2)] p-6 w-[380px]'
            >
              <div className='flex items-center justify-between mb-5'>
                <h3 className='font-display text-lg font-semibold'>Board Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'
                >
                  &times;
                </button>
              </div>

              <button
                onClick={deleteBoard}
                className='w-full px-4 py-2.5 bg-coral/10 text-coral text-sm font-medium rounded-xl hover:bg-coral/20 transition-colors'
              >
                Delete Board
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <FloatingChatButton />

      <DocumentDrawer
        isOpen={selectedConnection !== null}
        connection={selectedConnection}
        cards={cards}
        apiUrl={API}
        onClose={() => setSelectedConnection(null)}
        onSave={updateConnection}
      />

      {selectedIdentity && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4' onClick={() => setSelectedIdentity(null)}>
          <div className='w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl' onClick={(event) => event.stopPropagation()}>
            <div className='mb-5 flex items-start justify-between'><div><p className='text-[10px] uppercase tracking-wider text-ink/35'>Wallet identity</p><h3 className='font-display text-lg font-semibold text-ink'>{selectedIdentity.ownerName || 'Workspace member'}</h3></div><button type='button' onClick={() => setSelectedIdentity(null)} className='text-ink/35'>×</button></div>
            <div className='space-y-3 text-xs'><div className='flex items-center justify-between rounded-xl bg-ink/5 p-3'><span className='text-ink/40'>Status</span><span className='font-medium capitalize text-ink'>{selectedIdentity.status}</span></div><div className='flex items-center justify-between rounded-xl bg-ink/5 p-3'><span className='text-ink/40'>Country</span><span className='font-medium text-ink'>{selectedIdentity.countryCode || 'Not provided'}</span></div><div className='rounded-xl bg-ink/5 p-3'><span className='text-ink/40'>Pass ID</span><p className='mt-1 break-all font-mono text-ink/70'>{selectedIdentity.passId}</p></div><div className='rounded-xl bg-ink/5 p-3'><span className='text-ink/40'>Token ID</span><p className='mt-1 font-mono text-ink/70'>{selectedIdentity.tokenId}</p></div></div>
          </div>
        </div>
      )}

      <PreviewRoutesModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onStart={startFlow}
        cards={cards}
        connections={connections}
        flowStatuses={flowStatuses}
        flowActive={flowActive}
      />
    </div>
  )
}
