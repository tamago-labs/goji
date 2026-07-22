import Logo from '../common/Logo'

export default function Footer() {
  return (
    <footer className='border-t border-ink/8 py-6 px-6 md:px-13'>
      <div className='max-w-[1320px] mx-auto flex items-center justify-between'>
        <Logo size='small' />
        <span className='text-xs text-ink/30'>
          &copy; {new Date().getFullYear()} Tamago Labs
        </span>
      </div>
    </footer>
  )
}
