'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'

interface Board {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

interface FlowStatus {
  flowId: string
  routeId: string
  status: string
}

interface BoardsGridProps {
  boards: Board[]
  disabled: boolean
  flowStatuses?: FlowStatus[]
}

export default function BoardsGrid({ boards, disabled, flowStatuses = [] }: BoardsGridProps) {
  const getBoardStatus = (boardId: string) => {
    const statuses = flowStatuses.filter((s) => s.flowId === boardId)
    if (statuses.length === 0) return null

    const routeMap = new Map<string, string>()
    for (const s of statuses) {
      routeMap.set(s.routeId, s.status)
    }

    const totalRoutes = routeMap.size
    if (totalRoutes === 0) return null

    const settled = Array.from(routeMap.values()).filter((s) => s === 'settled').length
    const failed = Array.from(routeMap.values()).filter((s) => s === 'failed').length
    const pending = totalRoutes - settled - failed

    if (settled === totalRoutes) {
      return { label: 'Completed', color: 'bg-[#28C840]/20 text-[#1B7A50]', detail: `${settled} paid` }
    }
    if (failed === totalRoutes) {
      return { label: 'Failed', color: 'bg-coral/20 text-[#C24E33]', detail: `${failed} failed` }
    }
    if (pending > 0 && settled > 0) {
      return { label: 'In Progress', color: 'bg-blue-100 text-blue-700', detail: `${settled}/${totalRoutes} paid` }
    }
    if (pending > 0) {
      return { label: 'Pending', color: 'bg-ink/10 text-ink/40', detail: `${pending} to sign` }
    }
    return null
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-display text-xl font-semibold'>Workflows</h2>
        <Link
          href='/flow/view?id=new&type=blank'
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-ink text-lavender text-xs font-medium rounded-xl hover:opacity-90 transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Plus className='w-3.5 h-3.5' />
          New Flow
        </Link>
      </div>

      {boards.length === 0 ? (
        <div className='bg-card rounded-2xl p-8 shadow-[0_4px_20px_rgba(43,36,64,0.06)] text-center'>
          <p className='text-ink/40 text-sm'>No flows yet. Create your first one above.</p>
        </div>
      ) : (
        <div className={`bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] overflow-hidden ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-ink/5 text-left'>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Name</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Status</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Routes</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'>Created</th>
                <th className='px-6 py-3 text-[10px] text-ink/40 uppercase tracking-wider font-medium'></th>
              </tr>
            </thead>
            <tbody>
              {boards.map((board) => {
                const status = getBoardStatus(board.id)
                return (
                  <tr key={board.id} className='border-b border-ink/5 hover:bg-ink/3 transition-colors'>
                    <td className='px-6 py-3 text-ink/70 text-sm font-medium'>{board.name}</td>
                    <td className='px-6 py-3'>
                      {status ? (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      ) : (
                        <span className='text-[10px] text-ink/30'>—</span>
                      )}
                    </td>
                    <td className='px-6 py-3 text-ink/50 text-xs'>
                      {status ? status.detail : '—'}
                    </td>
                    <td className='px-6 py-3 text-ink/50 text-xs'>
                      {new Date(board.createdAt).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-3'>
                      <Link
                        href={`/flow/view?id=${board.id}`}
                        className='text-[10px] text-mint hover:text-[#1B7A50] font-medium transition-colors'
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
