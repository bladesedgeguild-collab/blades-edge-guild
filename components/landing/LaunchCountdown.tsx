'use client'

import { useEffect, useState } from 'react'
import { GUILD } from '@/lib/guild-config'

function getRemaining() {
  const diff = new Date(GUILD.launchAt).getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  return { days, hours, minutes }
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}>
        {String(value).padStart(2, '0')}
      </p>
      <p className="text-xs" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a7a5a' }}>
        {label}
      </p>
    </div>
  )
}

export function LaunchCountdown() {
  const [remaining, setRemaining] = useState<{ days: number; hours: number; minutes: number } | null | undefined>(undefined)

  useEffect(() => {
    setRemaining(getRemaining())
    const t = setInterval(() => setRemaining(getRemaining()), 60_000)
    return () => clearInterval(t)
  }, [])

  // undefined = not yet mounted client-side; render nothing to avoid hydration mismatch
  if (remaining === undefined) return null

  if (remaining === null) {
    return (
      <p className="text-center text-sm" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', color: '#1aff6e' }}>
        Now live in {GUILD.game}
      </p>
    )
  }

  return (
    <div className="w-full">
      <p className="text-center text-xs mb-2" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a7a5a' }}>
        {GUILD.game} launches in
      </p>
      <div className="flex justify-between items-center gap-2">
        <Unit value={remaining.days} label="Days" />
        <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: '#3d2e15' }} />
        <Unit value={remaining.hours} label="Hours" />
        <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: '#3d2e15' }} />
        <Unit value={remaining.minutes} label="Minutes" />
      </div>
    </div>
  )
}
