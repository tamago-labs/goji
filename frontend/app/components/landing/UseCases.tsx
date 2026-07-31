'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const useCases = [
  {
    title: 'Payments, Simplified.',
    subtitle: 'Manage payroll, contractors, and invoices from one single visual workspace.',
    bullets: [
      'Manage employees, contractors, and vendors',
      'Draw payment flows on a visual canvas',
      'Click connections to set taxes, deductions & terms',
      'Unified Balance for instant USDC payments'
    ]
  },
  {
    title: 'Team Collaboration, AI-Assisted',
    subtitle: 'Work together without exposing data to the cloud. AI empowers every step.',
    bullets: [
      'P2P syncs payment records & documents directly',
      'Private AI assistants with Qwen, Google Gemma',
      'Local RAG powers answers from private docs',
      'Zero cloud exposure'
    ]
  },
  {
    title: 'Payments Meet Capital',
    subtitle: 'Every payment becomes a verifiable financial asset that trusted partners can evaluate.',
    bullets: [
      'Merkle proof for every payment — payroll, contractor, invoice',
      'Cryptographic signatures and audit trail',
      'Permissioned verification of payment records',
      'Connect employers with financing and credit partners'
    ]
  }
]

const image =
  'https://framerusercontent.com/images/xZnqD4ngWlNKrEWyolXWc79DUMs.png?scale-down-to=1024&width=5750&height=3234'

export default function UseCases() {
  return (
    <section id='use-cases' className='max-w-[1320px] mx-auto px-5 md:px-13 py-16'>
      <div className='flex flex-col gap-16 md:gap-24'>
        {useCases.map((useCase, i) => {
          const isReversed = i % 2 !== 0
          return (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
                isReversed ? 'lg:[direction:rtl]' : ''
              }`}
            >
              <div className={isReversed ? 'lg:[direction:ltr]' : ''}>
                <h3 className='font-display text-2xl md:text-3xl font-semibold mb-5 leading-tight'>
                  {useCase.title}
                </h3>
                <p className='text-ink/55 text-[17px] leading-relaxed max-w-[440px] mb-5'>
                  {useCase.subtitle}
                </p>
                <ul className='flex flex-col gap-2.5'>
                  {useCase.bullets.map((bullet) => (
                    <li key={bullet} className='flex items-start gap-2.5 text-[15px] text-ink/60'>
                      <Check className='w-[18px] h-[18px] text-mint mt-0.5 shrink-0' />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className={`rounded-2xl overflow-hidden ${
                  isReversed ? 'lg:[direction:ltr]' : ''
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={`${useCase.title} preview`}
                  className='w-full h-auto'
                />
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
