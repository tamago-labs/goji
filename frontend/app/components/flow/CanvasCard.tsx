'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { NetworkArc, NetworkBase, NetworkEthereum } from '@web3icons/react'
import { CARD_WIDTH, CATEGORY_COLORS, type FlowCard } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CHAIN_ICONS: Record<string, React.ComponentType<any>> = {
  Arc_Testnet: NetworkArc,
  Base_Sepolia: NetworkBase,
  Ethereum_Sepolia: NetworkEthereum
}

interface CanvasCardProps {
  card: FlowCard
  isSelected: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onPortClick: (cardId: string, portType: 'input' | 'output') => void
  connectFrom: string | null
  locked?: boolean
}

export default function CanvasCard({
  card,
  isSelected,
  onSelect,
  onDelete,
  onPortClick,
  connectFrom,
  locked = false
}: CanvasCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'card-' + card.id,
    data: { placementId: card.id },
    disabled: locked
  })

  const colors = CATEGORY_COLORS[card.category]
  const style: React.CSSProperties = {
    position: 'absolute',
    left: card.x,
    top: card.y,
    width: CARD_WIDTH,
    ...(transform ? { transform: CSS.Translate.toString(transform) } : {})
  }

  // wallet: output + input (can send payments, can receive invoice payments)
  // deposit: output only (sends from Unified Balance)
  // recipient: input only (receives payments)
  // gate: both
  const canInput = card.category === 'wallet' || card.category === 'recipient' || card.category === 'gate'
  const canOutput = card.category === 'wallet' || card.category === 'gate' || card.category === 'deposit'
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
        if (locked) return
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
            {'verified' in card.fields && (
              <span className={`text-[9px] mt-1 inline-block ${card.fields.verified ? 'text-[#28C840]' : 'text-coral'}`}>
                {card.fields.verified ? '● verified' : '○ unverified'}
              </span>
            )}
          </>
        )}
        {card.category === 'recipient' && (
          <>
            <div className='text-ink/40 text-xs truncate'>{card.fields.address || '0x...'}</div>
            {card.fields.chain && (() => {
              const ChainIcon = CHAIN_ICONS[String(card.fields.chain)]
              return (
                <div className='flex items-center gap-1 mt-1'>
                  {ChainIcon && <ChainIcon variant='branded' size={10} />}
                  <span className='text-[10px] text-ink/40'>{String(card.fields.chain).replace('_', ' ')}</span>
                </div>
              )
            })()}
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
        {card.category === 'deposit' && (
          <>
            <div className='text-ink/40 text-xs truncate'>{card.fields.address || '0x...'}</div>
            {card.fields.chain && (() => {
              const ChainIcon = CHAIN_ICONS[String(card.fields.chain)]
              return (
                <div className='flex items-center gap-1 mt-1'>
                  {ChainIcon && <ChainIcon variant='branded' size={10} />}
                  <span className='text-[10px] text-ink/40'>{String(card.fields.chain).replace('_', ' ')}</span>
                </div>
              )
            })()}
          </>
        )}
      </div>

      {/* Delete */}
      {!locked && (
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
      )}
    </div>
  )
}
