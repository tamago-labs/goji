'use client'

import Link from 'next/link'

interface Board {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

interface BoardsListProps {
  boards: Board[]
}

export default function BoardsList({ boards }: BoardsListProps) {
  return (
    <div>
      <h2 className='font-display text-xl font-semibold mb-4'>Active boards</h2>
      {boards.length === 0 ? (
        <div className='bg-card rounded-2xl p-8 shadow-[0_4px_20px_rgba(43,36,64,0.06)] text-center mb-12'>
          <p className='text-ink/40 text-sm'>No boards yet. Create one below.</p>
        </div>
      ) : (
        <div className='space-y-3 mb-12'>
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/flow/${board.id}`}
              className='bg-card rounded-2xl p-5 shadow-[0_4px_20px_rgba(43,36,64,0.06)] hover:shadow-[0_8px_30px_rgba(43,36,64,0.1)] transition-shadow flex items-center justify-between'
            >
              <div>
                <h3 className='font-medium text-ink text-sm'>{board.name}</h3>
                <p className='text-xs text-ink/30 mt-1'>
                  Created {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className='text-ink/20 text-sm'>&rarr;</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
