'use client'

import MembersTab from '../../../components/start/MembersTab'
import { useStart } from '../../../components/start/StartProvider'

export default function MembersPage() {
  const { apiUrl, health } = useStart()
  return <MembersTab apiUrl={apiUrl} currentWriterKey={health?.peerIdHex} />
}
