'use client'

import { motion } from 'framer-motion'
import {
  NetworkArc,
  NetworkEthereum,
  NetworkArbitrumOne,
  NetworkBase,
  NetworkPolygon,
  NetworkSolana,
  NetworkAvalanche,
  NetworkOptimism,
  NetworkSonic,
  NetworkSeiNetwork,
  NetworkUnichain,
  NetworkWorld
} from '@web3icons/react'

const chains = [
  { name: 'Arc', icon: NetworkArc },
  { name: 'Ethereum', icon: NetworkEthereum },
  { name: 'Arbitrum', icon: NetworkArbitrumOne },
  { name: 'Base', icon: NetworkBase },
  { name: 'Polygon', icon: NetworkPolygon },
  { name: 'Solana', icon: NetworkSolana },
  { name: 'Avalanche', icon: NetworkAvalanche },
  { name: 'Optimism', icon: NetworkOptimism },
  { name: 'Sonic', icon: NetworkSonic },
  { name: 'Sei', icon: NetworkSeiNetwork },
  { name: 'Unichain', icon: NetworkUnichain },
  { name: 'World Chain', icon: NetworkWorld }
]

export default function SupportedChains() {
  return (
    <section className='max-w-[1024px] mx-auto px-6 md:px-13 py-16'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5 }}
        className='text-center mb-10'
      >
        <h2 className='font-display text-3xl md:text-4xl font-semibold mb-3'>
          Send &amp; receive USDC anywhere
        </h2>
        <p className='text-ink/50 text-[17px] max-w-[600px] mx-auto leading-relaxed'>
          Your team can send and receive payments across supported networks
          from one shared payment workspace, powered by Circle App Kits.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className='flex flex-wrap justify-center gap-4'
      >
        {chains.map((chain, i) => {
          const Icon = chain.icon
          return (
            <motion.div
              key={chain.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className='flex items-center gap-2.5 bg-card rounded-2xl px-4 py-3 shadow-[0_2px_12px_rgba(43,36,64,0.05)] hover:shadow-[0_4px_20px_rgba(43,36,64,0.1)] transition-shadow'
            >
              <Icon variant='branded' size={24} />
              <span className='text-sm font-medium text-ink/70'>{chain.name}</span>
            </motion.div>
          )
        })}
      </motion.div>
    </section>
  )
}
