'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CTA() {
  return (
    <section className='max-w-[960px] mx-auto px-6 md:px-13 py-24'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5 }}
        className='text-center'
      >
        <h2 className='font-display text-4xl md:text-5xl font-semibold mb-6'>
          From Every Payment<br />
          <span className='underline decoration-mint decoration-[6px] underline-offset-[4px]'>
            to RWA Assets
          </span>
        </h2>
        <p className='text-ink/50 text-lg mb-8 max-w-[560px] mx-auto'>
          Settle invoices, payroll, and contractor payments. Each creates verifiable proof for RWA origination.
        </p>
        <Link
          href='/start'
          className='inline-block bg-ink text-lavender px-8 py-4 rounded-3xl text-base font-medium hover:opacity-90 transition-opacity'
        >
          Get started now
        </Link>
      </motion.div>
    </section>
  )
}
