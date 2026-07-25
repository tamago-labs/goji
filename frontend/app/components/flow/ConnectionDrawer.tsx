'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NetworkArc, NetworkBase, NetworkEthereum } from '@web3icons/react'
import { DEFAULT_TEMPLATES, renderTemplate } from '../../../lib/payslipTemplates'
import { type FlowCard, type Connection } from './types'

const CHAIN_ICONS: Record<string, React.ComponentType<{ variant?: string; size?: number }>> = {
  Arc_Testnet: NetworkArc,
  Base_Sepolia: NetworkBase,
  Ethereum_Sepolia: NetworkEthereum
}

const CHAIN_LABELS: Record<string, string> = {
  Arc_Testnet: 'Arc Testnet',
  Base_Sepolia: 'Base Sepolia',
  Ethereum_Sepolia: 'Ethereum Sepolia'
}

interface ConnectionDrawerProps {
  isOpen: boolean
  connection: Connection | null
  cards: FlowCard[]
  onClose: () => void
  onSave: (id: string, patch: Partial<Connection>) => void
}

export default function ConnectionDrawer({ isOpen, connection, cards, onClose, onSave }: ConnectionDrawerProps) {
  const [amount, setAmount] = useState('')
  const [payment, setPayment] = useState(false)
  const [document, setDocument] = useState(false)
  const [templateId, setTemplateId] = useState('standard')
  const [customDoc, setCustomDoc] = useState('')
  const [docName, setDocName] = useState('')

  const fromCard = connection ? cards.find((c) => c.id === connection.from) : null
  const toCard = connection ? cards.find((c) => c.id === connection.to) : null
  const isVerifiedRecipient = toCard?.fields?.type === 'verified'

  useEffect(() => {
    if (connection) {
      setAmount(connection.amount || '')
      setPayment(!!connection.payment)
      setDocument(!!connection.document)
      setTemplateId(connection.template || 'standard')
      setCustomDoc(connection.customDoc || '')
      setDocName(connection.docName || '')
    }
  }, [connection])

  const selectedTemplate = DEFAULT_TEMPLATES.find((t) => t.id === templateId) || DEFAULT_TEMPLATES[0]

  const previewHtml = document ? renderTemplate(selectedTemplate, {
    amount: amount || '0',
    sender: fromCard?.title || 'Wallet',
    recipient: toCard?.title || 'Recipient',
    date: new Date().toLocaleDateString(),
    txHash: connection?.txHash || 'Pending...'
  }) : ''

  const handleSave = () => {
    if (!connection) return
    onSave(connection.id, {
      amount: amount || null,
      payment: payment ? 1 : null,
      document: document ? 1 : null,
      template: document ? templateId : null,
      customDoc: document && templateId === 'custom' ? customDoc : null,
      docName: document ? (docName || selectedTemplate.docName) : null
    })
    onClose()
  }

  const canSave = payment || document

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
                  <span className='font-medium text-ink'>{fromCard?.title || 'Wallet'}</span>
                  <svg className='w-4 h-4 text-ink/30' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M14 5l7 7m0 0l-7 7m7-7H3' />
                  </svg>
                  <span className='font-medium text-ink'>{toCard?.title || 'Recipient'}</span>
                </div>
                {toCard?.fields?.chain && (
                  <div className='flex items-center gap-1.5 pl-3 border-l border-ink/10'>
                    {(() => {
                      const Icon = CHAIN_ICONS[String(toCard.fields.chain)]
                      return Icon ? <Icon variant='branded' size={12} /> : null
                    })()}
                    <span className='text-[10px] text-ink/40'>{CHAIN_LABELS[String(toCard.fields.chain)] || String(toCard.fields.chain)}</span>
                  </div>
                )}
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
                {/* Payment */}
                <div>
                  <label className='flex items-center gap-3 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={payment}
                      onChange={(e) => setPayment(e.target.checked)}
                      disabled={!isVerifiedRecipient}
                      className='w-4 h-4 rounded accent-ink'
                    />
                    <div>
                      <span className='text-sm font-medium text-ink'>Payment</span>
                      {!isVerifiedRecipient && (
                        <span className='text-[10px] text-ink/30 ml-2'>(verified wallet only)</span>
                      )}
                    </div>
                  </label>
                  {payment && (
                    <div className='mt-3 ml-7'>
                      <label className='block'>
                        <span className='text-xs text-ink/40 mb-1.5 block'>Amount (USDC)</span>
                        <input
                          type='number'
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder='0.00'
                          className='w-full text-sm text-ink font-mono bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Document */}
                <div>
                  <label className='flex items-center gap-3 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={document}
                      onChange={(e) => setDocument(e.target.checked)}
                      className='w-4 h-4 rounded accent-ink'
                    />
                    <span className='text-sm font-medium text-ink'>Document</span>
                  </label>
                  {document && (
                    <div className='mt-3 ml-7 space-y-4'>
                      <label className='block'>
                        <span className='text-xs text-ink/40 mb-1.5 block'>Template</span>
                        <div className='relative'>
                          <select
                            value={templateId}
                            onChange={(e) => setTemplateId(e.target.value)}
                            className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:border-ink/20'
                          >
                            {DEFAULT_TEMPLATES.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                          <svg className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30 pointer-events-none' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                          </svg>
                        </div>
                      </label>
                      <label className='block'>
                        <span className='text-xs text-ink/40 mb-1.5 block'>Document Name</span>
                        <input
                          type='text'
                          value={docName}
                          onChange={(e) => setDocName(e.target.value)}
                          placeholder={selectedTemplate.docName}
                          className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Preview */}
              <div className='flex-1 flex flex-col min-w-0'>
                <div className='px-6 py-3 border-b border-ink/8'>
                  <span className='text-xs text-ink/40 uppercase tracking-wider'>Preview</span>
                </div>
                <div className='flex-1 overflow-y-auto p-6'>
                  {document ? (
                    <iframe
                      srcDoc={previewHtml}
                      className='w-full border border-ink/10 rounded-xl bg-white'
                      style={{ minHeight: 300 }}
                      title='Document Preview'
                    />
                  ) : (
                    <div className='flex items-center justify-center h-full text-ink/20 text-sm'>
                      Enable Document to see preview
                    </div>
                  )}
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
                disabled={!canSave}
                className='px-6 py-2.5 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30'
              >
                Save
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
