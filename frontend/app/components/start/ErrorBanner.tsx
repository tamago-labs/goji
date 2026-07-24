'use client'

interface ErrorBannerProps {
  message: string
  onRetry: () => void
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className='bg-coral/10 border border-coral/20 rounded-2xl p-5 mb-10 flex items-center justify-between'>
      <p className='text-sm text-ink/70'>{message}</p>
      <button
        onClick={onRetry}
        className='shrink-0 ml-4 text-xs text-ink/40 hover:text-ink/70 transition-colors'
      >
        Retry
      </button>
    </div>
  )
}
