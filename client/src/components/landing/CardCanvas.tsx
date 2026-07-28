import { motion } from 'framer-motion'

const cardVariants = [
  { initial: { opacity: 0, y: 30, rotate: -2 }, rotate: '-2deg' },
  { initial: { opacity: 0, y: 30, rotate: 2 }, rotate: '2deg' },
  { initial: { opacity: 0, y: 30, rotate: -1 }, rotate: '-1deg' }
]

const pools = [
  {
    color: 'bg-mint/25 text-[#1B7A50]',
    dot: 'bg-[#1B7A50]',
    name: '30-Day Payroll Receivables',
    token: 'GOJI30',
    apy: '8-12%',
    tvl: '$820K',
    tvlWidth: 'w-[65%]'
  },
  {
    color: 'bg-violet/20 text-[#5A4FB8]',
    dot: 'bg-[#5A4FB8]',
    name: '60-Day Payroll Receivables',
    token: 'GOJI60',
    apy: '10-14%',
    tvl: '$1.1M',
    tvlWidth: 'w-[85%]'
  },
  {
    color: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-700',
    name: '90-Day Payroll Receivables',
    token: 'GOJI90',
    apy: '12-16%',
    tvl: '$480K',
    tvlWidth: 'w-[45%]'
  }
]

export default function CardCanvas() {
  return (
    <div className='relative h-[380px] flex flex-col items-center justify-center gap-5'>
      {pools.map((pool, i) => (
        <motion.div
          key={i}
          initial={cardVariants[i].initial}
          animate={{ opacity: 1, y: 0, rotate: parseFloat(cardVariants[i].rotate) }}
          transition={{ duration: 0.5, delay: 0.4 + i * 0.15, ease: 'easeOut' }}
          className={`w-[340px] bg-card rounded-2xl p-4 shadow-[0_10px_30px_rgba(43,36,64,0.08)] ${
            i === 1 ? 'ml-8' : i === 2 ? '-ml-4' : ''
          }`}
          style={{ rotate: cardVariants[i].rotate }}
        >
          <div className='flex items-center gap-2 mb-3'>
            <span className={`w-2 h-2 rounded-full ${pool.dot}`} />
            <span className='text-[13px] font-semibold text-ink'>{pool.name}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[8px] ${pool.color}`}>
              {pool.token}
            </span>
          </div>
          <div className='flex items-center justify-between mb-2'>
            <div>
              <span className='text-[11px] text-ink/50'>APY</span>
              <div className='text-[15px] font-semibold text-ink'>{pool.apy}</div>
            </div>
            <div className='text-right'>
              <span className='text-[11px] text-ink/50'>TVL</span>
              <div className='text-[15px] font-semibold text-ink'>{pool.tvl}</div>
            </div>
          </div>
          <div className='h-1.5 bg-ink/5 rounded-full overflow-hidden'>
            <div className={`h-full bg-gradient-to-r from-mint to-violet rounded-full ${pool.tvlWidth}`} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
