'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StartRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/start/overview')
  }, [router])
  return (
    <div className='flex items-center justify-center min-h-[50vh]'>
      <div className='w-10 h-10 border-2 border-ink/20 border-t-ink/60 rounded-full animate-spin' />
    </div>
  )
}
