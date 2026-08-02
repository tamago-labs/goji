'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp, List, PlusCircle } from 'lucide-react'

const RECEIVABLE_ITEMS = [
  { href: '/start/receivables/list', label: 'My Receivables', icon: List },
  { href: '/start/receivables/create', label: 'Create New', icon: PlusCircle },
]

export default function ReceivablesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className='flex gap-8'>
      {/* Nested Sidebar */}
      <div className='w-[160px] flex-shrink-0'>
        <h3 className='text-[11px] text-ink/30 uppercase tracking-wider font-medium px-3 mb-3'>Receivables</h3>
        <nav className='space-y-1'>
          {RECEIVABLE_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-ink text-lavender' : 'text-ink/60 hover:bg-ink/5'}`}
              >
                <item.icon className='w-4 h-4' />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className='flex-1 min-w-0'>
        {children}
      </div>
    </div>
  )
}
