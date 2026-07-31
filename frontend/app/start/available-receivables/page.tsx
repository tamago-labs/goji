'use client'

import { Package } from 'lucide-react'

export default function AvailableReceivablesPage() {
  return (
    <div>
      <h2 className='font-display text-xl font-semibold mb-4'>Available Receivables</h2>
      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-8 text-center'>
        <div className='w-12 h-12 bg-ink/5 rounded-full flex items-center justify-center mx-auto mb-4'>
          <Package className='w-6 h-6 text-ink/30' />
        </div>
        <h3 className='font-display text-lg font-semibold text-ink mb-2'>Coming Soon</h3>
        <p className='text-ink/40 text-sm max-w-[400px] mx-auto'>
          Browse verified receivable assets from businesses. Evaluate and fund invoice receivables, payroll advances, and more.
        </p>
      </div>
    </div>
  )
}
