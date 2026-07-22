'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const hostCmd = 'npx @tamago-labs/goji'
const guestCmd = 'npx @tamago-labs/goji --join'

const hostOutput = [
  { text: 'mode: host', color: 'text-ink/50' },
  { text: '', color: '' },
  { text: '✓ Keet identity ready', color: 'text-[#28C840]' },
  { text: '✓ P2P workspace hosted', color: 'text-[#28C840]' },
  { text: '', color: '' },
  { text: '  invite: yryo3rdcinj5njk...', color: 'text-mint font-medium' },
  { text: '', color: '' },
  { text: 'Ready.', color: 'text-[#28C840] font-medium' }
]

const guestOutput = [
  { text: 'mode: join', color: 'text-ink/50' },
  { text: '', color: '' },
  { text: '  enter invite code: █', color: 'text-ink/60' },
  { text: '', color: '' },
  { text: '✓ Keet identity ready', color: 'text-[#28C840]' },
  { text: '✓ Connected to workspace', color: 'text-[#28C840]' },
  { text: '', color: '' },
  { text: 'Ready.', color: 'text-[#28C840] font-medium' }
]

export default function HowItWorks() {
  const [phase, setPhase] = useState<'host-type' | 'host-output' | 'guest-type' | 'guest-output'>(
    'host-type'
  )
  const [typed, setTyped] = useState('')
  const [visibleLines, setVisibleLines] = useState(0)
  const [guestTyped, setGuestTyped] = useState('')

  // Phase 1: type host command
  useEffect(() => {
    if (phase !== 'host-type') return
    let i = 0
    const interval = setInterval(() => {
      if (i < hostCmd.length) {
        setTyped(hostCmd.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => setPhase('host-output'), 400)
      }
    }, 45)
    return () => clearInterval(interval)
  }, [phase])

  // Phase 2: show host output then switch to guest
  useEffect(() => {
    if (phase !== 'host-output') return
    const timers = hostOutput.map((_, i) =>
      setTimeout(() => setVisibleLines(i + 1), 300 + i * 300)
    )
    const switchTimer = setTimeout(() => {
      setTyped('')
      setVisibleLines(0)
      setPhase('guest-type')
    }, 5000)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(switchTimer)
    }
  }, [phase])

  // Phase 3: type guest command
  useEffect(() => {
    if (phase !== 'guest-type') return
    let i = 0
    const interval = setInterval(() => {
      if (i < guestCmd.length) {
        setGuestTyped(guestCmd.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => setPhase('guest-output'), 400)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [phase])

  // Phase 4: show guest output then reset
  useEffect(() => {
    if (phase !== 'guest-output') return
    const timers = guestOutput.map((_, i) =>
      setTimeout(() => setVisibleLines(i + 1), 300 + i * 300)
    )
    const resetTimer = setTimeout(() => {
      setGuestTyped('')
      setVisibleLines(0)
      setPhase('host-type')
    }, 8000)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(resetTimer)
    }
  }, [phase])

  const showHost = phase === 'host-type' || phase === 'host-output'
  const showGuest = phase === 'guest-type' || phase === 'guest-output'

  return (
    <section className='max-w-[1320px] mx-auto px-6 md:px-13 py-20'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5 }}
        className='text-center mb-12'
      >
        <h2 className='font-display text-3xl md:text-4xl font-semibold mb-4'>
          Run it locally. Collaborate globally.
        </h2>
        <p className='text-ink/60 text-[17px] max-w-[600px] mx-auto leading-relaxed'>
          Launch a workspace from your terminal. Invite teammates over P2P,
          review every payment flow together, and settle with confidence.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className='max-w-[680px] mx-auto'
      >
        <div className='bg-card rounded-2xl shadow-[0_16px_60px_rgba(43,36,64,0.08)] overflow-hidden'>
          <div className='flex items-center gap-2 px-4 py-3 border-b border-ink/8'>
            <span className='w-3 h-3 rounded-full bg-[#FF5F57]' />
            <span className='w-3 h-3 rounded-full bg-[#FEBC2E]' />
            <span className='w-3 h-3 rounded-full bg-[#28C840]' />
          </div>
          <div className='p-5 font-mono text-[13px] leading-[1.9] min-h-[240px]'>
            <AnimatePresence mode='wait'>
              {showHost && (
                <motion.div
                  key='host'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div>
                    <span className='text-coral'>$ </span>
                    <span className='text-ink'>{typed}</span>
                    {phase === 'host-type' && (
                      <span className='inline-block w-[7px] h-[14px] bg-ink/70 animate-pulse ml-0.5 align-middle' />
                    )}
                  </div>
                  {hostOutput.slice(0, visibleLines).map((line, i) => (
                    <div key={i} className={line.color}>
                      {line.text}
                    </div>
                  ))}
                </motion.div>
              )}

              {showGuest && (
                <motion.div
                  key='guest'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div>
                    <span className='text-coral'>$ </span>
                    <span className='text-ink'>{guestTyped}</span>
                    {phase === 'guest-type' && (
                      <span className='inline-block w-[7px] h-[14px] bg-ink/70 animate-pulse ml-0.5 align-middle' />
                    )}
                  </div>
                  {guestOutput.slice(0, visibleLines).map((line, i) => (
                    <div key={i} className={line.color}>
                      {line.text}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
