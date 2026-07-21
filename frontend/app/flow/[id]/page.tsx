'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import FlowBuilder from '../../components/flow/FlowBuilder'
import { type FlowCard, type Connection } from '../../components/flow/types'

const API = typeof window !== 'undefined'
  ? localStorage.getItem('goji-api-url') || 'http://localhost:3001'
  : 'http://localhost:3001'

function getTemplateData(type: string): {
  cards: FlowCard[]
  connections: Connection[]
  name: string
} {
  if (type === 'simple-payroll') {
    return {
      cards: [
        { id: 'card-1', category: 'wallet', title: 'Ops Multisig', x: 100, y: 200, fields: { address: '0x4F...9C1', balance: '18400' } },
        { id: 'card-2', category: 'recipient', title: 'alix.eth', x: 500, y: 80, fields: { address: 'alix.eth', amount: '4200', doc: 'q3-alix.pdf' } },
        { id: 'card-3', category: 'recipient', title: '0x88...2b', x: 500, y: 220, fields: { address: '0x88...2b', amount: '2800', doc: '' } },
        { id: 'card-4', category: 'recipient', title: 'devon.eth', x: 500, y: 360, fields: { address: 'devon.eth', amount: '1900', doc: 'payslip.pdf' } },
        { id: 'card-5', category: 'recipient', title: 'nova.eth', x: 500, y: 500, fields: { address: 'nova.eth', amount: '3100', doc: '' } }
      ],
      connections: [
        { id: 'conn-1', from: 'card-1', fromPort: 'output', to: 'card-2', toPort: 'input', label: '4200' },
        { id: 'conn-2', from: 'card-1', fromPort: 'output', to: 'card-3', toPort: 'input', label: '2800' },
        { id: 'conn-3', from: 'card-1', fromPort: 'output', to: 'card-4', toPort: 'input', label: '1900' },
        { id: 'conn-4', from: 'card-1', fromPort: 'output', to: 'card-5', toPort: 'input', label: '3100' }
      ],
      name: 'Simple Payroll'
    }
  }

  if (type === 'multisig-payroll') {
    return {
      cards: [
        { id: 'card-1', category: 'wallet', title: 'Treasury', x: 50, y: 80, fields: { address: '0x11...aa', balance: '50000' } },
        { id: 'card-2', category: 'wallet', title: 'Operations', x: 50, y: 240, fields: { address: '0x22...bb', balance: '12000' } },
        { id: 'card-3', category: 'wallet', title: 'Rewards', x: 50, y: 400, fields: { address: '0x33...cc', balance: '8000' } },
        { id: 'card-4', category: 'gate', title: 'Multisig Gate', x: 380, y: 220, fields: { required: '2', total: '3' } },
        { id: 'card-5', category: 'recipient', title: 'alix.eth', x: 700, y: 120, fields: { address: 'alix.eth', amount: '4200', doc: '' } },
        { id: 'card-6', category: 'recipient', title: 'devon.eth', x: 700, y: 280, fields: { address: 'devon.eth', amount: '1900', doc: '' } },
        { id: 'card-7', category: 'recipient', title: 'nova.eth', x: 700, y: 440, fields: { address: 'nova.eth', amount: '3100', doc: '' } }
      ],
      connections: [
        { id: 'conn-1', from: 'card-1', fromPort: 'output', to: 'card-4', toPort: 'input' },
        { id: 'conn-2', from: 'card-2', fromPort: 'output', to: 'card-4', toPort: 'input' },
        { id: 'conn-3', from: 'card-3', fromPort: 'output', to: 'card-4', toPort: 'input' },
        { id: 'conn-4', from: 'card-4', fromPort: 'output', to: 'card-5', toPort: 'input', label: '4200' },
        { id: 'conn-5', from: 'card-4', fromPort: 'output', to: 'card-6', toPort: 'input', label: '1900' },
        { id: 'conn-6', from: 'card-4', fromPort: 'output', to: 'card-7', toPort: 'input', label: '3100' }
      ],
      name: 'Multisig Payroll'
    }
  }

  return { cards: [], connections: [], name: 'Untitled flow' }
}

export default function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [boardId, setBoardId] = useState<string | null>(null)
  const [initialCards, setInitialCards] = useState<FlowCard[]>([])
  const [initialConnections, setInitialConnections] = useState<Connection[]>([])
  const [flowName, setFlowName] = useState('Untitled flow')
  const [loading, setLoading] = useState(true)
  const createdRef = useRef(false)

  useEffect(() => {
    if (createdRef.current) return
    createdRef.current = true

    async function init() {
      if (id === 'new') {
        // Creating new board from URL params
        const urlParams = new URLSearchParams(window.location.search)
        const type = urlParams.get('type') || 'blank'
        const template = getTemplateData(type)

        try {
          const res = await fetch(`${API}/api/boards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: template.name })
          })
          if (res.ok) {
            const board = await res.json()
            setBoardId(board.id)
            setFlowName(board.name)

            // Create template cards and connections
            for (const card of template.cards) {
              await fetch(`${API}/api/cards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...card, boardId: board.id })
              })
            }
            for (const conn of template.connections) {
              await fetch(`${API}/api/connections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...conn, boardId: board.id })
              })
            }

            setInitialCards(template.cards)
            setInitialConnections(template.connections)

            // Replace URL without re-render
            window.history.replaceState(null, '', `/flow/${board.id}`)
          }
        } catch (err) {
          console.error('[flow] failed to create board:', err)
        }
      } else {
        // Loading existing board
        setBoardId(id)
        try {
          const boardRes = await fetch(`${API}/api/boards`)
          if (boardRes.ok) {
            const boards = await boardRes.json()
            const board = boards.find((b: { id: string }) => b.id === id)
            if (board) setFlowName(board.name)
          }
        } catch {}
      }
      setLoading(false)
    }
    init()
  }, [id, API])

  if (loading) {
    return (
      <div className='h-screen flex items-center justify-center bg-lavender'>
        <div className='w-6 h-6 border-2 border-ink/20 border-t-ink/60 rounded-full animate-spin' />
      </div>
    )
  }

  return (
    <FlowBuilder
      boardId={boardId || undefined}
      initialCards={initialCards}
      initialConnections={initialConnections}
      flowName={flowName}
    />
  )
}
