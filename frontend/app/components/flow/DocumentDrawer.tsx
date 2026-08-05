'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2, X } from 'lucide-react'
import { type FlowCard, type Connection } from './types'
import { renderDocumentTemplate, renderLineItems, type DocumentTemplate, type DocumentFlowType, type InvoiceLineItem } from '../../../lib/documentTemplates'

interface DocumentDrawerProps {
  isOpen: boolean
  connection: Connection | null
  cards: FlowCard[]
  apiUrl: string
  onClose: () => void
  onSave: (id: string, patch: Partial<Connection>) => void
}

export default function DocumentDrawer({ isOpen, connection, cards, apiUrl, onClose, onSave }: DocumentDrawerProps) {
  const [amount, setAmount] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [docName, setDocName] = useState('')
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([{ description: 'Service', quantity: '1', unitPrice: '', amount: '' }])

  const fromCard = connection ? cards.find((card) => card.id === connection.from) : null
  const toCard = connection ? cards.find((card) => card.id === connection.to) : null
  const flowType: DocumentFlowType = fromCard?.category === 'deposit' && toCard?.category === 'wallet' ? 'invoice' : 'payment'
  const availableTemplates = useMemo(() => templates.filter((template) => template.flowType === flowType), [templates, flowType])
  const selectedTemplate = availableTemplates.find((template) => template.id === templateId) || availableTemplates[0]

  useEffect(() => {
    if (!isOpen) return
    fetch(`${apiUrl}/api/templates`).then((response) => response.ok ? response.json() : []).then(setTemplates).catch(() => setTemplates([]))
  }, [apiUrl, isOpen])

  useEffect(() => {
    if (!connection) return
    const handle = window.setTimeout(() => {
      setAmount(connection.amount || '')
      setTemplateId(connection.template || '')
      setDocName(connection.docName || '')
      try {
        const saved = connection.customDoc ? JSON.parse(connection.customDoc) : {}
        setFieldValues(saved.fields || saved)
        setLineItems(Array.isArray(saved.lineItems) && saved.lineItems.length ? saved.lineItems : [{ description: 'Service', quantity: '1', unitPrice: connection.amount || '', amount: connection.amount || '' }])
      } catch {
        setFieldValues({})
        setLineItems([{ description: 'Service', quantity: '1', unitPrice: connection.amount || '', amount: connection.amount || '' }])
      }
    }, 0)
    return () => window.clearTimeout(handle)
  }, [connection])

  const previewHtml = selectedTemplate ? renderDocumentTemplate(selectedTemplate.html, {
    companyName: selectedTemplate.companyName || 'Company',
    amount: amount || '0',
    sender: fromCard?.title || 'Wallet',
    recipient: toCard?.title || 'Recipient',
    billToName: fromCard?.title || 'Recipient',
    date: new Date().toLocaleDateString(),
    invoiceDate: new Date().toLocaleDateString(),
    dueDate: fieldValues.dueDate || 'Set due date',
    invoiceNumber: fieldValues.invoiceNumber || 'INV-DRAFT',
    lineItems: renderLineItems(lineItems),
    subtotal: amount || '0',
    total: amount || '0',
    effectiveDate: fieldValues.effectiveDate || new Date().toLocaleDateString(),
    duration: fieldValues.duration || '12 months',
    scope: fieldValues.scope || '',
    txHash: connection?.txHash || 'Pending...',
    status: 'UNPAID',
    statusClass: 'badge-unpaid',
    ...fieldValues
  }) : '<div style="padding:40px;text-align:center;color:#999">Loading templates...</div>'

  function updateItem(index: number, patch: Partial<InvoiceLineItem>) {
    setLineItems((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }

  function handleSave() {
    if (!connection || !selectedTemplate) return
    const customDoc = JSON.stringify({ fields: fieldValues, ...(flowType === 'invoice' ? { lineItems } : {}) })
    onSave(connection.id, {
      amount: amount || undefined,
      payment: flowType === 'invoice' ? 0 : 1,
      document: 1,
      template: selectedTemplate.id,
      docName: docName || selectedTemplate.name,
      customDoc
    })
    onClose()
  }

  const dynamicFields = selectedTemplate?.fields.filter((field) => !field.autoFill && field.key !== 'lineItems') || []

  return <AnimatePresence>{isOpen && connection && <>
    <motion.div className='fixed inset-0 z-50 bg-black/30' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.aside className='fixed inset-y-0 right-0 z-50 flex w-full max-w-[760px] flex-col bg-card shadow-[-20px_0_60px_rgba(43,36,64,0.18)]' initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.2 }}>
      <header className='flex items-center justify-between border-b border-ink/8 px-6 py-4'>
        <div><p className='text-xs uppercase tracking-wider text-ink/35'>{flowType === 'invoice' ? 'Invoice flow' : 'Payment flow'}</p><h2 className='font-display text-lg font-semibold text-ink'>{fromCard?.title || 'Wallet'} <span className='text-ink/30'>→</span> {toCard?.title || 'Recipient'}</h2></div>
        <button type='button' onClick={onClose} className='rounded-lg p-2 text-ink/35 hover:bg-ink/5'><X className='h-4 w-4' /></button>
      </header>
      <div className='grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[300px_1fr]'>
        <div className='overflow-y-auto border-b border-ink/8 p-5 md:border-b-0 md:border-r'>
          <label className='mb-4 block text-xs text-ink/45'>Amount (USDC)<input type='number' value={amount} onChange={(event) => setAmount(event.target.value)} className='mt-1.5 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm outline-none' /></label>
          <label className='mb-4 block text-xs text-ink/45'>Document template<select value={selectedTemplate?.id || ''} onChange={(event) => setTemplateId(event.target.value)} className='mt-1.5 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm outline-none'>{availableTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
          <label className='mb-5 block text-xs text-ink/45'>Document name<input value={docName} onChange={(event) => setDocName(event.target.value)} placeholder={selectedTemplate?.name || 'Document'} className='mt-1.5 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm outline-none' /></label>
          {flowType === 'invoice' && <div className='mb-5'><div className='mb-2 flex items-center justify-between'><span className='text-xs text-ink/45'>Line items</span><button type='button' onClick={() => setLineItems((items) => [...items, { description: '', quantity: '1', unitPrice: '', amount: '' }])} className='flex items-center gap-1 text-xs text-ink/60'><Plus className='h-3.5 w-3.5' />Add</button></div>{lineItems.map((item, index) => <div key={index} className='mb-2 rounded-xl bg-ink/5 p-2'><input value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} placeholder='Description' className='mb-2 w-full rounded-lg border border-ink/10 bg-card px-2.5 py-2 text-xs outline-none' /><div className='grid grid-cols-3 gap-1.5'><input value={item.quantity} onChange={(event) => updateItem(index, { quantity: event.target.value })} placeholder='Qty' className='rounded-lg border border-ink/10 bg-card px-2 py-2 text-xs outline-none' /><input value={item.unitPrice} onChange={(event) => updateItem(index, { unitPrice: event.target.value })} placeholder='Unit price' className='rounded-lg border border-ink/10 bg-card px-2 py-2 text-xs outline-none' /><input value={item.amount} onChange={(event) => updateItem(index, { amount: event.target.value })} placeholder='Amount' className='rounded-lg border border-ink/10 bg-card px-2 py-2 text-xs outline-none' /></div>{lineItems.length > 1 && <button type='button' onClick={() => setLineItems((items) => items.filter((_, itemIndex) => itemIndex !== index))} className='mt-2 flex items-center gap-1 text-[11px] text-coral'><Trash2 className='h-3 w-3' />Remove</button>}</div>)}</div>}
          {dynamicFields.map((field) => <label key={field.key} className='mb-4 block text-xs text-ink/45'>{field.label}{field.type === 'textarea' ? <textarea value={fieldValues[field.key] || ''} onChange={(event) => setFieldValues((values) => ({ ...values, [field.key]: event.target.value }))} className='mt-1.5 min-h-20 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm outline-none' /> : <input type={field.type} value={fieldValues[field.key] || ''} onChange={(event) => setFieldValues((values) => ({ ...values, [field.key]: event.target.value }))} className='mt-1.5 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-sm outline-none' />}</label>)}
        </div>
        <div className='min-h-0 overflow-y-auto bg-ink/[0.02] p-5'><p className='mb-3 text-xs uppercase tracking-wider text-ink/35'>Live preview</p><iframe srcDoc={previewHtml} title='Document preview' className='min-h-[620px] w-full rounded-xl border border-ink/10 bg-white' /></div>
      </div>
      <footer className='flex justify-end gap-2 border-t border-ink/8 px-6 py-4'><button type='button' onClick={onClose} className='rounded-xl px-4 py-2.5 text-xs text-ink/50'>Cancel</button><button type='button' onClick={handleSave} disabled={!selectedTemplate} className='rounded-xl bg-ink px-5 py-2.5 text-xs font-medium text-lavender disabled:opacity-40'>Save document</button></footer>
    </motion.aside>
  </>}</AnimatePresence>
}
