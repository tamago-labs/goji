'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NetworkArc, NetworkBase, NetworkEthereum } from '@web3icons/react'
import { type FlowCard, type Connection } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CHAIN_ICONS: Record<string, React.ComponentType<any>> = {
  Arc_Testnet: NetworkArc,
  Base_Sepolia: NetworkBase,
  Ethereum_Sepolia: NetworkEthereum
}

const CHAIN_LABELS: Record<string, string> = {
  Arc_Testnet: 'Arc Testnet',
  Base_Sepolia: 'Base Sepolia',
  Ethereum_Sepolia: 'Ethereum Sepolia'
}

interface Template {
  id: string
  name: string
  companyName: string | null
  fields: { key: string; label: string; type: string; autoFill: boolean }[]
  html: string
}

interface InvoiceDrawerProps {
  isOpen: boolean
  connection: Connection | null
  cards: FlowCard[]
  apiUrl: string
  onClose: () => void
  onSave: (id: string, patch: Partial<Connection>) => void
}

function renderTemplate(html: string, vars: Record<string, string>): string {
  let result = html
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

export default function InvoiceDrawer({ isOpen, connection, cards, apiUrl, onClose, onSave }: InvoiceDrawerProps) {
  const [amount, setAmount] = useState('')
  const [document, setDocument] = useState(true)
  const [templateId, setTemplateId] = useState('')
  const [docName, setDocName] = useState('')
  const [templates, setTemplates] = useState<Template[]>([])
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})

  const fromCard = connection ? cards.find((c) => c.id === connection.from) : null
  const toCard = connection ? cards.find((c) => c.id === connection.to) : null

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch(`${apiUrl}/api/templates`)
        if (res.ok) {
          const data = await res.json()
          setTemplates(data)
          if (data.length > 0 && !templateId) {
            setTemplateId(data[0].id)
          }
        }
      } catch {}
    }
    loadTemplates()
  }, [apiUrl])

  useEffect(() => {
    if (connection) {
      console.log('[InvoiceDrawer] connection:', connection)
      setAmount(connection.amount || '')
      setDocument(!!connection.document)
      setTemplateId(connection.template || (templates.length > 0 ? templates[0].id : ''))
      setDocName(connection.docName || '')
      
      // Parse custom field values from customDoc
      if (connection.customDoc) {
        try {
          const parsed = JSON.parse(connection.customDoc)
          setFieldValues(parsed)
        } catch {
          setFieldValues({})
        }
      } else {
        setFieldValues({})
      }
    }
  }, [connection, templates])

  const selectedTemplate = templates.find((t) => t.id === templateId) || templates[0]

  const previewHtml = selectedTemplate ? renderTemplate(selectedTemplate.html, {
    company: selectedTemplate.companyName || 'Company',
    amount: amount || '0',
    sender: fromCard?.title || 'Wallet',
    recipient: toCard?.title || 'Recipient',
    date: new Date().toLocaleDateString(),
    txHash: connection?.txHash || 'Pending...',
    ...fieldValues
  }) : '<div style="padding:40px;text-align:center;color:#999">Loading template...</div>'

  const handleSave = async () => {
    if (!connection) return
    
    // Save custom field values as JSON in customDoc
    const customDocJson = Object.keys(fieldValues).length > 0 ? JSON.stringify(fieldValues) : null
    
    const patch = {
      amount: amount || undefined,
      payment: 0,
      document: 1,
      template: templateId || undefined,
      docName: docName || selectedTemplate?.name || undefined,
      customDoc: customDocJson
    }
    
    console.log('[InvoiceDrawer] saving:', patch)
    onSave(connection.id, patch)
    onClose()
  }

  const dynamicFields = selectedTemplate?.fields?.filter((f) => !f.autoFill) || []

  return (
    <AnimatePresence>
      {isOpen && connection && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/30 z-50'
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-[0_20px_60px_rgba(43,36,64,0.2)] w-[720px] max-h-[85vh] overflow-hidden flex flex-col'
          >
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-ink/8'>
              <div className='flex items-center gap-3'>
                <div className='flex items-center gap-2 text-sm'>
                  <span className='font-medium text-ink'>{fromCard?.title || 'Deposit Wallet'}</span>
                  <svg className='w-4 h-4 text-ink/30' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M14 5l7 7m0 0l-7 7m7-7H3' />
                  </svg>
                  <span className='font-medium text-ink'>{toCard?.title || 'Company'}</span>
                </div>
                {fromCard?.fields?.chain && (
                  <div className='flex items-center gap-1.5 pl-3 border-l border-ink/10'>
                    {(() => {
                      const Icon = CHAIN_ICONS[String(fromCard.fields.chain)]
                      return Icon ? <Icon variant='branded' size={12} /> : null
                    })()}
                    <span className='text-[10px] text-ink/40'>{CHAIN_LABELS[String(fromCard.fields.chain)] || String(fromCard.fields.chain)}</span>
                  </div>
                )}
                <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 ml-2'>Invoice</span>
              </div>
              <button
                onClick={onClose}
                className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'
              >
                &times;
              </button>
            </div>

            {/* Two-column content */}
            <div className='flex flex-1 min-h-0'>
              {/* Left: Settings */}
              <div className='w-[340px] border-r border-ink/8 p-6 space-y-6 overflow-y-auto'>
                {/* Amount */}
                <div>
                  <label className='block'>
                    <span className='text-xs text-ink/40 mb-1.5 block'>Invoice Amount (USDC)</span>
                    <input
                      type='number'
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder='0.00'
                      className='w-full text-sm text-ink font-mono bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
                    />
                  </label>
                </div>

                {/* Template */}
                <div>
                  <label className='block'>
                    <span className='text-xs text-ink/40 mb-1.5 block'>Invoice Template</span>
                    <div className='relative'>
                      <select
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:border-ink/20'
                      >
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <svg className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30 pointer-events-none' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                      </svg>
                    </div>
                  </label>
                </div>

                {/* Document Name */}
                <div>
                  <label className='block'>
                    <span className='text-xs text-ink/40 mb-1.5 block'>Document Name</span>
                    <input
                      type='text'
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder={selectedTemplate?.name || 'Invoice'}
                      className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
                    />
                  </label>
                </div>

                {/* Dynamic fields */}
                {dynamicFields.map((field) => (
                  <label key={field.key} className='block'>
                    <span className='text-xs text-ink/40 mb-1.5 block'>{field.label}</span>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={fieldValues[field.key] || ''}
                        onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20 min-h-[80px]'
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={fieldValues[field.key] || ''}
                        onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
                      />
                    )}
                  </label>
                ))}

                {/* Info */}
                <div className='bg-amber-50 rounded-xl p-4'>
                  <p className='text-xs text-amber-700'>
                    <strong>Invoice Flow:</strong> The deposit wallet will use Unified Balance to pay this invoice. 
                    Enable delegation in the Invoices page to allow payment.
                  </p>
                </div>
              </div>

              {/* Right: Preview */}
              <div className='flex-1 flex flex-col min-w-0'>
                <div className='px-6 py-3 border-b border-ink/8'>
                  <span className='text-xs text-ink/40 uppercase tracking-wider'>Preview</span>
                </div>
                <div className='flex-1 overflow-y-auto p-6'>
                  <iframe
                    srcDoc={previewHtml}
                    className='w-full border border-ink/10 rounded-xl bg-white'
                    style={{ minHeight: 300 }}
                    title='Invoice Preview'
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className='border-t border-ink/8 px-6 py-4 flex items-center justify-end gap-3'>
              <button
                onClick={onClose}
                className='px-4 py-2 text-xs text-ink/50 hover:text-ink/70 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className='px-6 py-2.5 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 transition-opacity'
              >
                Save Invoice
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
