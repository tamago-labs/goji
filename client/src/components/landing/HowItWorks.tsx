import { useState, useEffect } from 'react'

const modes = [
  {
    command: 'npx @tamago-labs/goji',
    role: 'Employee',
    flag: 'none, --guest',
    desc: 'Receive salary, payslips'
  },
  {
    command: 'npx @tamago-labs/goji --host',
    role: 'Employer',
    flag: '--host',
    desc: 'Run payroll, approve'
  },
  {
    command: 'npx @tamago-labs/goji --join',
    role: 'HR / Collaborator',
    flag: '--join',
    desc: 'Review, approve, support'
  }
]

const outputs = [
  ['✓ Keet identity ready', '✓ P2P workspace connected', '  invite: yryo3rdcinj5njk...', 'Ready.'],
  ['✓ Keet identity ready', '✓ Payroll workspace hosted', '  mode: host', 'Ready.'],
  ['✓ Keet identity ready', '✓ Connected to workspace', '  mode: join', 'Ready.']
]

export default function HowItWorks() {
  const [phase, setPhase] = useState<'type' | 'output'>('type')
  const [cmdIndex, setCmdIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    if (phase !== 'type') return
    setTyped('')
    setVisibleLines(0)
    const cmd = modes[cmdIndex].command
    let i = 0
    const interval = setInterval(() => {
      if (i < cmd.length) {
        setTyped(cmd.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => setPhase('output'), 400)
      }
    }, 40)
    return () => clearInterval(interval)
  }, [phase, cmdIndex])

  useEffect(() => {
    if (phase !== 'output') return
    const lines = outputs[cmdIndex]
    const timers = lines.map((_, i) =>
      setTimeout(() => setVisibleLines(i + 1), 300 + i * 300)
    )
    const switchTimer = setTimeout(() => {
      setPhase('type')
      setCmdIndex((prev) => (prev + 1) % modes.length)
    }, 4000)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(switchTimer)
    }
  }, [phase, cmdIndex])

  return (
    <section id='how-it-works' className='max-w-[680px] mx-auto px-5 md:px-13 py-16 md:py-20'>
      <div className='text-center mb-12'>
        <h2 className='font-display text-3xl md:text-4xl font-semibold mb-4'>
          Payroll, Built P2P
        </h2>
        <p className='text-ink/60 text-[17px] max-w-[680px] mx-auto leading-relaxed'>
          Employers, employees, and payroll teams collaborate in a private workspace to manage payments, approvals, and payslips.
        </p>
      </div>

      <div className='bg-card rounded-2xl shadow-[0_16px_60px_rgba(43,36,64,0.08)] overflow-hidden'>
        <div className='flex items-center gap-2 px-4 py-3 border-b border-ink/8'>
          <span className='w-3 h-3 rounded-full bg-[#FF5F57]' />
          <span className='w-3 h-3 rounded-full bg-[#FEBC2E]' />
          <span className='w-3 h-3 rounded-full bg-[#28C840]' />
        </div>
        <div className='p-5 font-mono text-[13px] leading-[1.9] min-h-[180px]'>
          <div>
            <span className='text-coral'>$ </span>
            <span className='text-ink'>{typed}</span>
            {phase === 'type' && (
              <span className='inline-block w-[7px] h-[14px] bg-ink/70 animate-pulse ml-0.5 align-middle' />
            )}
          </div>
          {phase === 'output' && outputs[cmdIndex].slice(0, visibleLines).map((line, i) => (
            <div key={i} className={i === 3 ? 'text-[#28C840] font-medium' : i === 2 ? 'text-mint font-medium' : 'text-[#28C840]'}>
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className='mt-6 flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-center'>
        {modes.map((mode, i) => (
          <div key={i} className={`transition-opacity ${cmdIndex === i ? 'opacity-100' : 'opacity-40'}`}>
            <div className='text-[12px] font-semibold text-ink/50 uppercase tracking-wider mb-1'>{mode.role}</div>
            <div className='text-[12px] text-ink/30 font-mono mb-0.5'>{mode.flag}</div>
            <div className='text-[13px] text-ink/40'>{mode.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
