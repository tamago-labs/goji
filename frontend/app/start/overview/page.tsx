'use client'

import Overview from '../../components/start/Overview'
import { useStart } from '../../components/start/StartProvider'

export default function OverviewPage() {
  const { apiUrl, health } = useStart()
  return <Overview apiUrl={apiUrl} role={health?.role} />
}
