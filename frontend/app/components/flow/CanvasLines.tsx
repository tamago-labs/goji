'use client'

import { CARD_WIDTH, CARD_HEIGHTS, type FlowCard, type Connection } from './types'

interface CanvasLinesProps {
  cards: FlowCard[]
  connections: Connection[]
  onDeleteConnection: (id: string) => void
}

export default function CanvasLines({ cards, connections, onDeleteConnection }: CanvasLinesProps) {
  const cardMap = new Map(cards.map((c) => [c.id, c]))

  return (
    <svg
      className='absolute top-0 left-0 pointer-events-none'
      style={{ overflow: 'visible', width: 4000, height: 4000 }}
    >
      <defs>
        <marker id='arrow' markerWidth='8' markerHeight='8' refX='7' refY='4' orient='auto'>
          <path d='M0,0 L8,4 L0,8' fill='none' stroke='#C97A3D' strokeWidth='1.5' />
        </marker>
      </defs>

      {connections.map((conn) => {
        const from = cardMap.get(conn.from)
        const to = cardMap.get(conn.to)
        if (!from || !to) return null

        const fromH = CARD_HEIGHTS[from.category]
        const toH = CARD_HEIGHTS[to.category]

        const x1 = from.x + CARD_WIDTH
        const y1 = from.y + fromH / 2
        const x2 = to.x
        const y2 = to.y + toH / 2

        const dx = Math.abs(x2 - x1) * 0.5
        const path = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`

        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2

        return (
          <g key={conn.id}>
            {/* Invisible wide hit area */}
            <path
              d={path}
              fill='none'
              stroke='transparent'
              strokeWidth={14}
              className='pointer-events-auto cursor-pointer'
              onClick={() => onDeleteConnection(conn.id)}
            />
            {/* Visible path */}
            <path
              d={path}
              fill='none'
              stroke='#C97A3D'
              strokeWidth={2}
              strokeLinecap='round'
              markerEnd='url(#arrow)'
              opacity={0.6}
            />
            {/* Label */}
            {conn.label && (
              <g>
                <rect
                  x={midX - 40}
                  y={midY - 10}
                  width={80}
                  height={20}
                  rx={10}
                  fill='white'
                  stroke='#C97A3D'
                  strokeWidth={1}
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor='middle'
                  fill='#C97A3D'
                  fontSize={10}
                  fontFamily='monospace'
                >
                  {conn.label} USDC
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
