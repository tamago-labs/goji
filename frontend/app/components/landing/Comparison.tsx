'use client'

import { motion } from 'framer-motion'

const rows = [
  { traditional: 'Disconnected payroll tools', goji: 'Visual payroll canvas' },
  { traditional: 'Cloud-based payroll database', goji: 'Private P2P workspace' },
  { traditional: 'Employee records in silos', goji: 'Connected people, contracts & payslips' },
  { traditional: 'Manual approval workflows', goji: 'Real-time collaborative reviews' },
  { traditional: 'Separate documents & receipts', goji: 'Payroll, documents & proof together' },
  { traditional: 'Manual audit preparation', goji: 'Cryptographic proof on Arc' },
  { traditional: 'Payroll ends after payment', goji: 'Connected financial partners' }
]

export default function Comparison() {
  return (
    <section className='max-w-[960px] mx-auto px-6 md:px-13 py-20'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5 }}
        className='text-center mb-12'
      >
        <h2 className='font-display text-3xl md:text-4xl font-semibold mb-3'>
          Payroll, Verified End-to-End
        </h2>
        <p className='text-ink/50 text-[17px] max-w-[520px] mx-auto leading-relaxed'>
          A shared canvas where payroll, approvals, documents, and settlement stay connected from origin to proof.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'
      >
        <div className='grid grid-cols-2 border-b border-ink/8'>
          <div className='px-6 py-4 text-sm font-medium text-ink/40'>Traditional Payroll</div>
          <div className='px-6 py-4 text-sm font-medium text-ink/70'>Goji</div>
        </div>
        {rows.map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-2 ${
              i < rows.length - 1 ? 'border-b border-ink/5' : ''
            }`}
          >
            <div className='px-6 py-4 text-sm text-ink/50'>{row.traditional}</div>
            <div className='px-6 py-4 text-sm text-ink font-medium'>{row.goji}</div>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
