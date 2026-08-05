'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import ReceivableDetail from '../../components/start/ReceivableDetail'

function ReceivablesRoute() {
  const params = useSearchParams()
  const address = params.get('id')
  const mode = params.get('mode') === 'partner' ? 'partner' : 'company'
  return address ? <ReceivableDetail address={address} mode={mode} /> : <div className='p-8 text-center text-sm text-ink/40'>Select a receivable from the list.</div>
}

export default function ReceivablesPage() {
  return <Suspense fallback={<div className='flex min-h-[400px] items-center justify-center'><Loader2 className='h-6 w-6 animate-spin text-ink/40' /></div>}><ReceivablesRoute /></Suspense>
}
