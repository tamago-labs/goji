'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

interface Board {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

interface BoardsGridProps {
  boards: Board[]
  disabled: boolean
}

export default function BoardsGrid({ boards, disabled }: BoardsGridProps) {
  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-display text-xl font-semibold'>Boards</h2>
        <Link
          href='/flow/new?type=blank'
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-ink text-lavender text-xs font-medium rounded-xl hover:opacity-90 transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Plus className='w-3.5 h-3.5' />
          New Flow
        </Link>
      </div>

      {boards.length === 0 ? (
        <div className='bg-card rounded-2xl p-8 shadow-[0_4px_20px_rgba(43,36,64,0.06)] text-center'>
          <p className='text-ink/40 text-sm'>No flows yet. Create your first one above.</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/flow/${board.id}`}
              className='group bg-card rounded-2xl p-6 shadow-[0_4px_20px_rgba(43,36,64,0.06)] hover:shadow-[0_8px_30px_rgba(43,36,64,0.1)] transition-shadow flex flex-col min-h-[180px]'
            >
              <div className='flex-1'>
                <div className='flex gap-1.5 mb-4'>
                  <span className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-mint/20 text-[#1B7A50]'>
                    board
                  </span>
                </div>
                <h3 className='font-display text-lg font-semibold mb-2 group-hover:text-mint transition-colors'>
                  {board.name}
                </h3>
                <p className='text-sm text-ink/50 leading-relaxed'>
                  Created {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
