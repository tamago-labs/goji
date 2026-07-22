'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const tabs = [
  {
    id: 'payroll',
    label: 'Contributor Payroll',
    title: 'Contributor Payroll',
    description:
      'Turn recurring payroll into a visual payment flow. Import a spreadsheet, review every payment together, then settle salaries in USDC with attached payslips.'
  },
  {
    id: 'treasury',
    label: 'Shared Treasury',
    title: 'Shared Treasury',
    description:
      'Manage a shared wallet with configurable approval rules. Every outgoing payment is reviewed visually before the required signers authorize settlement.'
  },
  {
    id: 'requests',
    label: 'Payment Requests',
    title: 'Payment Requests',
    description:
      'Create payment requests with invoices, contracts, or receipts attached. Teammates review the full payment flow before it becomes an approved USDC transfer.'
  },
  {
    id: 'bonuses',
    label: 'One-Click Conversion',
    title: 'One-Click Conversion',
    description:
      'Convert tokens as part of your flow instead of switching between multiple apps. Swaps become another step on the canvas, reviewed before funds move.'
  }
]

const image =
  'https://framerusercontent.com/images/xZnqD4ngWlNKrEWyolXWc79DUMs.png?scale-down-to=1024&width=5750&height=3234'

export default function UseCases() {
  const [active, setActive] = useState(0)

  return (
    <section className='max-w-[1320px] mx-auto px-5 md:px-13 py-16'>
      <div className='flex justify-center mb-14'>
        <div className='flex flex-wrap justify-center gap-1.5 bg-card rounded-xl md:rounded-full p-3 md:p-1.5 shadow-[0_2px_12px_rgba(43,36,64,0.06)] mx-4 md:mx-0'>
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActive(i)}
              className={`relative px-3 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-3xl text-xs md:text-sm font-medium transition-all ${
                active === i
                  ? 'bg-ink text-lavender shadow-[0_4px_16px_rgba(43,36,64,0.15)]'
                  : 'text-ink hover:bg-ink/[0.05]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[380px] px-4 md:px-10'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <h3 className='font-display text-2xl md:text-3xl font-semibold mb-5 leading-tight'>
              {tabs[active].title}
            </h3>
            <p className='text-ink/55 text-[17px] leading-relaxed max-w-[440px]'>
              {tabs[active].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode='wait'>
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className='rounded-2xl overflow-hidden'
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={`${tabs[active].label} preview`} className='w-full h-auto' />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
