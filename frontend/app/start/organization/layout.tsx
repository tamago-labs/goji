'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Users, Bot, FileText, Building, ShieldCheck } from 'lucide-react'

const ORG_ITEMS = [
  { href: '/start/organization/profile', label: 'Profile', icon: Building },
  { href: '/start/organization/members', label: 'Members', icon: Users },
  { href: '/start/organization/identities', label: 'Identities', icon: ShieldCheck },
  { href: '/start/organization/templates', label: 'Templates', icon: FileText },
  { href: '/start/organization/ai-assistant', label: 'AI Assistant', icon: Bot },
]

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className='flex gap-8'>
      {/* Nested Sidebar */}
      <div className='w-[160px] flex-shrink-0'>
        <h3 className='text-[11px] text-ink/30 uppercase tracking-wider font-medium px-3 mb-3'>Organization</h3>
        <nav className='space-y-1'>
          {ORG_ITEMS.map((item) => {
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
