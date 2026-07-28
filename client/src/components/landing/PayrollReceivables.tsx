import { motion } from 'framer-motion'

const steps = [
  {
    num: '01',
    title: 'Employee requests an advance',
    desc: 'Access a portion of upcoming salary without waiting for payday.'
  },
  {
    num: '02',
    title: 'Goji verifies payroll',
    desc: 'Employment and salary history create a trusted receivable.'
  },
  {
    num: '03',
    title: 'Pools provide liquidity',
    desc: 'Retail fund diversified pools through payroll-backed RWAs.'
  },
  {
    num: '04',
    title: 'Payroll settles automatically',
    desc: 'On payday, the advance is repaid and retail receive returns.'
  }
]

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
          Turn Future Payroll Into<br />Instant Liquidity
        </h2>
        <p className='text-ink/60 text-[17px] max-w-[520px] mx-auto leading-relaxed'>
          Payroll Receivables let employees access earned income before payday, while retail provide liquidity through diversified pools.
        </p>
      </motion.div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className='bg-card rounded-xl p-5 shadow-[0_2px_12px_rgba(43,36,64,0.05)]'
          >
            <div className='text-[12px] font-semibold text-coral mb-2'>{step.num}</div>
            <div className='text-[15px] font-semibold text-ink mb-1'>{step.title}</div>
            <div className='text-[14px] text-ink/50 leading-relaxed'>{step.desc}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
