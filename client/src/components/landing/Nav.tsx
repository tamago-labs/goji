import { useState, useRef, useEffect } from 'react'
import Logo from '../shared/Logo'

export default function Nav() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = (dropdown: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpenDropdown(dropdown)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenDropdown(null), 150)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <nav className='flex items-center justify-between px-13 py-6 max-w-[1320px] mx-auto'>
      <Logo />
      <div className='hidden md:flex items-center gap-8'>
        <a href='/earn' className='text-ink/65 text-[15px] font-medium hover:opacity-100 transition-opacity'>
          Earn
        </a>
        <div className='relative group'>
          <a href='/payroll' className='text-ink/65 text-[15px] font-medium hover:opacity-100 transition-opacity'>
            Payroll
          </a>
          <div className='absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-ink text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50'>
            P2P terminal required
            <div className='absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-ink rotate-45' />
          </div>
        </div>
        <div className='relative group'>
          <a href='/employees' className='text-ink/65 text-[15px] font-medium hover:opacity-100 transition-opacity'>
            Employees
          </a>
          <div className='absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-ink text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50'>
            P2P terminal required
            <div className='absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-ink rotate-45' />
          </div>
        </div>
        {/* More Dropdown */}
        <div
          className='relative'
          onMouseEnter={() => handleMouseEnter('more')}
          onMouseLeave={handleMouseLeave}
        >
          <button className='flex items-center gap-1.5 text-ink/65 text-[15px] font-medium hover:opacity-100 transition-opacity'>
            More
            <svg
              className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'more' ? 'rotate-180' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </button>
          {openDropdown === 'more' && (
            <div className='absolute top-full left-0 mt-2 w-48 bg-card rounded-xl shadow-[0_8px_30px_rgba(43,36,64,0.12)] py-2 z-50'>
              <a href='#features' className='block px-4 py-2.5 text-sm text-ink/70 hover:bg-ink/[0.05] hover:text-ink transition-colors'>
                Features
              </a>
              <a href='#supported-chains' className='block px-4 py-2.5 text-sm text-ink/70 hover:bg-ink/[0.05] hover:text-ink transition-colors'>
                Supported Chains
              </a>
              <a href='#how-it-works' className='block px-4 py-2.5 text-sm text-ink/70 hover:bg-ink/[0.05] hover:text-ink transition-colors'>
                How It Works
              </a>
              <div className='border-t border-ink/8 my-1' />
              <a
                href='https://github.com/tamago-labs/goji'
                target='_blank'
                rel='noopener noreferrer'
                className='block px-4 py-2.5 text-sm text-ink/70 hover:bg-ink/[0.05] hover:text-ink transition-colors'
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
