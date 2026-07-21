'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

interface ToolbarProps {
  flowName: string
  onNameChange: (name: string) => void
  onAddCard: () => void
  zoom: number
  onZoomChange: (zoom: number) => void
}

export default function Toolbar({
  flowName,
  onNameChange,
  onAddCard,
  zoom,
  onZoomChange
}: ToolbarProps) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  return (
    <div className='flex items-center justify-between px-5 py-3 bg-card border-b border-ink/8'>
      <div className='flex items-center gap-4'>
        <Link href='/start' className='text-ink/40 hover:text-ink/70 text-sm transition-colors'>
          ← Back
        </Link>
        {editing ? (
          <input
            ref={inputRef}
            value={flowName}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
            className='bg-transparent text-ink text-sm font-medium outline-none border-b border-ink/20'
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className='text-ink/70 hover:text-ink text-sm font-medium transition-colors'
          >
            {flowName || 'Untitled flow'}
          </button>
        )}
      </div>

      <div className='flex items-center gap-3'>
        <button
          onClick={onAddCard}
          className='px-3 py-1.5 bg-ink text-lavender text-xs font-medium rounded-xl hover:opacity-90 transition-opacity'
        >
          + Add Card
        </button>

        <div className='flex items-center gap-2 bg-ink/5 rounded-xl px-2 py-1'>
          <button
            onClick={() => onZoomChange(Math.max(0.25, zoom - 0.1))}
            className='text-ink/40 hover:text-ink/70 text-xs transition-colors'
          >
            −
          </button>
          <span className='text-ink/50 text-xs w-10 text-center'>{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => onZoomChange(Math.min(3, zoom + 0.1))}
            className='text-ink/40 hover:text-ink/70 text-xs transition-colors'
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
