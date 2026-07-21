'use client'

import Link from 'next/link'

const templates = [
  {
    id: 'simple-payroll',
    title: 'Simple Payroll',
    description: 'One wallet, multiple recipients. Ideal for straightforward team payments.',
    cards: [
      { type: 'wallet', count: 1 },
      { type: 'recipient', count: 4 }
    ]
  },
  {
    id: 'multisig-payroll',
    title: 'Multisig Payroll',
    description:
      'Multiple wallets with a multisig gate. Requires signers to approve before payment.',
    cards: [
      { type: 'wallet', count: 3 },
      { type: 'gate', count: 1 },
      { type: 'recipient', count: 3 }
    ]
  }
]

export default function StartPage() {
  return (
    <div className='min-h-screen bg-lavender'>
      <nav className='flex items-center justify-between px-13 py-6 max-w-[1320px] mx-auto border-b border-ink/8'>
        <Link href='/' className='font-display text-2xl font-semibold flex items-center gap-2'>
          <span className='w-[22px] h-[22px] rounded-full bg-mint inline-block' />
          goji
        </Link>
      </nav>

      <main className='max-w-[960px] mx-auto px-6 py-20'>
        <h1 className='font-display text-4xl font-semibold text-center mb-12'>
          Your payment flows
        </h1>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16'>
          <Link
            href='/flow/new?type=blank'
            className='group bg-card rounded-2xl p-6 shadow-[0_4px_20px_rgba(43,36,64,0.06)] hover:shadow-[0_8px_30px_rgba(43,36,64,0.1)] transition-shadow border-2 border-dashed border-ink/15 hover:border-mint/50 flex flex-col items-center justify-center min-h-[180px]'
          >
            <div className='w-12 h-12 rounded-xl bg-ink/5 group-hover:bg-mint/15 flex items-center justify-center mb-3 transition-colors'>
              <span className='text-2xl text-ink/40 group-hover:text-mint transition-colors'>
                +
              </span>
            </div>
            <span className='font-medium text-ink/70 group-hover:text-ink transition-colors'>
              Blank canvas
            </span>
          </Link>

          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/flow/new?type=${t.id}`}
              className='group bg-card rounded-2xl p-6 shadow-[0_4px_20px_rgba(43,36,64,0.06)] hover:shadow-[0_8px_30px_rgba(43,36,64,0.1)] transition-shadow flex flex-col min-h-[180px]'
            >
              <div className='flex-1'>
                <div className='flex gap-1.5 mb-4'>
                  {t.cards.map((c, i) => (
                    <span
                      key={i}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.type === 'wallet'
                          ? 'bg-mint/20 text-[#1B7A50]'
                          : c.type === 'gate'
                            ? 'bg-coral/20 text-[#C24E33]'
                            : 'bg-violet/20 text-[#5A4FB8]'
                      }`}
                    >
                      {c.count} {c.type}
                      {c.count > 1 ? 's' : ''}
                    </span>
                  ))}
                </div>
                <h3 className='font-display text-lg font-semibold mb-2 group-hover:text-mint transition-colors'>
                  {t.title}
                </h3>
                <p className='text-sm text-ink/50 leading-relaxed'>{t.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <h2 className='font-display text-xl font-semibold mb-4'>Recent flows</h2>
        <div className='bg-card rounded-2xl p-8 shadow-[0_4px_20px_rgba(43,36,64,0.06)] text-center'>
          <p className='text-ink/40 text-sm'>No flows yet. Create your first one above.</p>
        </div>
      </main>
    </div>
  )
}
