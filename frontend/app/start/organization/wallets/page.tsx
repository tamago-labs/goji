'use client'

import WalletsTab from '../../../components/start/WalletsTab'
import { useStart } from '../../../components/start/StartProvider'

export default function WalletsPage() {
  const { apiUrl } = useStart()
  return <WalletsTab apiUrl={apiUrl} />
}
