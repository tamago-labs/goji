'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    num: '01',
    title: 'Create',
    desc: 'Draft invoice, add documents, send P2P'
  },
  {
    num: '02',
    title: 'Fund & Approve',
    desc: 'Payer tops up Unified Balance, reviews and approves'
  },
  {
    num: '03',
    title: 'Settle on Arc',
    desc: 'USDC payment executed, proof anchored on-chain'
  },
  {
    num: '04',
    title: 'Originate & Finance',
    desc: 'Receivable asset created, financial partners evaluate and fund'
  }
]

export default function InvoiceFlow() {
  return (
    <section className='max-w-[1320px] mx-auto px-6 md:px-13 py-16 md:py-20'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5 }}
        className='text-center mb-12'
      >
        <h2 className='font-display text-3xl md:text-4xl font-semibold mb-4'>
          How an Invoice Becomes Capital
        </h2>
        <p className='text-ink/60 text-[17px] max-w-[600px] mx-auto leading-relaxed'>
          From creation to financing — every step builds verifiable proof on Arc.
        </p>
      </motion.div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className='relative'
          >
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className='hidden md:block absolute top-8 left-[calc(50%+24px)] w-[calc(100%-48px)] h-[2px] bg-ink/10' />
            )}

            <div className='text-center'>
              <div className='w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-4 relative z-10'>
                <span className='text-sm font-semibold text-ink/60'>{step.num}</span>
              </div>
              <h3 className='font-display text-lg font-semibold text-ink mb-2'>{step.title}</h3>
              <p className='text-sm text-ink/50 leading-relaxed'>{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
