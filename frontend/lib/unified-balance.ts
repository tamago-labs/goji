import {
  createUnifiedBalanceKitContext,
  getBalances,
} from '@circle-fin/unified-balance-kit'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Adapter = any

// Use AppKit for class API methods like initiateRemoveFund
let kit: any = null
function getKit() {
  if (!kit) {
    try {
      const { AppKit } = require('@circle-fin/app-kit')
      kit = new AppKit({
        unifiedBalance: {
          providers: []  // Use default providers
        }
      })
    } catch {
      // Fallback if AppKit not available
    }
  }
  return kit
}

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
  const context = createUnifiedBalanceKitContext()
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
  const appKit = getKit()
  if (!appKit) {
    return { success: false, error: 'AppKit not available' }
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await appKit.unifiedBalance.deposit({
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

export async function withdrawFromUnified(
  adapter: Adapter,
  amount: string,
  toChain: string
) {

  const appKit = getKit()
  if (!appKit) {
    return { success: false, error: 'AppKit not available' }
  }

  try {
    const initiateResult = await appKit.unifiedBalance.initiateRemoveFund({
      from: {
        adapter,
        chain: toChain as never
      },
      amount
    })

    return {
      success: true,
      message: 'Withdrawal initiated. On EVM chains, there is a 7-day waiting period before completion.',
      txHash: initiateResult.txHash
    }
  } catch (err) {
    console.error('[unified-balance] withdraw error:', err)
    return { success: false, error: (err as Error).message }
  }
}

export async function completeWithdrawal(
  adapter: Adapter,
  chain: string
) {

  const appKit = getKit()
  if (!appKit) {
    return { success: false, error: 'AppKit not available. Please refresh and try again.' }
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await appKit.unifiedBalance.removeFund({
        from: {
          adapter,
          chain: chain as never
        }
      })
      return { success: true, txHash: result.txHash }
    } catch (err) {
      const message = (err as Error).message || ''
      if (message.includes('request limit reached') && attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 2000))
        continue
      }
      // Provide helpful error messages
      if (message.includes('NETWORK_CONNECTION_FAILED')) {
        return { success: false, error: 'The 7-day waiting period may not have elapsed yet, or there is a connectivity issue.' }
      }
      if (message.includes('waiting period')) {
        return { success: false, error: 'The 7-day waiting period has not elapsed yet. Please try again later.' }
      }
      console.error('[unified-balance] complete withdrawal error:', err)
      return { success: false, error: message }
    }
  }
  return { success: false, error: 'Max retries exceeded' }
}

export async function spendFromUnified(
  adapter: Adapter,
  amount: string,
  toChain: string,
  recipientAddress: string
) {
  const appKit = getKit()
  if (!appKit) {
    return { success: false, error: 'AppKit not available' }
  }

  try {
    const result = await appKit.unifiedBalance.spend({
      amount,
      token: 'USDC',
      from: [{ adapter }],
      to: {
        adapter,
        chain: toChain as never,
        recipientAddress
      }
    })
    return { success: true, txHash: result.txHash }
  } catch (err) {
    console.error('[unified-balance] spend error:', err)
    return { success: false, error: (err as Error).message }
  }
}
