'use client'

import BoardsList from '../../components/start/BoardsList'
import { useStart } from '../../components/start/StartProvider'

export default function WorkflowsPage() {
  const { boards, loading, error, flowStatuses } = useStart()
  return <BoardsList boards={boards} disabled={loading || !!error} flowStatuses={flowStatuses} />
}
