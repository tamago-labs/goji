'use client'

import { motion } from 'framer-motion'

const features = [
  {
    title: 'Arc to Anywhere',
    desc: 'Send and receive USDC from Arc to any supported chain — all from one canvas.'
  },
  {
    title: 'Live Collaboration',
    desc: 'Review and approve payment flows together with your team in real-time.'
  },
  {
    title: 'Non-Custodial',
    desc: 'No central servers, no data collection. P2P by design, non-custodial by default.'
  }
]

export default function Features() {
  return (
    <section className='max-w-[1320px] mx-auto px-13 py-16'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
            className='bg-card rounded-2xl p-6 shadow-[0_4px_20px_rgba(43,36,64,0.06)]'
          >
            <h3 className='font-display text-lg font-semibold mb-2'>{f.title}</h3>
            <p className='text-sm text-ink/60 leading-relaxed'>{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
