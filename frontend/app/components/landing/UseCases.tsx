'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const useCases = [
  {
    title: 'Compliant Payment Workspace',
    subtitle: 'Design payment workflows visually with drag-and-drop. From invoices to contractor payments, every transaction is compliance-ready.',
    bullets: [
      'Merkle proofs anchor every payment and document on Arc',
      'Send instant USDC payments through Unified Balance',
      'Soulbound NFT identity for portable, verifiable credentials',
      'On-chain compliance rules enforced automatically'
    ]
  },
  {
    title: 'Team Collaboration, AI-Assisted',
    subtitle: 'Work together without sending company knowledge to a cloud service. AI-powered insights stay local, powered by your private data.',
    bullets: [
      'Direct P2P sync for records and documents',
      'GTE-Large private knowledge search',
      'Qwen and Gemma-ready AI assistants',
      'Designed for sensitive business workflows'
    ]
  },
  {
    title: 'From Payments to Pooled Assets',
    subtitle: 'Companies issue receivable tokens from verified payments. Financial partners fund them directly, then aggregate into pools for other investors.',
    bullets: [
      'Create receivable assets from settled payments',
      'Financial partners fund individual receivables',
      'Aggregate into pools for diversified investor access',
      'Pro-rata returns based on investment duration on Arc'
    ]
  }
]

const images = [
  '/screenshot-1.png',
  '/screenshot-2.png',
  '/screenshot-3.png'
]

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
                  src={images[i]}
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
