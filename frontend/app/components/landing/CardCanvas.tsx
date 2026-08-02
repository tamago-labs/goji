'use client'

import { motion } from 'framer-motion'

export default function CardCanvas() {
  // Card positions
  const client = { x: -10, y: 60, w: 120, h: 80 }
  const wallet = { x: 140, y: 160, w: 130, h: 90 }
  const recipient1 = { x: 310, y: 80, w: 120, h: 80 }
  const recipient2 = { x: 310, y: 240, w: 120, h: 80 }

  // Line paths
  const line1 = `M${client.x + client.w},${client.y + client.h / 2} C${client.x + client.w + 40},${client.y + client.h / 2} ${wallet.x - 40},${wallet.y + wallet.h / 2} ${wallet.x},${wallet.y + wallet.h / 2}`
  const line2 = `M${wallet.x + wallet.w},${wallet.y + wallet.h * 0.35} C${wallet.x + wallet.w + 40},${wallet.y + wallet.h * 0.35} ${recipient1.x - 40},${recipient1.y + recipient1.h / 2} ${recipient1.x},${recipient1.y + recipient1.h / 2}`
  const line3 = `M${wallet.x + wallet.w},${wallet.y + wallet.h * 0.65} C${wallet.x + wallet.w + 40},${wallet.y + wallet.h * 0.65} ${recipient2.x - 40},${recipient2.y + recipient2.h / 2} ${recipient2.x},${recipient2.y + recipient2.h / 2}`

  // Label positions (centered between cards)
  const label1 = { x: (client.x + client.w + wallet.x) / 2, y: (client.y + client.h / 2 + wallet.y + wallet.h / 2) / 2 - 15 }
  const label2 = { x: (wallet.x + wallet.w + recipient1.x) / 2, y: (wallet.y + wallet.h * 0.35 + recipient1.y + recipient1.h / 2) / 2 - 15 }
  const label3 = { x: (wallet.x + wallet.w + recipient2.x) / 2, y: (wallet.y + wallet.h * 0.65 + recipient2.y + recipient2.h / 2) / 2 - 15 }

  return (
    <div className='relative h-[400px] w-[440px]'>
      {/* Dot grid */}
      <div className='absolute inset-0 opacity-20' style={{ backgroundImage: 'radial-gradient(circle, #2B244010 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Lines (z-index: 0) */}
      <svg className='absolute inset-0 w-full h-full' viewBox='0 0 440 400' fill='none' style={{ zIndex: 0 }}>
        <motion.path d={line1} stroke='#C97A3D' strokeWidth='2' strokeLinecap='round' opacity='0.5' initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.5 }} />
        <motion.path d={line2} stroke='#C97A3D' strokeWidth='2' strokeLinecap='round' opacity='0.5' initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.9 }} />
        <motion.path d={line3} stroke='#C97A3D' strokeWidth='2' strokeLinecap='round' opacity='0.5' initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 1.1 }} />
      </svg>

      {/* Cards (z-index: 10) */}
      <div style={{ zIndex: 10, position: 'relative' }}>
        {/* Client Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          className='absolute bg-card rounded-xl p-3 shadow-[0_4px_16px_rgba(43,36,64,0.06)] border-l-[3px] border-gray-300'
          style={{ left: client.x, top: client.y, width: client.w }}>
          <span className='text-[8px] font-semibold px-1.5 py-0.5 rounded mb-1.5 bg-gray-100 text-gray-500 uppercase'>Client</span>
          <div className='text-[11px] text-ink/70 font-medium'>Payer</div>
          <div className='text-[9px] text-ink/30 font-mono mt-0.5'>0x3D63...</div>
          <div className='absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#C97A3D] bg-card' />
        </motion.div>

        {/* Wallet Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}
          className='absolute bg-card rounded-xl p-3 shadow-[0_4px_16px_rgba(43,36,64,0.06)] border-l-[3px] border-[#7FD9B0]'
          style={{ left: wallet.x, top: wallet.y, width: wallet.w }}>
          <span className='text-[8px] font-semibold px-1.5 py-0.5 rounded mb-1.5 bg-[#7FD9B0]/20 text-[#1B7A50] uppercase'>Wallet</span>
          <div className='text-[11px] text-ink/70 font-medium'>Company</div>
          <div className='flex items-center gap-1 mt-1'><span className='w-1.5 h-1.5 rounded-full bg-[#28C840]' /><span className='text-[9px] text-[#28C840]'>Verified</span></div>
          <div className='absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#7FD9B0] bg-card' />
          <div className='absolute right-[-6px] top-[35%] w-3 h-3 rounded-full border-2 border-[#C97A3D] bg-card' />
          <div className='absolute right-[-6px] top-[65%] w-3 h-3 rounded-full border-2 border-[#C97A3D] bg-card' />
        </motion.div>

        {/* Recipient 1 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }}
          className='absolute bg-card rounded-xl p-3 shadow-[0_4px_16px_rgba(43,36,64,0.06)] border-l-[3px] border-[#8B7FD6]'
          style={{ left: recipient1.x, top: recipient1.y, width: recipient1.w }}>
          <span className='text-[8px] font-semibold px-1.5 py-0.5 rounded mb-1.5 bg-[#8B7FD6]/20 text-[#5A4FB8] uppercase'>Recipient</span>
          <div className='text-[11px] text-ink/70 font-medium'>Contractor</div>
          <div className='text-[9px] text-ink/30 mt-0.5'>Arc</div>
          <div className='absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#7FD9B0] bg-card' />
        </motion.div>

        {/* Recipient 2 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.8 }}
          className='absolute bg-card rounded-xl p-3 shadow-[0_4px_16px_rgba(43,36,64,0.06)] border-l-[3px] border-[#8B7FD6]'
          style={{ left: recipient2.x, top: recipient2.y, width: recipient2.w }}>
          <span className='text-[8px] font-semibold px-1.5 py-0.5 rounded mb-1.5 bg-[#8B7FD6]/20 text-[#5A4FB8] uppercase'>Recipient</span>
          <div className='text-[11px] text-ink/70 font-medium'>Vendor</div>
          <div className='text-[9px] text-ink/30 mt-0.5'>Arc</div>
          <div className='absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#7FD9B0] bg-card' />
        </motion.div>
      </div>

      {/* Labels (z-index: 20) - on top of everything */}
      <div style={{ zIndex: 20, position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
          className='absolute px-2 py-0.5 bg-white rounded-full border border-[#C97A3D]/30 text-[8px] text-[#C97A3D] font-medium'
          style={{ left: label1.x - 20, top: label1.y }}>Invoice</motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          className='absolute px-2 py-0.5 bg-white rounded-full border border-[#C97A3D]/30 text-[8px] text-[#C97A3D] font-medium'
          style={{ left: label2.x - 20, top: label2.y }}>Payment</motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
          className='absolute px-2 py-0.5 bg-white rounded-full border border-[#C97A3D]/30 text-[8px] text-[#C97A3D] font-medium'
          style={{ left: label3.x - 20, top: label3.y }}>Payment</motion.div>
      </div>
    </div>
  )
}
