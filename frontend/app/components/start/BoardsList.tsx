'use client'

import Link from 'next/link'

const templates = [
  {
    id: 'simple-payroll',
    title: 'Simple Payroll',
    description: 'One wallet, multiple recipients. Ideal for straightforward team payments.',
    cards: [
      { type: 'wallet', count: 1 },
      { type: 'recipient', count: 4 }
    ]
  },
  {
    id: 'multisig-payroll',
    title: 'Multisig Payroll',
    description:
      'Multiple wallets with a multisig gate. Requires signers to approve before payment.',
    cards: [
      { type: 'wallet', count: 3 },
      { type: 'gate', count: 1 },
      { type: 'recipient', count: 3 }
    ]
  }
]

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
      <h2 className='font-display text-xl font-semibold mb-4'>Boards</h2>
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Active boards first */}
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

        {/* Blank canvas */}
        <Link
          href='/flow/new?type=blank'
          className='group bg-card rounded-2xl p-6 shadow-[0_4px_20px_rgba(43,36,64,0.06)] hover:shadow-[0_8px_30px_rgba(43,36,64,0.1)] transition-shadow border-2 border-dashed border-ink/15 hover:border-mint/50 flex flex-col items-center justify-center min-h-[180px]'
        >
          <div className='w-12 h-12 rounded-xl bg-ink/5 group-hover:bg-mint/15 flex items-center justify-center mb-3 transition-colors'>
            <span className='text-2xl text-ink/40 group-hover:text-mint transition-colors'>+</span>
          </div>
          <span className='font-medium text-ink/70 group-hover:text-ink transition-colors'>
            Blank canvas
          </span>
        </Link>

        {/* Templates */}
        {templates.map((t) => (
          <Link
            key={t.id}
            href={`/flow/new?type=${t.id}`}
            className='group bg-card rounded-2xl p-6 shadow-[0_4px_20px_rgba(43,36,64,0.06)] hover:shadow-[0_8px_30px_rgba(43,36,64,0.1)] transition-shadow flex flex-col min-h-[180px]'
          >
            <div className='flex-1'>
              <div className='flex gap-1.5 mb-4'>
                <span className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-coral/20 text-[#C24E33]'>
                  template
                </span>
              </div>
              <h3 className='font-display text-lg font-semibold mb-2 group-hover:text-mint transition-colors'>
                {t.title}
              </h3>
              <p className='text-sm text-ink/50 leading-relaxed'>{t.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
