'use client'

import { useEffect, useState } from 'react'
import { GUILD } from '@/lib/guild-config'

interface FoundersMeterProps {
  swornCount: number
}

export function FoundersMeter({ swornCount }: FoundersMeterProps) {
  const [width, setWidth] = useState(0)
  const pct = Math.min((swornCount / GUILD.foundersGoal) * 100, 100)

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div className="w-full">
      <div className="mb-1">
        <span className="text-xs" style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}>
          Founding Members Sworn: {swornCount} of {GUILD.foundersGoal}
        </span>
      </div>
      <div className="meter-track">
        <div className="meter-bar" style={{ width: `${width}%`, background: '#c9961a' }} />
      </div>
    </div>
  )
}
