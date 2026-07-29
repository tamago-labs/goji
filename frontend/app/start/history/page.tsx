'use client'

import HistorySection from '../../components/start/HistorySection'
import { useStart } from '../../components/start/StartProvider'

export default function HistoryPage() {
  const { apiUrl, loading, error } = useStart()
  return <HistorySection apiUrl={apiUrl} disabled={loading || !!error} />
}
