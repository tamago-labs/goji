'use client'

import { CARD_TEMPLATES, CATEGORY_COLORS, type CardCategory } from './types'

interface AddCardPopoverProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (category: CardCategory) => void
}

export default function AddCardPopover({ isOpen, onClose, onAdd }: AddCardPopoverProps) {
  if (!isOpen) return null

  return (
    <>
      <div className='fixed inset-0 z-40' onClick={onClose} />
      <div className='absolute top-14 right-4 z-50 bg-card border border-line rounded-2xl shadow-[0_16px_40px_rgba(43,36,64,0.12)] p-2 w-52'>
        {CARD_TEMPLATES.map((t) => {
          const colors = CATEGORY_COLORS[t.category]
          return (
            <button
              key={t.category}
              onClick={() => {
                onAdd(t.category)
                onClose()
              }}
              className='w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink/[0.03] transition-colors text-left'
            >
              <div
                className='w-8 h-8 rounded-lg flex items-center justify-center'
                style={{ backgroundColor: colors.border + '20' }}
              >
                <span className='text-xs font-bold' style={{ color: colors.border }}>
                  {t.category[0].toUpperCase()}
                </span>
              </div>
              <div>
                <div className='text-ink text-sm font-medium'>{t.title}</div>
                <div className='text-ink/40 text-[10px] capitalize'>{t.category}</div>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}
