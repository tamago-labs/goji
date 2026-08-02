'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface ApprovalModalProps {
  isOpen: boolean
  status: 'idle' | 'checking' | 'approving' | 'approved' | 'already-approved' | 'error'
  invoiceName: string
  amount: string
  errorMessage?: string
  onClose: () => void
  onConfirm: () => void
}

export default function ApprovalModal({
  isOpen,
  status,
  invoiceName,
  amount,
  errorMessage,
  onClose,
  onConfirm
}: ApprovalModalProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
      case 'approving':
        return <Loader2 className='w-12 h-12 text-ink/30 animate-spin' />
      case 'approved':
        return <CheckCircle className='w-12 h-12 text-[#28C840]' />
      case 'already-approved':
        return <CheckCircle className='w-12 h-12 text-mint' />
      case 'error':
        return <AlertCircle className='w-12 h-12 text-coral' />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Checking delegation status...'
      case 'approving':
        return 'Approving invoice...'
      case 'approved':
        return 'Invoice approved!'
      case 'already-approved':
        return 'Already approved'
      case 'error':
        return errorMessage || 'Approval failed'
      default:
        return 'Ready to approve'
    }
  }

  const getStatusDescription = () => {
    switch (status) {
      case 'checking':
        return 'Verifying if delegation is already set up...'
      case 'approving':
        return 'Adding delegate to your Unified Balance. This may take a moment.'
      case 'approved':
        return 'Company can now spend from your Unified Balance to pay this invoice.'
      case 'already-approved':
        return 'Delegation is already enabled. You can approve again to refresh the status.'
      case 'error':
        return 'Something went wrong. Please try again.'
      default:
        return 'Approve this invoice to allow the company to spend from your Unified Balance.'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
            className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-[0_20px_60px_rgba(43,36,64,0.2)] w-[400px] overflow-hidden'
          >
            <div className='p-6 text-center'>
              {/* Icon */}
              <div className='flex justify-center mb-4'>
                {getStatusIcon()}
              </div>

              {/* Title */}
              <h3 className='font-display text-lg font-semibold text-ink mb-2'>
                Approve Invoice
              </h3>

              {/* Invoice Details */}
              <div className='bg-ink/3 rounded-xl p-4 mb-4'>
                <div className='text-sm text-ink/70 mb-1'>{invoiceName}</div>
                <div className='text-lg font-mono font-semibold text-ink'>{amount} USDC</div>
              </div>

              {/* Status */}
              <p className='text-sm text-ink/50 mb-6'>{getStatusText()}</p>
              <p className='text-xs text-ink/40 mb-6'>{getStatusDescription()}</p>

              {/* Actions */}
              <div className='flex gap-3'>
                <button
                  onClick={onClose}
                  className='flex-1 px-4 py-2.5 text-sm text-ink/50 hover:text-ink/70 bg-ink/5 rounded-xl transition-colors'
                >
                  {status === 'approved' || status === 'already-approved' ? 'Close' : 'Cancel'}
                </button>
                {(status === 'idle' || status === 'already-approved') && (
                  <button
                    onClick={onConfirm}
                    className='flex-1 px-4 py-2.5 text-sm font-medium text-lavender bg-ink rounded-xl hover:opacity-90 transition-opacity'
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
