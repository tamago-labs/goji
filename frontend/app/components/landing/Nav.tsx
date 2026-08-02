'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Logo from '../common/Logo'

export default function Nav() {
  const [showMore, setShowMore] = useState(false)

  return (
    <nav className='flex items-center justify-between px-13 py-6 max-w-[1320px] mx-auto'>
      <Logo />
      <div className='hidden md:flex gap-8 items-center'>
        <a
          href='/rwa'
          className='text-ink/65 text-[15px] font-medium hover:opacity-100 transition-opacity'
        >
          RWA Explorer
        </a>
        <a
          href='#how-it-works'
          className='text-ink/65 text-[15px] font-medium hover:opacity-100 transition-opacity'
        >
          How to run
        </a>
        <a
          href='#supported-chains'
          className='text-ink/65 text-[15px] font-medium hover:opacity-100 transition-opacity'
        >
          Supported chains
        </a>
        <div className='relative'>
          <button
            onClick={() => setShowMore(!showMore)}
            className='flex items-center gap-1 text-ink/65 text-[15px] font-medium hover:opacity-100 transition-opacity'
          >
            More
            <ChevronDown className={`w-3 h-3 transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </button>
          {showMore && (
            <div className='absolute top-full right-0 mt-2 bg-card rounded-xl shadow-[0_10px_40px_rgba(43,36,64,0.15)] border border-ink/8 py-2 min-w-[150px] z-50'>
              <a
                href='https://github.com/tamago-labs/goji'
                target='_blank'
                rel='noopener noreferrer'
                className='block px-4 py-2 text-sm text-ink/70 hover:bg-ink/5 transition-colors'
              >
                GitHub
              </a>
            </div>
          )}
        </div>
      </div>
      <a
        href='/start'
        className='bg-ink text-lavender px-[22px] py-[11px] rounded-3xl text-sm font-medium hover:opacity-90 transition-opacity'
      >
        Open app
      </a>
    </nav>
  )
}
