import Link from 'next/link'

function LogoDot() {
  return (
    <span className='relative w-[22px] h-[22px] rounded-full bg-mint inline-block overflow-hidden'>
      <span
        className='absolute w-[6px] h-[6px] rounded-full bg-coral top-1/2 left-1/2'
        style={{
          animation: 'marble-orbit 2.5s ease-in-out 1 forwards',
        }}
      />
    </span>
  )
}

export default function Nav() {
  return (
    <nav className='flex items-center justify-between px-13 py-6 max-w-[1320px] mx-auto'>
      <Link href='/' className='font-display text-2xl font-semibold flex items-center gap-2'>
        <LogoDot />
        goji
      </Link>
      <div className='hidden md:flex gap-8'>
        {['Product', 'How it works', 'For DAOs', 'Docs'].map((item) => (
          <a
            key={item}
            href='#'
            className='text-ink/65 text-[15px] font-medium hover:opacity-100 transition-opacity'
          >
            {item}
          </a>
        ))}
      </div>
      <Link
        href='/start'
        className='bg-ink text-lavender px-[22px] py-[11px] rounded-3xl text-sm font-medium hover:opacity-90 transition-opacity'
      >
        Try it free
      </Link>
    </nav>
  )
}
