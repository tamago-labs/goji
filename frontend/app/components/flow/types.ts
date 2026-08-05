export type CardCategory = 'wallet' | 'recipient' | 'gate' | 'deposit'

export interface FlowCard {
  id: string
  category: CardCategory
  title: string
  x: number
  y: number
  fields: Record<string, string | boolean>
}

export interface IdentitySummary {
  walletAddress: string
  passId: string
  tokenId: string
  status: string
  countryCode?: string
  ownerName?: string
}

export interface Connection {
  id: string
  from: string
  fromPort: 'output'
  to: string
  toPort: 'input'
  label?: string
  amount?: string
  payment?: number
  document?: number
  template?: string
  customDoc?: string
  docName?: string
  txHash?: string
  delegationEnabled?: number
}

export interface CanvasState {
  cards: FlowCard[]
  connections: Connection[]
}

export interface CardTemplate {
  category: CardCategory
  title: string
  fields: Record<string, string | boolean>
}

export const CARD_WIDTH = 220
export const CARD_HEIGHTS: Record<CardCategory, number> = {
  wallet: 130,
  recipient: 140,
  gate: 120,
  deposit: 140
}

export const CATEGORY_COLORS: Record<
  CardCategory,
  { border: string; bg: string; badge: string; badgeText: string }
> = {
  wallet: { border: '#7FD9B0', bg: 'bg-mint/10', badge: 'bg-mint/20', badgeText: 'text-[#1B7A50]' },
  recipient: {
    border: '#8B7FD6',
    bg: 'bg-violet/10',
    badge: 'bg-violet/20',
    badgeText: 'text-[#5A4FB8]'
  },
  gate: { border: '#FF8A73', bg: 'bg-coral/10', badge: 'bg-coral/20', badgeText: 'text-[#C24E33]' },
  deposit: { border: '#374151', bg: 'bg-gray-100', badge: 'bg-gray-200', badgeText: 'text-gray-700' }
}

export const CARD_TEMPLATES: CardTemplate[] = [
  { category: 'wallet', title: 'Wallet', fields: { address: '', balance: '' } },
  { category: 'recipient', title: 'Recipient', fields: { address: '', chain: '', type: '', name: '', amount: '', doc: '' } },
  { category: 'gate', title: 'Multisig Gate', fields: { required: '2', total: '3' } },
  { category: 'deposit', title: 'Deposit Wallet', fields: { address: '', chain: '', balance: '' } }
]
