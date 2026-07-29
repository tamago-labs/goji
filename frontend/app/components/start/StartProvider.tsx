'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

const DEFAULT_URL = 'http://localhost:3001'

interface Health {
  status: string
  name: string
  peerId: string
  role: string
  writable: boolean
  peers: number
  port: number
}

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

interface StartContextType {
  apiUrl: string
  setApiUrl: (url: string) => void
  health: Health | null
  setHealth: (health: Health | null) => void
  boards: Board[]
  flowStatuses: FlowStatus[]
  loading: boolean
  error: string | null
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  refreshData: () => Promise<void>
}

const StartContext = createContext<StartContextType | null>(null)

export function useStart() {
  const ctx = useContext(StartContext)
  if (!ctx) throw new Error('useStart must be used within StartProvider')
  return ctx
}

export function StartProvider({ children }: { children: ReactNode }) {
  const [apiUrl, setApiUrlState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_URL
    return localStorage.getItem('goji-api-url') || DEFAULT_URL
  })
  const [health, setHealth] = useState<Health | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [flowStatuses, setFlowStatuses] = useState<FlowStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setApiUrl = (url: string) => {
    localStorage.setItem('goji-api-url', url)
    setApiUrlState(url)
    setHealth(null)
    setBoards([])
    setFlowStatuses([])
    setLoading(true)
    setError(null)
  }

  const fetchData = useCallback(async (url: string) => {
    try {
      const res = await fetch(`${url}/api/health`)
      if (res.ok) {
        const data = await res.json()
        setHealth(data)
        setError(null)

        const boardsRes = await fetch(`${url}/api/boards`)
        if (boardsRes.ok) {
          const boardsData = await boardsRes.json()
          setBoards(boardsData)

          const allStatuses: FlowStatus[] = []
          for (const board of boardsData) {
            try {
              const statusRes = await fetch(`${url}/api/flow-status?flowId=${board.id}`)
              if (statusRes.ok) {
                const statuses = await statusRes.json()
                allStatuses.push(...statuses.map((s: FlowStatus) => ({ flowId: s.flowId, routeId: s.routeId, status: s.status })))
              }
            } catch {}
          }
          setFlowStatuses(allStatuses)
        }
        return true
      }
    } catch {}
    return false
  }, [])

  const refreshData = useCallback(async () => {
    await fetchData(apiUrl)
  }, [apiUrl, fetchData])

  useEffect(() => {
    let cancelled = false
    async function connect() {
      setLoading(true)
      for (let i = 0; i < 10; i++) {
        if (cancelled) return
        const ok = await fetchData(apiUrl)
        if (ok && !cancelled) {
          setLoading(false)
          return
        }
        await new Promise((r) => setTimeout(r, 1000))
      }
      if (!cancelled) {
        setError('Could not establish a connection. Check that your terminal is running on the correct port and accessible from Chrome browser.')
        setLoading(false)
      }
    }
    connect()
    return () => { cancelled = true }
  }, [apiUrl, fetchData])

  return (
    <StartContext.Provider value={{ apiUrl, setApiUrl, health, setHealth, boards, flowStatuses, loading, error, setError, setLoading, refreshData }}>
      {children}
    </StartContext.Provider>
  )
}
