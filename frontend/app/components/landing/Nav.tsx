import Link from 'next/link'

export default function Nav() {
  return (
    <nav className='flex items-center justify-between px-13 py-6 max-w-[1320px] mx-auto'>
      <Link href='/' className='font-display text-2xl font-semibold flex items-center gap-2'>
        <span className='w-[22px] h-[22px] rounded-full bg-mint inline-block' />
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
