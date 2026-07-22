import Logo from '../common/Logo'

export default function Nav() {
  return (
    <nav className='flex items-center justify-between px-13 py-6 max-w-[1320px] mx-auto'>
      <Logo />
      <div className='hidden md:flex gap-8'>
        {[
          { label: 'Product', href: '#use-cases' },
          { label: 'How it works', href: '#how-it-works' },
          { label: 'Supported chains', href: '#supported-chains' },
          { label: 'GitHub', href: 'https://github.com/tamago-labs/goji' }
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className='text-ink/65 text-[15px] font-medium hover:opacity-100 transition-opacity'
            target={item.href.startsWith('http') ? '_blank' : undefined}
            rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {item.label}
          </a>
        ))}
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
