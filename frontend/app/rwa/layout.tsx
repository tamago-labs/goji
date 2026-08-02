import Logo from '../components/common/Logo'

export default function RWALayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-screen bg-lavender'>
      {/* Simple nav for public page */}
      <nav className='flex items-center justify-between px-6 md:px-13 py-4 max-w-[1320px] mx-auto border-b border-ink/8'>
        <Logo />
        <a
          href='/start'
          className='px-4 py-2 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 transition-opacity'
        >
          Open App
        </a>
      </nav>

      {/* Content */}
      <div className='max-w-[1320px] mx-auto px-6 md:px-13 py-8'>
        {children}
      </div>
    </div>
  )
}
