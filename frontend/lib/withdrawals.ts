const STORAGE_KEY = 'goji_pending_withdrawals'

export interface PendingWithdrawal {
  id: string
  chain: string
  amount: string
  initiatedAt: string
  expiresAt: string
}

export function getPendingWithdrawals(): PendingWithdrawal[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function addPendingWithdrawal(withdrawal: PendingWithdrawal) {
  const existing = getPendingWithdrawals()
  existing.push(withdrawal)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

export function removePendingWithdrawal(id: string) {
  const existing = getPendingWithdrawals()
  const filtered = existing.filter((w) => w.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function clearPendingWithdrawals() {
  localStorage.removeItem(STORAGE_KEY)
}

export function isWithdrawalReady(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date()
}

export function getTimeRemaining(expiresAt: string): string {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry.getTime() - now.getTime()

  if (diff <= 0) return 'Ready'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h remaining`
  return `${hours}h remaining`
}
