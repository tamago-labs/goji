'use client'

import { useRef, useState, useCallback, type ReactNode } from 'react'

interface CanvasProps {
  children: ReactNode
  zoom: number
  onZoomChange: (zoom: number) => void
}

export default function Canvas({ children, zoom, onZoomChange }: CanvasProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.closest('[data-card]') ||
        target.closest('[data-port]') ||
        target.closest('button')
      ) {
        return
      }
      setIsPanning(true)
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
    },
    [pan]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y)
      })
    },
    [isPanning]
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const factor = Math.exp(-e.deltaY * 0.001)
      const newZoom = Math.min(3, Math.max(0.25, zoom * factor))
      onZoomChange(newZoom)
    },
    [zoom, onZoomChange]
  )

  return (
    <div
      ref={surfaceRef}
      className='w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none'
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div
        className='relative origin-top-left'
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          minWidth: 4000,
          minHeight: 4000
        }}
      >
        {/* Dot grid pattern */}
        <div
          className='absolute inset-0 pointer-events-none'
          style={{
            backgroundImage: 'radial-gradient(circle, #2B244010 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        {children}
      </div>
    </div>
  )
}
