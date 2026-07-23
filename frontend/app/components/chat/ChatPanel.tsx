'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'

interface ChatMessage {
  id: string
  text: string
  info: {
    name: string
    key: string
    at: number
  }
}

interface Peer {
  key: string
  name: string
  updatedAt: number
}

const AVATAR_COLORS = ['#7FD9B0', '#8B7FD6', '#FF8A73', '#C97A3D', '#7DA6C9', '#9DC98A']

function getAvatarColor(key: string) {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ChatPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [peers, setPeers] = useState<Peer[]>([])
  const [input, setInput] = useState('')
  const [myKey, setMyKey] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { address } = useAccount()

  // Read API URL from localStorage on mount and when panel opens
  useEffect(() => {
    if (isOpen) {
      const url = localStorage.getItem('goji-api-url') || 'http://localhost:3001'
      setApiUrl(url)
      // Clear state when switching terminals
      setMessages([])
      setPeers([])
      setMyKey('')
    }
  }, [isOpen])

  // Load initial data when API URL is set
  useEffect(() => {
    if (!isOpen || !apiUrl) return
    async function load() {
      try {
        const [chatRes, peersRes] = await Promise.all([
          fetch(`${apiUrl}/api/chat`),
          fetch(`${apiUrl}/api/peers`)
        ])
        if (chatRes.ok) setMessages(await chatRes.json())
        if (peersRes.ok) setPeers(await peersRes.json())
        const healthRes = await fetch(`${apiUrl}/api/health`)
        if (healthRes.ok) {
          const h = await healthRes.json()
          setMyKey(h.peerId)
        }
      } catch {}
    }
    load()
  }, [isOpen, apiUrl])

  // WebSocket for real-time chat
  useEffect(() => {
    if (!isOpen || !apiUrl) return
    const wsUrl = apiUrl.replace('http', 'ws')
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'chat:message') {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.message.id)) return prev
            return [...prev, msg.message]
          })
        } else if (msg.type === 'chat:deleted') {
          setMessages((prev) => prev.filter((m) => m.id !== msg.id))
        }
      } catch {}
    }

    return () => ws.close()
  }, [isOpen, apiUrl])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    const text = input.trim()
    setInput('')
    try {
      await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
    } catch {}
  }

  const deleteMessage = async (id: string) => {
    try {
      await fetch(`${apiUrl}/api/chat/${id}`, { method: 'DELETE' })
    } catch {}
  }

  const isOwnMessage = (msg: ChatMessage) => msg.info.key === myKey

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/20 z-50'
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className='fixed right-0 top-0 bottom-0 w-[480px] bg-card shadow-[-10px_0_40px_rgba(43,36,64,0.15)] z-50 flex flex-col'
          >
            {/* Header */}
            <div className='flex items-center justify-between px-5 py-4 border-b border-ink/8'>
              <h3 className='font-display text-base font-semibold'>Team Chat</h3>
              <button
                onClick={onClose}
                className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'
              >
                &times;
              </button>
            </div>

            <div className='flex flex-1 overflow-hidden'>
              {/* Users sidebar */}
              <div className='w-[100px] border-r border-ink/8 py-4 px-3 overflow-y-auto'>
                <p className='text-[10px] text-ink/30 uppercase tracking-wider mb-3 px-1'>Users</p>
                {peers.map((peer) => (
                  <div key={peer.key} className='flex items-center gap-2 mb-3 px-1'>
                    <span className='w-2 h-2 rounded-full bg-[#28C840] flex-shrink-0' />
                    <span className='text-[11px] text-ink/60 truncate'>{peer.name}</span>
                  </div>
                ))}
              </div>

              {/* Messages */}
              <div className='flex-1 flex flex-col'>
                <div className='flex-1 overflow-y-auto p-4 space-y-3'>
                  {messages.length === 0 && (
                    <div className='flex items-center justify-center h-full'>
                      <p className='text-ink/30 text-sm'>No messages yet</p>
                    </div>
                  )}
                  {messages
                    .slice()
                    .sort((a, b) => a.info.at - b.info.at)
                    .map((msg) => {
                    const isMe = isOwnMessage(msg)
                    return (
                      <div key={msg.id} className={`group flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <div
                          className='w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-medium'
                          style={{ backgroundColor: getAvatarColor(msg.info.key) }}
                        >
                          {getInitials(msg.info.name)}
                        </div>
                        <div className={`max-w-[75%] ${isMe ? 'text-right' : ''}`}>
                          <div className={`flex items-baseline gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className='text-[11px] font-medium text-ink/70'>{msg.info.name}</span>
                            {!isMe && 'verified' in msg.info && (
                              <span
                                className={`text-[9px] ${msg.info.verified ? 'text-[#28C840]' : 'text-coral'}`}
                                title={msg.info.verified ? 'Signature verified' : 'Signature invalid'}
                              >
                                {msg.info.verified ? '● verified' : '○ unverified'}
                              </span>
                            )}
                            <span className='text-[10px] text-ink/30'>{formatTime(msg.info.at)}</span>
                          </div>
                          <div className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-mint/20 text-ink rounded-tr-sm'
                              : 'bg-ink/5 text-ink/80 rounded-tl-sm'
                          }`}>
                            {msg.text}
                          </div>
                          {isMe && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className='opacity-0 group-hover:opacity-100 text-ink/30 hover:text-coral mt-1 transition-opacity'
                            >
                              <svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className='p-4 border-t border-ink/8'>
                  <div className='flex gap-2'>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder='Type a message...'
                      className='flex-1 bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:border-ink/20'
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim()}
                      className='w-10 h-10 rounded-xl bg-ink text-lavender flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30'
                    >
                      <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8' />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
