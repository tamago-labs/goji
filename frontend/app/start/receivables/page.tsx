'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ReceivablesPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/start/receivables/list')
  }, [router])

  return null
}
