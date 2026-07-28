import Nav from './components/landing/Nav'
import Hero from './components/landing/Hero'
import Features from './components/landing/Features'
import HowItWorks from './components/landing/HowItWorks'
import Comparison from './components/landing/Comparison'
import SupportedChains from './components/landing/SupportedChains'
import PayrollReceivables from './components/landing/PayrollReceivables'
import CTA from './components/landing/CTA'
import Footer from './components/landing/Footer'

export default function App() {
  return (
    <div className='min-h-screen bg-lavender'>
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Comparison />
      <SupportedChains />
      <PayrollReceivables />
      <CTA />
      <Footer />
    </div>
  )
}
