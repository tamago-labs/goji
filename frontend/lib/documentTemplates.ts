export type DocumentFlowType = 'payment' | 'invoice'

export interface TemplateField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'textarea'
  autoFill: boolean
  position?: 'header' | 'body' | 'footer'
}

export interface DocumentTemplate {
  id: string
  key: string
  name: string
  flowType: DocumentFlowType
  version: number
  companyName?: string | null
  fields: TemplateField[]
  html: string
}

export interface InvoiceLineItem {
  description: string
  quantity: string
  unitPrice: string
  amount: string
}

export function renderLineItems(items: InvoiceLineItem[] | string | undefined): string {
  if (typeof items === 'string') return items
  return (items || []).map((item) => `<tr><td>${escapeHtml(item.description)}</td><td>${escapeHtml(item.quantity)}</td><td>${escapeHtml(item.unitPrice)}</td><td>${escapeHtml(item.amount)}</td></tr>`).join('')
}

export function renderDocumentTemplate(html: string, values: Record<string, unknown>): string {
  let result = html || ''

  result = result.replace(/\{\{#([\w]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_match, key: string, body: string) => {
    return values[key] === undefined || values[key] === null || values[key] === '' ? '' : body
  })

  for (const [key, rawValue] of Object.entries(values)) {
    const value = String(rawValue ?? '')
    const replacement = key === 'lineItems' || key === 'statusClass' ? value : escapeHtml(value)
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), replacement)
  }

  return result
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character] || character))
}
