import Nav from '../components/landing/Nav'

export default function RWALayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='min-h-screen bg-lavender'>
      <Nav />
      <div className='max-w-[1320px] mx-auto px-6 md:px-13 py-8'>
        {children}
      </div>
    </div>
  )
}
