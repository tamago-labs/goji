'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

interface ToolbarProps {
  flowName: string
  onNameChange: (name: string) => void
  onAddCard: () => void
  onSettings: () => void
  zoom: number
  onZoomChange: (zoom: number) => void
}

export default function Toolbar({
  flowName,
  onNameChange,
  onAddCard,
  onSettings,
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

        <button
          onClick={onSettings}
          className='w-8 h-8 rounded-lg bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-colors'
          title='Settings'
        >
          <svg className='w-4 h-4 text-ink/40' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
          </svg>
        </button>
      </div>
    </div>
  )
}
