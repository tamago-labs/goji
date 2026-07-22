'use client'

import { useState, useEffect } from 'react'
import ChatPanel from './ChatPanel'

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [connected, setConnected] = useState(false)
  const [unread, setUnread] = useState(0)
  const [apiUrl, setApiUrl] = useState('')

  // Check connection and read API URL
  useEffect(() => {
    const url = localStorage.getItem('goji-api-url') || 'http://localhost:3001'
    setApiUrl(url)

    async function check() {
      try {
        const res = await fetch(`${url}/api/health`)
        setConnected(res.ok)
      } catch {
        setConnected(false)
      }
    }
    check()
  }, [])

  // WebSocket for unread count
  useEffect(() => {
    if (!connected || !apiUrl) return
    const wsUrl = apiUrl.replace('http', 'ws')
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'chat:message' && !isOpen) {
          setUnread((prev) => prev + 1)
        }
      } catch {}
    }

    return () => ws.close()
  }, [connected, isOpen, apiUrl])

  const handleOpen = () => {
    setIsOpen(true)
    setUnread(0)
  }

  if (!connected) return null

  return (
    <>
      <button
        onClick={handleOpen}
        className='fixed right-6 bottom-6 z-40 w-12 h-12 rounded-full bg-coral text-white shadow-[0_4px_20px_rgba(255,138,115,0.4)] hover:bg-coral/90 transition-colors flex items-center justify-center'
        title='Team Chat'
      >
        <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
        </svg>
        {unread > 0 && (
          <span className='absolute -top-1 -right-1 w-5 h-5 bg-coral text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card'>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
