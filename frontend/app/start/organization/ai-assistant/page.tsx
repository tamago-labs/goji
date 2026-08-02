'use client'

import { Bot } from 'lucide-react'

export default function AIAssistantPage() {
  return (
    <div>
      <h2 className='font-display text-xl font-semibold mb-4'>AI Assistant</h2>
      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-8 text-center'>
        <div className='w-12 h-12 bg-ink/5 rounded-full flex items-center justify-center mx-auto mb-4'>
          <Bot className='w-6 h-6 text-ink/30' />
        </div>
        <h3 className='font-display text-lg font-semibold text-ink mb-2'>Coming Soon</h3>
        <p className='text-ink/40 text-sm max-w-[400px] mx-auto'>
          Private AI assistant for payroll management. Ask questions about your payroll data, generate payslips, and analyze payments — all locally.
        </p>
      </div>
    </div>
  )
}
