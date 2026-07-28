import { motion } from 'framer-motion'

export default function CTA() {
  return (
    <section className='max-w-[960px] mx-auto px-5 md:px-13 py-16 md:py-24'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5 }}
        className='text-center'
      >
        <h2 className='font-display text-3xl md:text-5xl font-semibold mb-5 md:mb-6'>
          Payroll Infrastructure for<br />the Stablecoin Economy
        </h2>
        <p className='text-ink/50 text-[15px] md:text-lg mb-7 md:mb-8 max-w-[500px] mx-auto leading-relaxed'>
          Employers run payroll, employees get paid, retail earns yield — all through one Arc-native infrastructure.
        </p>
        <a
          href='/start'
          className='inline-block bg-ink text-lavender px-6 md:px-8 py-3.5 md:py-4 rounded-3xl text-[15px] md:text-base font-medium hover:opacity-90 transition-opacity'
        >
          Get started now
        </a>
      </motion.div>
    </section>
  )
}
