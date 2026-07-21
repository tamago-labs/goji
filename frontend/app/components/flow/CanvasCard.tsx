'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { CARD_WIDTH, CATEGORY_COLORS, type FlowCard } from './types'

interface CanvasCardProps {
  card: FlowCard
  isSelected: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onPortClick: (cardId: string, portType: 'input' | 'output') => void
  connectFrom: string | null
}

export default function CanvasCard({
  card,
  isSelected,
  onSelect,
  onDelete,
  onPortClick,
  connectFrom
}: CanvasCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'card-' + card.id,
    data: { placementId: card.id }
  })

  const colors = CATEGORY_COLORS[card.category]
  const style: React.CSSProperties = {
    position: 'absolute',
    left: card.x,
    top: card.y,
    width: CARD_WIDTH,
    ...(transform ? { transform: CSS.Translate.toString(transform) } : {})
  }

  const canInput = card.category === 'recipient' || card.category === 'gate'
  const canOutput = card.category === 'wallet' || card.category === 'gate'
  const isConnectTarget = connectFrom && connectFrom !== card.id && canInput

  return (
    <div
      ref={setNodeRef}
      data-card
      style={style}
      className={`bg-card rounded-2xl border-l-[3px] shadow-[0_4px_20px_rgba(43,36,64,0.08)] cursor-move select-none ${
        isSelected ? 'ring-2 ring-ink/15' : ''
      } ${isConnectTarget ? 'ring-2 ring-mint/60' : ''}`}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(card.id)
      }}
    >
      {/* Input port */}
      {canInput && (
        <button
          data-port
          className={`absolute -left-[9px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full border-2 border-line bg-card hover:bg-mint hover:border-mint transition-colors z-10 ${
            connectFrom && connectFrom !== card.id ? 'bg-mint/50 border-mint/50 animate-pulse' : ''
          }`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onPortClick(card.id, 'input')
          }}
        />
      )}

      {/* Output port */}
      {canOutput && (
        <button
          data-port
          className='absolute -right-[9px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full border-2 border-line bg-card hover:bg-coral hover:border-coral transition-colors z-10'
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onPortClick(card.id, 'output')
          }}
        />
      )}

      {/* Header */}
      <div className='px-4 pt-3 pb-2'>
        <span
          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors.badge} ${colors.badgeText}`}
        >
          {card.category}
        </span>
      </div>

      {/* Body */}
      <div className='px-4 pb-3'>
        <div className='text-ink text-sm font-medium mb-1'>{card.title}</div>
        {card.category === 'wallet' && (
          <>
            <div className='text-ink/40 text-xs truncate'>{card.fields.address || '0x...'}</div>
            <div className='text-mint text-xs font-medium mt-1'>
              {card.fields.balance || '$0'} USDC
            </div>
          </>
        )}
        {card.category === 'recipient' && (
          <>
            <div className='text-ink/40 text-xs truncate'>{card.fields.address || '0x...'}</div>
            <div className='text-ink/70 text-xs mt-1'>${card.fields.amount || '0'} USDC</div>
            {card.fields.doc && (
              <div className='text-ink/30 text-[10px] mt-0.5'>{card.fields.doc}</div>
            )}
          </>
        )}
        {card.category === 'gate' && (
          <div className='text-coral text-xs font-medium mt-1'>
            {card.fields.required} of {card.fields.total} required
          </div>
        )}
      </div>

      {/* Delete */}
      <button
        className='absolute top-2 right-2 w-5 h-5 rounded-full bg-ink/5 hover:bg-red-500/10 text-ink/30 hover:text-red-500 flex items-center justify-center text-xs transition-colors z-10'
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onDelete(card.id)
        }}
      >
        ×
      </button>
    </div>
  )
}
