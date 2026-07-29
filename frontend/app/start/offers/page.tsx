'use client'

import OffersSection from '../../components/start/OffersSection'
import { useStart } from '../../components/start/StartProvider'

export default function OffersPage() {
  const { apiUrl, loading, error } = useStart()
  return <OffersSection apiUrl={apiUrl} disabled={loading || !!error} />
}
