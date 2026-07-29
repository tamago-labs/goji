'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const hostCmd = 'npx @tamago-labs/goji'
const roles = ['Employer', 'Employee', 'Financial Partner']

const hostOutput = [
  { text: '  enter invite code: yryo3rdcinj5njk...', color: 'text-ink/60' },
  { text: '', color: '' },
  { text: '✓ Keet identity ready • P2P workspace connected', color: 'text-[#28C840]' }
]

export default function HowItWorks() {
  const [phase, setPhase] = useState<'host-type' | 'selecting' | 'host-output'>('host-type')
  const [selectedRole, setSelectedRole] = useState(0)
  const [visibleLines, setVisibleLines] = useState(0)

  // Phase 1: show command immediately then start selection
  useEffect(() => {
    if (phase !== 'host-type') return
    const timer = setTimeout(() => setPhase('selecting'), 500)
    return () => clearTimeout(timer)
  }, [phase])

  // Phase 2: cycle through roles
  useEffect(() => {
    if (phase !== 'selecting') return
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step < roles.length) {
        setSelectedRole(step)
      } else {
        clearInterval(interval)
        setTimeout(() => setPhase('host-output'), 600)
      }
    }, 800)
    return () => clearInterval(interval)
  }, [phase])

  // Phase 3: show output then reset
  useEffect(() => {
    if (phase !== 'host-output') return
    const timers = hostOutput.map((_, i) =>
      setTimeout(() => setVisibleLines(i + 1), 300 + i * 300)
    )
    const resetTimer = setTimeout(() => {
      setSelectedRole(0)
      setVisibleLines(0)
      setPhase('host-type')
    }, 10000)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(resetTimer)
    }
  }, [phase])

  const showMenu = phase === 'host-type' || phase === 'selecting'

  return (
    <section id='how-it-works' className='max-w-[1320px] mx-auto px-6 md:px-13 py-20'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5 }}
        className='text-center mb-12'
      >
        <h2 className='font-display text-3xl md:text-4xl font-semibold mb-4'>
          On-chain Payroll, Built P2P
        </h2>
        <p className='text-ink/60 text-[17px] max-w-[600px] mx-auto leading-relaxed'>
          No central server. No shared cloud database. Employers, employees, and financial partners collaborate through a private P2P workspace.
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
              <motion.div
                key='host'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {showMenu && (
                  <>
                    <div>
                      <span className='text-coral'>$ </span>
                      <span className='text-ink'>{hostCmd}</span>
                    </div>
                    <div className='text-ink/60'>? Choose workspace</div>
                    {roles.map((role, i) => (
                      <div key={role}>
                        {i === selectedRole ? (
                          <span className='text-coral font-medium'>❯ {role}</span>
                        ) : (
                          <span className='text-ink/50'>  {role}</span>
                        )}
                      </div>
                    ))}
                  </>
                )}
                {phase === 'host-output' && (
                  <>
                    <div>
                      <span className='text-coral'>$ </span>
                      <span className='text-ink'>{hostCmd}</span>
                    </div>
                    <div className='text-ink/60'>? Choose workspace</div>
                    <div className='text-coral font-medium'>❯ {roles[selectedRole]}</div>
                    {hostOutput.slice(0, visibleLines).map((line, i) => (
                      <div key={i} className={line.color}>
                        {line.text}
                      </div>
                    ))}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
