import Nav from './components/landing/Nav'
import Hero from './components/landing/Hero'
import UseCases from './components/landing/UseCases'
import HowItWorks from './components/landing/HowItWorks'
import Comparison from './components/landing/Comparison'
import SupportedChains from './components/landing/SupportedChains'
import CTA from './components/landing/CTA'
import Footer from './components/landing/Footer'

export default function Home() {
  return (
    <div className='min-h-screen bg-lavender'>
      <Nav />
      <Hero />
      <UseCases />
      <HowItWorks />
      <Comparison />
      <SupportedChains />
      <CTA />
      <Footer />
    </div>
  )
}
