'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Logo({ size = 'default' }: { size?: 'default' | 'small' }) {
  const [hoverKey, setHoverKey] = useState(0)
  const dotSize = size === 'small' ? 'w-[18px] h-[18px]' : 'w-[22px] h-[22px]'
  const marbleSize = size === 'small' ? 'w-[5px] h-[5px]' : 'w-[6px] h-[6px]'
  const textSize = size === 'small' ? 'text-xl' : 'text-2xl'

  return (
    <Link href='/' className={`font-display ${textSize} font-semibold flex items-center gap-2`}>
      <span
        className={`relative ${dotSize} rounded-full bg-mint inline-block overflow-hidden cursor-pointer`}
        onMouseEnter={() => setHoverKey((k) => k + 1)}
      >
        <span
          key={hoverKey}
          className={`absolute ${marbleSize} rounded-full bg-coral top-1/2 left-1/2`}
          style={{ animation: 'marble-orbit 2.5s ease-in-out 1 forwards' }}
        />
      </span>
      goji
    </Link>
  )
}
