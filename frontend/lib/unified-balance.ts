import {
  createUnifiedBalanceKitContext,
  getBalances,
  deposit,
  spend
} from '@circle-fin/unified-balance-kit'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Adapter = any

const context = createUnifiedBalanceKitContext()

export interface ChainBalance {
  chain: string
  confirmed: string
  pending: string
}

export interface UnifiedBalance {
  totalConfirmed: string
  totalPending: string
  chains: ChainBalance[]
}

export async function fetchBalances(adapter: Adapter): Promise<UnifiedBalance> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await getBalances(context, {
        sources: { adapter },
        networkType: 'testnet',
        includePending: true
      })

      return {
        totalConfirmed: result.totalConfirmedBalance || '0.00',
        totalPending: result.totalPendingBalance || '0.00',
        chains: []
      }
    } catch (err) {
      const message = (err as Error).message || ''
      if (message.includes('request limit reached') && attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 2000))
        continue
      }
      console.error('[unified-balance] fetchBalances error:', err)
      return { totalConfirmed: '0.00', totalPending: '0.00', chains: [] }
    }
  }
  return { totalConfirmed: '0.00', totalPending: '0.00', chains: [] }
}

export async function depositToUnified(
  adapter: Adapter,
  chain: string,
  amount: string
) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await deposit(context, {
        from: { adapter, chain: chain as never },
        amount,
        token: 'USDC'
      })
      return { success: true, txHash: result.txHash }
    } catch (err) {
      const message = (err as Error).message || ''
      if (message.includes('request limit reached') && attempt < 3) {
        console.log(`[unified-balance] rate limited, retrying in ${attempt * 2}s...`)
        await new Promise((r) => setTimeout(r, attempt * 2000))
        continue
      }
      console.error('[unified-balance] deposit error:', err)
      return { success: false, error: message }
    }
  }
  return { success: false, error: 'Max retries exceeded' }
}

// TODO: Withdraw not working yet - needs OperationContext pattern
// For now, show error message to user
export async function withdrawFromUnified(
  _adapter: Adapter,
  _amount: string,
  _toChain: string
) {
  return { success: false, error: 'Withdraw feature coming soon' }
}

export async function spendFromUnified(
  adapter: Adapter,
  amount: string,
  toChain: string,
  recipientAddress: string
) {
  try {
    const result = await spend(context, {
      amount,
      token: 'USDC',
      from: { adapter },
      to: { adapter, chain: toChain as never, recipientAddress }
    })
    return { success: true, txHash: result.txHash }
  } catch (err) {
    console.error('[unified-balance] spend error:', err)
    return { success: false, error: (err as Error).message }
  }
}
