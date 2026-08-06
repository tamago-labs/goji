'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Logo from '../components/common/Logo'

export default function RWALayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className='min-h-screen bg-lavender'>
      {/* Nav */}
      <nav className='flex items-center justify-between px-6 md:px-13 py-4 max-w-[1320px] mx-auto border-b border-ink/8'>
        <div className='flex items-center gap-8'>
          <Logo />
          <div className='hidden md:flex gap-6 items-center'>
            <Link
              href='/rwa'
              className={`text-[15px] font-medium transition-opacity ${pathname === '/rwa' ? 'text-ink' : 'text-ink/65 hover:opacity-100'}`}
            >
              Pools
            </Link>
            <a
              href='/'
              className='text-[15px] text-ink/65 font-medium hover:opacity-100 transition-opacity'
            >
              Home
            </a>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <ConnectButton />
        </div>
      </nav>

      {/* Content */}
      <div className='max-w-[1320px] mx-auto px-6 md:px-13 py-8'>
        {children}
      </div>
    </div>
  )
}
