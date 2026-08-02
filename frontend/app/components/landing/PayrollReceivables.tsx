'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const permissions = [
  { action: 'Manage workspace & flows', company: true, counterparty: false, partner: false },
  { action: 'Receive payments', company: true, counterparty: true, partner: false },
  { action: 'Approve invoices', company: false, counterparty: true, partner: false },
  { action: 'View documents', company: true, counterparty: 'View own', partner: 'Permissioned' },
  { action: 'Verify proofs', company: true, counterparty: true, partner: true },
  { action: 'Issue receivables', company: true, counterparty: false, partner: false },
  { action: 'Fund receivables', company: false, counterparty: false, partner: true },
  { action: 'On-chain privacy (APS)', company: true, counterparty: true, partner: true, comingSoon: true },
]

function Cell({ value, comingSoon }: { value: boolean | string; comingSoon?: boolean }) {
  if (value === true) {
    return (
      <span className='flex flex-col items-center'>
        <Check className='w-4 h-4 text-[#28C840]' />
        {comingSoon && <span className='text-[9px] text-ink/30 mt-0.5'>coming soon</span>}
      </span>
    )
  }
  if (value === false) {
    return <span className='text-ink/20 mx-auto'>—</span>
  }
  return <span className='text-[12px] text-coral font-medium mx-auto'>{value}</span>
}

export default function PayrollReceivables() {
  return (
    <section className='max-w-[960px] mx-auto px-5 md:px-13 py-16 md:py-20'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5 }}
        className='text-center mb-12'
      >
        <h2 className='font-display text-3xl md:text-4xl font-semibold mb-4'>
          The Origination Lifecycle
        </h2>
        <p className='text-ink/60 text-[17px] max-w-[520px] mx-auto leading-relaxed'>
          Every participant works in the same private payment network. Each settlement creates verifiable proof for RWA origination.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'
      >
        <div className='grid grid-cols-4 border-b border-ink/8'>
          <div className='px-6 py-4 text-sm font-medium text-ink/40'>Permission</div>
          <div className='px-6 py-4 text-sm font-medium text-ink/70 text-center'>Company</div>
          <div className='px-6 py-4 text-sm font-medium text-ink/70 text-center'>Counter-party</div>
          <div className='px-6 py-4 text-sm font-medium text-ink/70 text-center'>Financial Partner</div>
        </div>
        {permissions.map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-4 ${
              i < permissions.length - 1 ? 'border-b border-ink/5' : ''
            }`}
          >
            <div className='px-6 py-4 text-sm text-ink/60'>{row.action}</div>
            <div className='px-6 py-4 flex items-center justify-center'><Cell value={row.company} comingSoon={row.comingSoon} /></div>
            <div className='px-6 py-4 flex items-center justify-center'><Cell value={row.counterparty} comingSoon={row.comingSoon} /></div>
            <div className='px-6 py-4 flex items-center justify-center'><Cell value={row.partner} comingSoon={row.comingSoon} /></div>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
