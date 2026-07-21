import Nav from './components/landing/Nav'
import Hero from './components/landing/Hero'
import UseCases from './components/landing/UseCases'
import HowItWorks from './components/landing/HowItWorks'

export default function Home() {
  return (
    <div className='min-h-screen bg-lavender'>
      <Nav />
      <Hero />
      <UseCases />
      <HowItWorks />
    </div>
  )
}
