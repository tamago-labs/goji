'use client'

import { motion } from 'framer-motion'
import { Terminal, Users, LayoutGrid } from 'lucide-react'

const steps = [
  {
    icon: Terminal,
    title: 'Install Terminal',
    desc: 'Run one command to start your P2P workspace'
  },
  {
    icon: Users,
    title: 'Invite Partners',
    desc: 'Share invite code to connect contractors and partners'
  },
  {
    icon: LayoutGrid,
    title: 'Build Flows',
    desc: 'Draw payment workflows on the visual canvas'
  }
]

export default function HowItWorks() {
  return (
    <section id='how-it-works' className='max-w-[1320px] mx-auto px-6 md:px-13 py-20'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5 }}
        className='text-center mb-12'
      >
        <h2 className='font-display text-3xl md:text-4xl font-semibold mb-4'>
          Get Started in Minutes
        </h2>
        <p className='text-ink/60 text-[17px] max-w-[600px] mx-auto leading-relaxed'>
          Set up your P2P workspace and start building payment flows.
        </p>
      </motion.div>

      {/* Terminal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className='max-w-[680px] mx-auto mb-12'
      >
        <div className='bg-card rounded-2xl shadow-[0_16px_60px_rgba(43,36,64,0.08)] overflow-hidden'>
          <div className='flex items-center gap-2 px-4 py-3 border-b border-ink/8'>
            <span className='w-3 h-3 rounded-full bg-[#FF5F57]' />
            <span className='w-3 h-3 rounded-full bg-[#FEBC2E]' />
            <span className='w-3 h-3 rounded-full bg-[#28C840]' />
          </div>
          <div className='p-6 font-mono text-center'>
            <div className='text-lg md:text-xl text-ink font-medium'>
              <span className='text-coral'>$ </span>
              npx @tamago-labs/goji --join
            </div>
          </div>
        </div>
      </motion.div>

      {/* Steps */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[900px] mx-auto'>
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className='text-center'
          >
            <div className='w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-4'>
              <step.icon className='w-5 h-5 text-ink/40' />
            </div>
            <h3 className='font-display text-lg font-semibold text-ink mb-2'>{step.title}</h3>
            <p className='text-sm text-ink/50 leading-relaxed'>{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
