'use client'

import { motion } from 'framer-motion'

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
          Private Payments, Built P2P
        </h2>
        <p className='text-ink/60 text-[17px] max-w-[600px] mx-auto leading-relaxed'>
          Set up payroll, contractor, and invoice workflows directly with counterparties — no intermediary, no cloud, just P2P.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className='max-w-[680px] mx-auto'
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
              npx @tamago-labs/goji
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
