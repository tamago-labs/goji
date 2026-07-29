'use client'

import Overview from '../../components/start/Overview'
import { useStart } from '../../components/start/StartProvider'

export default function OverviewPage() {
  const { apiUrl, loading, error } = useStart()
  return <Overview apiUrl={apiUrl} disabled={loading || !!error} />
}
