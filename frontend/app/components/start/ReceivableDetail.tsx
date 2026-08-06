'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Shield
} from 'lucide-react'
import { useStart } from './StartProvider'
import { renderDocumentTemplate } from '../../../lib/documentTemplates'
import {
  RECEIVABLE_TOKEN_ABI,
  getTokenStatusColor,
  getTokenStatusLabel
} from '../../../lib/receivableToken'
import { GOJIPROOF_ABI } from '../../../lib/gojiProof'
import { COMPLIANCE_REGISTRY_ABI } from '../../../lib/complianceRegistry'
import { IDENTITY_PASS_ABI, IDENTITY_PASS_ADDRESS } from '../../../lib/identityPass'

const GOJIPROOF_ADDRESS = '0x9465a4C246D44F32F391Ebda165Acb12886746Ca' as `0x${string}`
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

function countryCode(value: string) {
  const hex = value.replace(/^0x/, '').slice(0, 4)
  return hex.length === 4
    ? String.fromCharCode(
        Number.parseInt(hex.slice(0, 2), 16),
        Number.parseInt(hex.slice(2, 4), 16)
      )
    : value
}

interface TokenInfo {
  name: string
  type: string
  issuer: string
  total: bigint
  rate: bigint
  minInvestment: bigint
  issuedAt: bigint
  expiresAt: bigint
  funded: bigint
  status: number
  proofs: string[]
  totalInterest: bigint
  totalRepayment: bigint
  userShare: bigint
  userInterest: bigint
  userInvested: bigint
  userBalance: bigint
  complianceRegistry: string
  requiredTier: number
  allowedCountries: string[]
  eligible: boolean | null
}

interface ReceivableDetailProps {
  address: string
  mode?: 'company' | 'partner'
}

interface DocumentFlow {
  id: string
  boardName: string
  from: string
  to: string
  amount: string
  docName: string
  template: string | null
  customDoc: string | null
}

export default function ReceivableDetail({ address, mode = 'company' }: ReceivableDetailProps) {
  const publicClient = usePublicClient({ chainId: arcTestnet.id })
  const { apiUrl } = useStart()
  const { address: walletAddress } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()
  const [token, setToken] = useState<TokenInfo | null>(null)
  const [proofs, setProofs] = useState<{ hash: string; verified: boolean; loading: boolean }[]>([])
  const [documentFlows, setDocumentFlows] = useState<DocumentFlow[]>([])
  const [expandedDocument, setExpandedDocument] = useState<string | null>(null)
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [calcAmount, setCalcAmount] = useState('')
  const [calcDays, setCalcDays] = useState('30')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [eligibilityReason, setEligibilityReason] = useState('')
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!publicClient) return
    async function load() {
      try {
        const info = (await publicClient!.readContract({
          address: address as `0x${string}`,
          abi: RECEIVABLE_TOKEN_ABI,
          functionName: 'getReceivableInfo'
        })) as [string, string, bigint, bigint, bigint, bigint, bigint, bigint, number]
        const [
          name,
          proofs,
          totalInterest,
          totalRepayment,
          registry,
          requiredTier,
          allowedCountries
        ] = await Promise.all([
          publicClient!.readContract({
            address: address as `0x${string}`,
            abi: RECEIVABLE_TOKEN_ABI,
            functionName: 'name'
          }) as Promise<string>,
          publicClient!.readContract({
            address: address as `0x${string}`,
            abi: RECEIVABLE_TOKEN_ABI,
            functionName: 'getProofHashes'
          }) as Promise<string[]>,
          publicClient!.readContract({
            address: address as `0x${string}`,
            abi: RECEIVABLE_TOKEN_ABI,
            functionName: 'getTotalInterest'
          }) as Promise<bigint>,
          publicClient!.readContract({
            address: address as `0x${string}`,
            abi: RECEIVABLE_TOKEN_ABI,
            functionName: 'getTotalRepayment'
          }) as Promise<bigint>,
          publicClient!.readContract({
            address: address as `0x${string}`,
            abi: RECEIVABLE_TOKEN_ABI,
            functionName: 'complianceRegistry'
          }) as Promise<string>,
          publicClient!.readContract({
            address: address as `0x${string}`,
            abi: RECEIVABLE_TOKEN_ABI,
            functionName: 'requiredComplianceTier'
          }) as Promise<number>,
          publicClient!
            .readContract({
              address: address as `0x${string}`,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'getAllowedCountries'
            })
            .catch(() => []) as Promise<string[]>
        ])
        let userBalance = BigInt(0)
        let userShare = BigInt(0)
        let userInterest = BigInt(0)
        let userInvested = BigInt(0)
        let eligible: boolean | null = null
        let nextEligibilityReason = ''
        if (walletAddress) {
          userBalance = (await publicClient!.readContract({
            address: address as `0x${string}`,
            abi: RECEIVABLE_TOKEN_ABI,
            functionName: 'balanceOf',
            args: [walletAddress]
          })) as bigint
          if (userBalance > BigInt(0)) {
            userShare = (await publicClient!.readContract({
              address: address as `0x${string}`,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'calculateShare',
              args: [walletAddress]
            })) as bigint
            userInterest = (await publicClient!.readContract({
              address: address as `0x${string}`,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'calculateInvestorInterest',
              args: [walletAddress]
            })) as bigint
            userInvested = (await publicClient!.readContract({
              address: address as `0x${string}`,
              abi: RECEIVABLE_TOKEN_ABI,
              functionName: 'investedAmount',
              args: [walletAddress]
            })) as bigint
          }
          if (registry !== ZERO_ADDRESS && IDENTITY_PASS_ADDRESS) {
            const valid = await publicClient!.readContract({
              address: IDENTITY_PASS_ADDRESS,
              abi: IDENTITY_PASS_ABI,
              functionName: 'isValid',
              args: [walletAddress]
            })
            if (!valid) {
              eligible = false
              nextEligibilityReason = 'This connected wallet has no valid Identity Pass, or its pass is revoked or expired.'
            } else {
              const registryEligible = await publicClient!.readContract({
                address: registry as `0x${string}`,
                abi: COMPLIANCE_REGISTRY_ABI,
                functionName: 'isEligible',
                args: [walletAddress, Number(requiredTier)]
              })
              if (!registryEligible) {
                eligible = false
                nextEligibilityReason = `This wallet is not approved for the required Tier ${Number(requiredTier)} in this Compliance Registry.`
              } else if (allowedCountries.length > 0) {
                const country = (await publicClient!.readContract({
                  address: registry as `0x${string}`,
                  abi: COMPLIANCE_REGISTRY_ABI,
                  functionName: 'countryOf',
                  args: [walletAddress]
                })) as string
                eligible = allowedCountries.some((allowed) => allowed.toLowerCase() === country.toLowerCase())
                if (!eligible) nextEligibilityReason = `This wallet is approved, but its country (${country}) is not allowed by this receivable.`
              } else {
                eligible = true
              }
            }
          } else if (registry === ZERO_ADDRESS) eligible = true
        }
        setToken({
          name,
          type: info[0],
          issuer: info[1],
          total: info[2],
          rate: info[3],
          minInvestment: info[4],
          issuedAt: info[5],
          expiresAt: info[6],
          funded: info[7],
          status: info[8],
          proofs,
          totalInterest,
          totalRepayment,
          userShare,
          userInterest,
          userInvested,
          userBalance,
          complianceRegistry: registry,
          requiredTier: Number(requiredTier),
          allowedCountries,
          eligible
        })
        setEligibilityReason(nextEligibilityReason)
        setProofs(proofs.map((hash) => ({ hash, verified: false, loading: false })))
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not load receivable')
      }
    }
    void load()
  }, [address, publicClient, walletAddress])

  useEffect(() => {
    async function loadDocumentFlows() {
      try {
        const boardsResponse = await fetch(`${apiUrl}/api/boards`)
        if (!boardsResponse.ok) return
        const boards = await boardsResponse.json()
        const flows: DocumentFlow[] = []

        for (const board of boards) {
          const [statusResponse, connectionResponse, cardsResponse] = await Promise.all([
            fetch(`${apiUrl}/api/flow-status?flowId=${board.id}`),
            fetch(`${apiUrl}/api/connections?boardId=${board.id}`),
            fetch(`${apiUrl}/api/cards?boardId=${board.id}`)
          ])
          if (!statusResponse.ok) continue

          const statuses = await statusResponse.json()
          const connections = connectionResponse.ok ? await connectionResponse.json() : []
          const cards = cardsResponse.ok ? await cardsResponse.json() : []
          const connectionMap = new Map(
            connections.map((connection: { id: string }) => [connection.id, connection])
          )
          const cardMap = new Map(cards.map((card: { id: string }) => [card.id, card]))

          for (const status of statuses) {
            if (status.status !== 'pending') continue
            const connection = connectionMap.get(status.routeId) as
              | {
                  from?: string
                  to?: string
                  amount?: string
                  docName?: string
                  template?: string | null
                  customDoc?: string | null
                }
              | undefined
            if (!connection) continue
            const fromCard = cardMap.get(connection.from) as { title?: string } | undefined
            const toCard = cardMap.get(connection.to) as { title?: string } | undefined
            flows.push({
              id: status.id,
              boardName: board.name,
              from: fromCard?.title || 'Unknown',
              to: toCard?.title || 'Unknown',
              amount: connection.amount || '0',
              docName: connection.docName || 'Document',
              template: connection.template || null,
              customDoc: connection.customDoc || null
            })
          }
        }

        setDocumentFlows(flows)
      } catch (error) {
        console.error('Failed to load receivable documents:', error)
      }
    }

    void loadDocumentFlows()
  }, [apiUrl])

  const amount = (value: bigint) =>
    `${(Number(value) / 1e18).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
  const fundingPercent =
    token && token.total > BigInt(0) ? Number((token.funded * BigInt(100)) / token.total) : 0
  const expired = token ? token.expiresAt <= BigInt(now) : false
  const issuer =
    !!token && !!walletAddress && token.issuer.toLowerCase() === walletAddress.toLowerCase()
  const termDays = token ? Math.ceil(Number(token.expiresAt - token.issuedAt) / 86400) : 0

  async function verifyProof(index: number) {
    if (!publicClient) return
    setProofs((items) =>
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, loading: true } : item))
    )
    try {
      const verified = await publicClient.readContract({
        address: GOJIPROOF_ADDRESS,
        abi: GOJIPROOF_ABI,
        functionName: 'isAnchored',
        args: [proofs[index].hash as `0x${string}`]
      })
      setProofs((items) =>
        items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, verified: Boolean(verified), loading: false } : item
        )
      )
    } catch {
      setProofs((items) =>
        items.map((item, itemIndex) => (itemIndex === index ? { ...item, loading: false } : item))
      )
    }
  }

  async function transact(functionName: 'finance' | 'claimRepayment' | 'redeem', value?: bigint) {
    if (!walletClient || !publicClient || !walletAddress || !token) return
    setBusy(true)
    setMessage('')
    try {
      if ((await walletClient.getChainId()) !== arcTestnet.id) {
        if (!switchChainAsync) throw new Error('Wallet cannot switch to Arc Testnet')
        await switchChainAsync({ chainId: arcTestnet.id })
      }
      const { request } = await (publicClient as any).simulateContract({
        address: address as `0x${string}`,
        abi: RECEIVABLE_TOKEN_ABI,
        functionName,
        ...(value !== undefined ? { value } : {}),
        account: walletAddress
      })
      const hash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash })
      setMessage('Transaction confirmed on Arc Testnet.')
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Transaction failed')
    } finally {
      setBusy(false)
    }
  }

  if (!token)
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        {message ? (
          <div className='max-w-lg rounded-xl border border-coral/20 bg-coral/5 px-4 py-3 text-center text-xs text-coral'>
            {message}
          </div>
        ) : (
          <Loader2 className='h-6 w-6 animate-spin text-ink/40' />
        )}
      </div>
    )
  const back = mode === 'partner' ? '/start/available-receivables' : '/start/receivables/list'
  const estimate =
    calcAmount && Number(calcAmount) > 0 ? BigInt(Math.floor(Number(calcAmount) * 1e18)) : BigInt(0)
  const investmentValue =
    investmentAmount && Number(investmentAmount) > 0
      ? BigInt(Math.floor(Number(investmentAmount) * 1e18))
      : BigInt(0)
  const remainingAmount = token ? token.total - token.funded : BigInt(0)
  const estimatedInterest =
    (estimate * token.rate * BigInt(Number(calcDays))) / BigInt(Math.max(termDays, 1) * 10000)

  return (
    <div>
      <Link
        href={back}
        className='mb-6 inline-flex items-center gap-2 text-xs text-ink/45 hover:text-ink'
      >
        <ArrowLeft className='h-3.5 w-3.5' />
        Back
      </Link>
      <div className='mb-6 flex items-start justify-between gap-4'>
        <div>
          <p className='text-[10px] uppercase tracking-wider text-ink/35'>
            {mode === 'partner' ? 'Financial partner view' : 'Company receivable'}
          </p>
          <h1 className='font-display text-2xl font-semibold'>{token.name}</h1>
          <p className='mt-1 font-mono text-xs text-ink/40'>{address}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-medium ${getTokenStatusColor(token.status)}`}
        >
          {getTokenStatusLabel(token.status)}
        </span>
      </div>
      <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
        <Stat label='Total receivable' value={amount(token.total)} />
        <Stat label='Interest' value={`${Number(token.rate) / 100}% pro-rata`} />
        <Stat label='Term' value={`${termDays} days`} />
        <Stat label='Funded' value={`${fundingPercent}%`} />
      </div>
      <div className='mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]'>
        <div className='space-y-5'>
          <Panel title='Terms'>
            <div className='grid grid-cols-2 gap-3 text-xs'>
              <Stat label='Minimum investment' value={amount(token.minInvestment)} />
              <Stat
                label='Expires'
                value={new Date(Number(token.expiresAt) * 1000).toLocaleDateString()}
              />
              <Stat
                label='Issuer'
                value={token.issuer.slice(0, 8) + '...' + token.issuer.slice(-6)}
              />
              <Stat
                label='Outstanding repayment'
                value={token.status === 3 ? amount(BigInt(0)) : amount(token.totalRepayment)}
              />
            </div>
          </Panel>
          {token.complianceRegistry !== ZERO_ADDRESS && (
            <Panel title='Compliance Policy'>
              <div className='space-y-2 text-xs'>
                <Row label='Required identity tier' value={`Tier ${token.requiredTier}`} />
                <Row
                  label='Allowed countries'
                  value={
                    token.allowedCountries.length > 0
                      ? token.allowedCountries.map(countryCode).join(', ')
                      : 'All countries'
                  }
                />
                <p className='pt-2 text-[10px] text-ink/35'>
                  Country and tier restrictions are enforced on-chain before financing.
                </p>
              </div>
            </Panel>
          )}
          <Panel title='Funding Progress'>
            <div className='mb-2 flex justify-between text-xs text-ink/50'>
              <span>{amount(token.funded)} funded</span>
              <span>{amount(token.total)} total</span>
            </div>
            <div className='h-2 overflow-hidden rounded-full bg-ink/10'>
              <div
                className='h-full rounded-full bg-mint'
                style={{ width: `${fundingPercent}%` }}
              />
            </div>
          </Panel>
          <Panel title={`Verified Payment History (${proofs.length})`}>
            <div className='space-y-2'>
              {proofs.map((proof, index) => (
                <div
                  key={proof.hash}
                  className='flex items-center justify-between rounded-xl bg-ink/[0.02] p-3'
                >
                  <div className='flex min-w-0 items-center gap-2'>
                    <Shield className='h-4 w-4 shrink-0 text-ink/30' />
                    <span className='truncate font-mono text-xs text-ink/60'>{proof.hash}</span>
                  </div>
                  <button
                    type='button'
                    onClick={() => void verifyProof(index)}
                    disabled={proof.loading}
                    className='ml-3 shrink-0 text-xs text-mint'
                  >
                    {proof.loading ? (
                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
                    ) : proof.verified ? (
                      <span className='flex items-center gap-1 text-[#28C840]'>
                        <CheckCircle className='h-3.5 w-3.5' />
                        Verified
                      </span>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title={`Documents (${documentFlows.length})`}>
            {documentFlows.length === 0 ? (
              <p className='text-xs text-ink/35'>
                No document records are available in the workspace.
              </p>
            ) : (
              <div className='space-y-2'>
                {documentFlows.map((flow) => (
                  <div key={flow.id} className='overflow-hidden rounded-xl bg-ink/[0.02]'>
                    <button
                      type='button'
                      onClick={() =>
                        setExpandedDocument(expandedDocument === flow.id ? null : flow.id)
                      }
                      className='flex w-full items-center justify-between p-3 text-left hover:bg-ink/5'
                    >
                      <span className='flex min-w-0 items-center gap-2'>
                        <FileText className='h-4 w-4 shrink-0 text-ink/30' />
                        <span className='min-w-0'>
                          <span className='block truncate text-xs font-medium text-ink/70'>
                            {flow.docName}
                          </span>
                          <span className='block text-[10px] text-ink/35'>{flow.boardName}</span>
                        </span>
                      </span>
                      {expandedDocument === flow.id ? (
                        <ChevronUp className='h-4 w-4 text-ink/30' />
                      ) : (
                        <ChevronDown className='h-4 w-4 text-ink/30' />
                      )}
                    </button>
                    {expandedDocument === flow.id && (
                      <div className='border-t border-ink/5 p-3'>
                        <div className='mb-3 grid grid-cols-2 gap-2 text-[11px]'>
                          <span className='text-ink/40'>
                            From: <b className='font-normal text-ink/60'>{flow.from}</b>
                          </span>
                          <span className='text-ink/40'>
                            To: <b className='font-normal text-ink/60'>{flow.to}</b>
                          </span>
                          <span className='text-ink/40'>
                            Amount: <b className='font-normal text-ink/60'>{flow.amount} USDC</b>
                          </span>
                        </div>
                        <DocumentPreview flow={flow} apiUrl={apiUrl} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
        <div className='space-y-5'>
          <Panel title='Repayment Projection'>
            <div className='space-y-2 text-xs'>
              <Row label='Principal' value={amount(token.total)} />
              <Row label='Projected interest' value={amount(token.totalInterest)} />
              <Row label='Projected repayment' value={amount(token.totalRepayment)} />
              <p className='pt-2 text-[10px] text-ink/35'>
                Actual interest is pro-rata based on each investor&apos;s funding date.
              </p>
            </div>
          </Panel>
          {mode === 'partner' && (
            <>
              <Panel title='Eligibility'>
                <div
                  className={`rounded-xl p-3 text-xs ${token.eligible === true ? 'bg-mint/10 text-[#1B7A50]' : 'bg-amber-100 text-amber-700'}`}
                >
                  {token.complianceRegistry === ZERO_ADDRESS
                    ? 'Open to eligible wallets'
                    : token.eligible
                      ? 'Eligible to finance'
                      : eligibilityReason || 'Identity approval, tier, or country requirement not met'}
                </div>
                {token.complianceRegistry !== ZERO_ADDRESS && token.eligible !== true && (
                  <Link
                    href='/start/wallets'
                    className='mt-3 block text-xs font-medium text-mint hover:text-[#1B7A50]'
                  >
                    Open Wallets to submit identity
                  </Link>
                )}
              </Panel>
              <Panel title='Invest in Receivable'>
                <div className='space-y-3'>
                  <div className='grid grid-cols-2 gap-2 text-xs'>
                    <Stat label='Minimum investment' value={amount(token.minInvestment)} />
                    <Stat label='Available to fund' value={amount(remainingAmount)} />
                  </div>
                  <input
                    type='number'
                    min='0'
                    value={investmentAmount}
                    onChange={(event) => setInvestmentAmount(event.target.value)}
                    placeholder='Amount to invest (USDC)'
                    className='w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-xs outline-none'
                  />
                  <button
                    type='button'
                    onClick={() => void transact('finance', investmentValue)}
                    disabled={
                      busy ||
                      investmentValue < token.minInvestment ||
                      investmentValue > remainingAmount ||
                      token.status !== 0 ||
                      expired ||
                      token.eligible === false
                    }
                    className='flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-medium text-lavender disabled:opacity-40'
                  >
                    {busy && <Loader2 className='h-3.5 w-3.5 animate-spin' />}Finance receivable
                  </button>
                  <p className='text-[10px] text-ink/35'>
                    Your investment is sent on-chain and cannot be changed after confirmation.
                  </p>
                </div>
              </Panel>
              <Panel title='Investment Calculator'>
                <div className='space-y-3'>
                  <input
                    type='number'
                    value={calcAmount}
                    onChange={(event) => setCalcAmount(event.target.value)}
                    placeholder='Investment amount (USDC)'
                    className='w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-xs outline-none'
                  />
                  <input
                    type='number'
                    value={calcDays}
                    onChange={(event) => setCalcDays(event.target.value)}
                    placeholder='Funding duration (days)'
                    className='w-full rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-xs outline-none'
                  />
                  {estimate > BigInt(0) && (
                    <div className='rounded-xl bg-ink/[0.02] p-3 text-xs'>
                      <Row
                        label='Tokens'
                        value={(
                          (Number(estimate) * 1_000_000) /
                          Number(token.total)
                        ).toLocaleString()}
                      />
                      <Row label='Estimated interest' value={amount(estimatedInterest)} />
                      <Row label='Estimated return' value={amount(estimate + estimatedInterest)} />
                    </div>
                  )}
                  <p className='text-[10px] text-ink/35'>
                    Estimate only. This does not submit a transaction.
                  </p>
                </div>
              </Panel>
              {token.userBalance > BigInt(0) && (
                <Panel title='Your Position'>
                  <Row
                    label='Tokens held'
                    value={(Number(token.userBalance) / 1e6).toLocaleString()}
                  />
                  <Row label='Invested' value={amount(token.userShare)} />
                  <Row label='Interest' value={amount(token.userInterest)} />
                  <button
                    type='button'
                    onClick={() => void transact('redeem')}
                    disabled={busy || token.status !== 3}
                    className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-mint px-4 py-2.5 text-xs font-medium text-white disabled:opacity-40'
                  >
                    Redeem tokens
                  </button>
                </Panel>
              )}
            </>
          )}
          {mode === 'company' && (
            <Panel title='Company action'>
              <button
                type='button'
                onClick={() => void transact('claimRepayment', token.totalRepayment)}
                disabled={busy || !issuer || !expired || (token.status !== 0 && token.status !== 1)}
                className='flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-medium text-lavender disabled:opacity-40'
              >
                {busy && <Loader2 className='h-3.5 w-3.5 animate-spin' />}Claim repayment
              </button>
              <p className='mt-2 text-[10px] text-ink/35'>Issuer-only action after expiry.</p>
            </Panel>
          )}
        </div>
      </div>
      {message && <p className='mt-4 rounded-xl bg-ink/5 p-3 text-xs text-ink/60'>{message}</p>}
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='rounded-2xl bg-card p-5 shadow-[0_4px_20px_rgba(43,36,64,0.05)]'>
      <h2 className='mb-4 text-sm font-semibold'>{title}</h2>
      {children}
    </section>
  )
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between border-b border-ink/5 py-2 last:border-0'>
      <span className='text-ink/40'>{label}</span>
      <span className='text-right text-ink/65'>{value}</span>
    </div>
  )
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-2xl bg-card p-4 shadow-[0_4px_20px_rgba(43,36,64,0.04)]'>
      <p className='text-[10px] text-ink/35'>{label}</p>
      <p className='mt-1 text-sm font-semibold'>{value}</p>
    </div>
  )
}

function DocumentPreview({ flow, apiUrl }: { flow: DocumentFlow; apiUrl: string }) {
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        let templateHtml = ''
        if (flow.template) {
          const response = await fetch(`${apiUrl}/api/templates`)
          if (response.ok) {
            const templates = await response.json()
            const template = templates.find(
              (item: { id: string; html?: string }) => item.id === flow.template
            )
            templateHtml = template?.html || ''
          }
        }
        if (!templateHtml) {
          templateHtml =
            '<html><head><style>body{font-family:system-ui,sans-serif;padding:24px;max-width:600px;margin:0 auto;color:#333}h1{font-size:20px;border-bottom:2px solid #7FD9B0;padding-bottom:8px}.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}.label{color:#666}.footer{margin-top:32px;font-size:12px;color:#999;text-align:center}</style></head><body><h1>{{docName}}</h1><div class="row"><span class="label">From</span><span>{{sender}}</span></div><div class="row"><span class="label">To</span><span>{{recipient}}</span></div><div class="row"><span class="label">Amount</span><span>{{amount}} USDC</span></div><div class="footer">Generated by Goji</div></body></html>'
        }
        let customFields: Record<string, string> = {}
        if (flow.customDoc) {
          try {
            customFields = JSON.parse(flow.customDoc)
          } catch {
            /* Keep the default fields when custom data is invalid. */
          }
        }
        setHtml(
          renderDocumentTemplate(templateHtml, {
            docName: flow.docName,
            company: 'Company',
            amount: flow.amount,
            sender: flow.from,
            recipient: flow.to,
            date: new Date().toLocaleDateString(),
            txHash: 'Pending...',
            ...customFields
          })
        )
      } catch (error) {
        console.error('Failed to load document:', error)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [apiUrl, flow])

  if (loading)
    return (
      <div className='flex items-center justify-center py-4'>
        <Loader2 className='h-4 w-4 animate-spin text-ink/40' />
      </div>
    )
  if (!html) return <p className='py-4 text-center text-xs text-ink/40'>Failed to load document.</p>
  return (
    <iframe
      srcDoc={html}
      className='w-full rounded-xl border border-ink/10 bg-white'
      style={{ minHeight: 300 }}
      title={`${flow.docName} preview`}
    />
  )
}
