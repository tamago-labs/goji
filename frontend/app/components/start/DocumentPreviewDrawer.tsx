'use client'

import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Printer, X } from 'lucide-react'

interface DocumentPreviewDrawerProps {
  open: boolean
  title: string
  html: string
  onClose: () => void
}

export default function DocumentPreviewDrawer({ open, title, html, onClose }: DocumentPreviewDrawerProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)

  function print() {
    frameRef.current?.contentWindow?.print()
  }

  function download() {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${title.replace(/\s+/g, '_')}.html`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <AnimatePresence>{open && <>
    <motion.div className='fixed inset-0 z-50 bg-black/30' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.aside className='fixed inset-y-0 right-0 z-50 flex w-full max-w-[760px] flex-col bg-card shadow-[-20px_0_60px_rgba(43,36,64,0.18)]' initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.2 }}>
      <header className='flex items-center justify-between border-b border-ink/8 px-6 py-4'>
        <h2 className='font-display text-lg font-semibold text-ink'>{title}</h2>
        <div className='flex items-center gap-1'><button type='button' onClick={print} className='flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-ink/55 hover:bg-ink/5'><Printer className='h-3.5 w-3.5' />Print</button><button type='button' onClick={download} className='flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-ink/55 hover:bg-ink/5'><Download className='h-3.5 w-3.5' />Download</button><button type='button' onClick={onClose} className='rounded-lg p-2 text-ink/35 hover:bg-ink/5'><X className='h-4 w-4' /></button></div>
      </header>
      <div className='min-h-0 flex-1 overflow-y-auto bg-ink/[0.02] p-5'><iframe ref={frameRef} srcDoc={html} title={`${title} Preview`} className='min-h-[calc(100vh-110px)] w-full rounded-xl border border-ink/10 bg-white' /></div>
    </motion.aside>
  </>}</AnimatePresence>
}
