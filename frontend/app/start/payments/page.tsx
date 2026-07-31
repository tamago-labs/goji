'use client'

import HistorySection from '../../components/start/HistorySection'
import { useStart } from '../../components/start/StartProvider'

export default function PaymentsPage() {
  const { apiUrl } = useStart()
  return <HistorySection apiUrl={apiUrl} />
}
