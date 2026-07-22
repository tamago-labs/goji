'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import Canvas from './Canvas'
import CanvasCard from './CanvasCard'
import CanvasLines from './CanvasLines'
import Toolbar from './Toolbar'
import AddCardPopover from './AddCardPopover'
import { type FlowCard, type Connection, type CardCategory } from './types'

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
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [name, setName] = useState(flowName)
  const [zoom, setZoom] = useState(1)
  const [showAddCard, setShowAddCard] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const boardIdRef = useRef(boardId)
  const recentCardsRef = useRef<Set<string>>(new Set())
  const router = useRouter()

  // Load data from API on mount
  useEffect(() => {
    if (!boardId) return

    async function load() {
      try {
        const [cardsRes, connsRes] = await Promise.all([
          fetch(`${API}/api/cards?boardId=${boardId}`),
          fetch(`${API}/api/connections?boardId=${boardId}`)
        ])
        if (cardsRes.ok) {
          const loadedCards = await cardsRes.json()
          if (loadedCards.length > 0) setCards(loadedCards)
        }
        if (connsRes.ok) {
          const loadedConns = await connsRes.json()
          if (loadedConns.length > 0) setConnections(loadedConns)
        }
      } catch (err) {
        console.error('[canvas] failed to load:', err)
      }
    }
    load()
  }, [boardId])

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
        } else if (msg.type === 'connection:deleted' && msg.id) {
          setConnections((prev) => prev.filter((c) => c.id !== msg.id))
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
        gate: { title: 'Multisig Gate', fields: { required: '2', total: '3' } }
      }
      const t = templates[category]

      if (boardId) {
        // Let API + WebSocket handle adding
        try {
          const res = await fetch(`${API}/api/cards`, {
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
          (fromCard.category === 'wallet' &&
            (toCard.category === 'gate' || toCard.category === 'recipient')) ||
          (fromCard.category === 'gate' && toCard.category === 'recipient')

        if (valid) {
          const exists = connections.some((c) => c.from === connectFrom && c.to === cardId)
          if (!exists) {
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
                  boardId
                })
              }).catch(() => {})
            } else {
              // Offline mode
              const conn: Connection = {
                id: genConnId(),
                from: connectFrom,
                fromPort: 'output',
                to: cardId,
                toPort: 'input'
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
          onAddCard={() => setShowAddCard(!showAddCard)}
          onSettings={() => setShowSettings(true)}
          zoom={zoom}
          onZoomChange={setZoom}
        />
        <AddCardPopover
          isOpen={showAddCard}
          onClose={() => setShowAddCard(false)}
          onAdd={addCard}
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

      <div className='flex-1 relative overflow-hidden'>
        <DndContext onDragEnd={handleDragEnd}>
          <Canvas zoom={zoom} onZoomChange={setZoom}>
            <div className='relative'>
              <CanvasLines
                cards={cards}
                connections={connections}
                onDeleteConnection={deleteConnection}
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
                />
              ))}
            </div>
          </Canvas>
        </DndContext>

        {cards.length === 0 && (
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
    </div>
  )
}
