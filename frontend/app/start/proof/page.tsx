'use client'

import { useState, useEffect } from 'react'
import { Search, CheckCircle, ExternalLink, XCircle, FileText, X } from 'lucide-react'
import { usePublicClient } from 'wagmi'
import { useStart } from '../../components/start/StartProvider'
import { GOJIPROOF_ABI } from '../../../lib/gojiProof'

interface Card {
  id: string
  title: string
  fields?: Record<string, string | boolean>
}

interface Connection {
  id: string
  boardId: string
  from: string
  to: string
  label: string
  amount: string
  docName: string
  template: string
  txHash: string
}

interface FlowStatus {
  id: string
  flowId: string
  routeId: string
  status: string
  txHash: string | null
  merkleRoot: string | null
  payslipHtml: string | null
  updatedAt: number
}

interface ProofDetail {
  merkleRoot: string
  timestamp: number
  block: string
  contract: string
  verified: boolean
  documentHtml: string | null
  fromName: string
  toName: string
  amount: string
  docName: string
}

export default function ProofPage() {
  const { apiUrl } = useStart()
  const publicClient = usePublicClient()
  const [searchHash, setSearchHash] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [verifiedProof, setVerifiedProof] = useState<ProofDetail | null>(null)
  const [proofs, setProofs] = useState<(FlowStatus & { connection?: Connection; fromName?: string; toName?: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const boardsRes = await fetch(`${apiUrl}/api/boards`)
        if (!boardsRes.ok) { setLoading(false); return }
        const boards = await boardsRes.json()

        const allProofs: (FlowStatus & { connection?: Connection; fromName?: string; toName?: string })[] = []
        for (const board of boards) {
          const [statusRes, connRes, cardsRes] = await Promise.all([
            fetch(`${apiUrl}/api/flow-status?flowId=${board.id}`),
            fetch(`${apiUrl}/api/connections?boardId=${board.id}`),
            fetch(`${apiUrl}/api/cards?boardId=${board.id}`)
          ])

          if (statusRes.ok) {
            const statuses = await statusRes.json()
            const connections: Connection[] = connRes.ok ? await connRes.json() : []
            const cards: Card[] = cardsRes.ok ? await cardsRes.json() : []
            const connMap = new Map(connections.map(c => [c.id, c]))
            const cardMap = new Map(cards.map(c => [c.id, c]))

            for (const s of statuses.filter((s: FlowStatus) => s.merkleRoot)) {
              const conn = connMap.get(s.routeId)
              const fromCard = conn ? cardMap.get(conn.from) : undefined
              const toCard = conn ? cardMap.get(conn.to) : undefined
              allProofs.push({
                ...s,
                connection: conn,
                fromName: fromCard?.title || 'Unknown',
                toName: toCard?.title || 'Unknown'
              })
            }
          }
        }
        setProofs(allProofs)
      } catch {}
      setLoading(false)
    }
    load()
  }, [apiUrl])

  const handleVerify = async (hash?: string) => {
    const searchValue = hash || searchHash
    if (!searchValue.trim()) return
    setVerifying(true)

    try {
      const found = proofs.find((p) => p.merkleRoot === searchValue)
      let onChainVerified = false
      let blockNumber = '—'
      let timestamp = found?.updatedAt || Date.now()

      // Verify on-chain via GojiProof contract
      if (publicClient && searchValue) {
        try {
          const result = await publicClient.readContract({
            address: '0x9465a4C246D44F32F391Ebda165Acb12886746Ca',
            abi: GOJIPROOF_ABI,
            functionName: 'isAnchored',
            args: [searchValue as `0x${string}`]
          })
          onChainVerified = result as boolean

          if (onChainVerified) {
            // Get full document record for block/timestamp info
            const doc = await publicClient.readContract({
              address: '0x9465a4C246D44F32F391Ebda165Acb12886746Ca',
              abi: GOJIPROOF_ABI,
              functionName: 'getDocument',
              args: [searchValue as `0x${string}`]
            }) as { merkleRoot: string; connectionId: string; submitter: string; timestamp: bigint }
            timestamp = Number(doc.timestamp) * 1000
          }
        } catch (e) {
          console.error('On-chain verification failed:', e)
        }
      }

      setVerifiedProof({
        merkleRoot: searchValue,
        timestamp,
        block: blockNumber,
        contract: '0x9465a4C246D44F32F391Ebda165Acb12886746Ca',
        verified: onChainVerified,
        documentHtml: found?.payslipHtml || null,
        fromName: found?.fromName || 'Unknown',
        toName: found?.toName || 'Unknown',
        amount: found?.connection?.amount || '—',
        docName: found?.connection?.docName || 'Document'
      })
      setShowModal(true)
    } catch (err) {
      console.error('Verification failed:', err)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div>
      <h2 className='font-display text-xl font-semibold mb-4'>Proof Explorer</h2>

      {/* Search Bar */}
      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6 mb-6'>
        <div className='flex gap-3'>
          <div className='flex-1 relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30' />
            <input
              value={searchHash}
              onChange={(e) => setSearchHash(e.target.value)}
              placeholder='Enter merkle proof hash to verify...'
              className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-ink/20 font-mono'
            />
          </div>
          <button
            onClick={() => handleVerify()}
            disabled={!searchHash.trim() || verifying}
            className='px-4 py-2 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-30'
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>

      {/* Proofs List */}
      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden'>
        <div className='px-6 py-3 border-b border-ink/8'>
          <span className='text-xs text-ink/40 uppercase tracking-wider'>Your Proofs ({proofs.length})</span>
        </div>

        {loading ? (
          <div className='flex items-center justify-center min-h-[200px]'>
            <div className='w-6 h-6 border-2 border-ink/20 border-t-ink/60 rounded-full animate-spin' />
          </div>
        ) : proofs.length === 0 ? (
          <div className='p-8 text-center'>
            <FileText className='w-8 h-8 text-ink/20 mx-auto mb-2' />
            <p className='text-ink/40 text-sm font-medium mb-1'>No proofs yet</p>
            <p className='text-ink/30 text-xs'>Proofs are generated when payments settle.</p>
          </div>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-ink/5 text-left'>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Date</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Document</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>From</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>To</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Amount</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Status</th>
                <th className='px-6 py-2 text-[10px] text-ink/40 uppercase tracking-wider font-medium'></th>
              </tr>
            </thead>
            <tbody>
              {proofs.map((proof) => (
                <tr key={proof.id} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                  <td className='px-6 py-3 text-ink/50 text-xs whitespace-nowrap'>
                    {new Date(proof.updatedAt).toLocaleDateString()}
                  </td>
                  <td className='px-6 py-3 text-ink/70 text-sm'>
                    {proof.connection?.docName || 'Document'}
                  </td>
                  <td className='px-6 py-3 text-ink/60 text-xs max-w-[120px] truncate' title={proof.fromName}>
                    {proof.fromName || '—'}
                  </td>
                  <td className='px-6 py-3 text-ink/60 text-xs max-w-[120px] truncate' title={proof.toName}>
                    {proof.toName || '—'}
                  </td>
                  <td className='px-6 py-3 font-mono text-ink/60 text-sm'>
                    {proof.connection?.amount ? `${proof.connection.amount} USDC` : '—'}
                  </td>
                  <td className='px-6 py-3'>
                    <span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-mint/15 text-[#1B7A50]'>
                      Anchored
                    </span>
                  </td>
                  <td className='px-6 py-3'>
                    <button
                      onClick={() => handleVerify(proof.merkleRoot || '')}
                      className='text-[10px] text-mint hover:text-[#1B7A50] font-medium transition-colors'
                    >
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Verification Modal */}
      {showModal && verifiedProof && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <div className='absolute inset-0 bg-black/40' onClick={() => setShowModal(false)} />
          <div className='relative bg-card rounded-2xl shadow-[0_20px_60px_rgba(43,36,64,0.25)] w-[560px] max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150'>
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-4 border-b border-ink/8'>
              <h3 className='font-display text-lg font-semibold'>Proof Verification</h3>
              <button
                onClick={() => setShowModal(false)}
                className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'
              >
                <X className='w-4 h-4' />
              </button>
            </div>

            {/* Content */}
            <div className='flex-1 overflow-y-auto p-6'>
              {/* Status */}
              <div className='flex items-center gap-2 mb-5'>
                {verifiedProof.verified ? (
                  <CheckCircle className='w-5 h-5 text-[#28C840]' />
                ) : (
                  <XCircle className='w-5 h-5 text-coral' />
                )}
                <span className={`text-base font-semibold ${verifiedProof.verified ? 'text-[#28C840]' : 'text-coral'}`}>
                  {verifiedProof.verified ? 'Verified on Arc' : 'Not Found'}
                </span>
              </div>

              {/* Document Info */}
              <div className='bg-ink/[0.02] rounded-xl p-4 mb-4'>
                <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-2'>Document</div>
                <div className='text-sm font-medium text-ink mb-2'>{verifiedProof.docName}</div>
                <div className='grid grid-cols-2 gap-3 text-xs'>
                  <div>
                    <span className='text-ink/40'>From: </span>
                    <span className='text-ink/70'>{verifiedProof.fromName}</span>
                  </div>
                  <div>
                    <span className='text-ink/40'>To: </span>
                    <span className='text-ink/70'>{verifiedProof.toName}</span>
                  </div>
                </div>
                {verifiedProof.amount && verifiedProof.amount !== '—' && (
                  <div className='mt-2 text-xs'>
                    <span className='text-ink/40'>Amount: </span>
                    <span className='text-ink font-semibold'>{verifiedProof.amount} USDC</span>
                  </div>
                )}
              </div>

              {/* Proof Details */}
              <div className='grid grid-cols-2 gap-3 mb-4'>
                <div className='bg-ink/[0.02] rounded-xl p-3'>
                  <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Merkle Root</div>
                  <div className='text-[11px] text-ink font-mono break-all leading-relaxed'>{verifiedProof.merkleRoot}</div>
                </div>
                <div className='bg-ink/[0.02] rounded-xl p-3'>
                  <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Timestamp</div>
                  <div className='text-[11px] text-ink'>{new Date(verifiedProof.timestamp).toLocaleString()}</div>
                </div>
                <div className='bg-ink/[0.02] rounded-xl p-3'>
                  <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Block</div>
                  <div className='text-[11px] text-ink font-mono'>{verifiedProof.block}</div>
                </div>
                <div className='bg-ink/[0.02] rounded-xl p-3'>
                  <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-1'>Contract</div>
                  <div className='text-[11px] text-ink font-mono break-all leading-relaxed'>{verifiedProof.contract}</div>
                </div>
              </div>

              {/* Document Preview */}
              {verifiedProof.documentHtml && (
                <div className='mb-4'>
                  <div className='text-[10px] text-ink/40 uppercase tracking-wider mb-2'>Document Preview</div>
                  <div className='bg-white rounded-xl border border-ink/10 overflow-hidden'>
                    <iframe
                      srcDoc={verifiedProof.documentHtml}
                      className='w-full'
                      style={{ minHeight: 220 }}
                      title='Document Preview'
                    />
                  </div>
                </div>
              )}

              <a
                href={`https://testnet.arcscan.app/address/${verifiedProof.contract}`}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 text-xs text-mint hover:text-[#1B7A50] font-medium transition-colors'
              >
                View on Arc Explorer
                <ExternalLink className='w-3 h-3' />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
