'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface UsernameModalProps {
  isOpen: boolean
  onClose: () => void
  currentName: string
  apiUrl: string
  onNameChange: (name: string) => void
}

export default function UsernameModal({
  isOpen,
  onClose,
  currentName,
  apiUrl,
  onNameChange
}: UsernameModalProps) {
  const [usernameInput, setUsernameInput] = useState(currentName)

  useEffect(() => {
    if (isOpen) setUsernameInput(currentName)
  }, [isOpen, currentName])

  const saveUsername = async () => {
    if (!usernameInput.trim()) return
    try {
      await fetch(`${apiUrl}/api/username`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: usernameInput.trim() })
      })
    } catch {}
    onNameChange(usernameInput.trim())
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/30 z-50'
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-2xl shadow-[0_20px_60px_rgba(43,36,64,0.2)] p-6 w-[380px]'
          >
            <div className='flex items-center justify-between mb-5'>
              <h3 className='font-display text-lg font-semibold'>Change Username</h3>
              <button
                onClick={onClose}
                className='w-7 h-7 rounded-lg hover:bg-ink/5 flex items-center justify-center text-ink/30 hover:text-ink/60 transition-colors'
              >
                &times;
              </button>
            </div>

            <label className='block mb-5'>
              <span className='text-xs text-ink/40 mb-1.5 block'>Display name</span>
              <input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveUsername()}
                className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
                placeholder='Your name'
                autoFocus
              />
            </label>

            <div className='flex justify-end gap-2'>
              <button
                onClick={onClose}
                className='px-4 py-2 text-xs text-ink/50 hover:text-ink/70 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={saveUsername}
                className='px-4 py-2 bg-ink text-lavender text-xs font-medium rounded-xl hover:opacity-90 transition-opacity'
              >
                Save
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
