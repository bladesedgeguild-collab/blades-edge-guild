'use client'

import { useEffect, useState } from 'react'

const ORIGINAL_TOTAL = 286

interface ReturnMeterProps {
  totalRoster: number      // current active guildies (last_online_days < 9999)
  returnedOriginal: number // original members who returned
  newCount: number         // totalRoster - returnedOriginal
}

export function ReturnMeter({ totalRoster, returnedOriginal, newCount }: ReturnMeterProps) {
  const [animated, setAnimated] = useState(false)

  // Bar fills to totalRoster / ORIGINAL_TOTAL (286 = full guild)
  const totalFill = Math.min((totalRoster / ORIGINAL_TOTAL) * 100, 100)
  const returnedPct = totalRoster > 0
    ? (returnedOriginal / totalRoster) * totalFill
    : 0
  const newPct = totalFill - returnedPct

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const displayReturnedPct = animated ? returnedPct : 0
  const displayNewPct = animated ? newPct : 0

  const mia = ORIGINAL_TOTAL - returnedOriginal

  return (
    <div className="w-full">
      {/* Three stats row */}
      <div className="flex justify-between items-center mb-4 gap-2 text-center">
        <div className="flex-1">
          <p className="text-xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}>
            {totalRoster}
          </p>
          <p className="text-xs" style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}>
            Current Guildies
          </p>
        </div>
        <div className="w-px h-10 flex-shrink-0" style={{ backgroundColor: '#3d2e15' }} />
        <div className="flex-1">
          <p className="text-xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#1aff6e' }}>
            {returnedOriginal}
          </p>
          <p className="text-xs" style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}>
            of {ORIGINAL_TOTAL} originals back
          </p>
        </div>
        <div className="w-px h-10 flex-shrink-0" style={{ backgroundColor: '#3d2e15' }} />
        <div className="flex-1">
          <p className="text-xl font-bold" style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}>
            {newCount}
          </p>
          <p className="text-xs" style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}>
            new adventurers joined
          </p>
        </div>
      </div>

      {/* Progress bar label */}
      <div className="mb-1">
        <span className="text-xs" style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}>
          Active Blådes Edge Guildies
        </span>
      </div>

      {/* Two-div bar: green = returned originals, gold = new adventurers */}
      <div className="meter-track">
        <div
          style={{
            width: `${displayReturnedPct}%`,
            background: '#1aff6e',
            height: '100%',
            borderRadius: returnedPct > 0 ? '6px 0 0 6px' : '0',
            transition: 'width 1s ease-out',
          }}
        />
        <div
          style={{
            width: `${displayNewPct}%`,
            background: '#c9961a',
            height: '100%',
            borderRadius: newPct > 0 ? (returnedPct > 0 ? '0 6px 6px 0' : '6px') : '0',
            transition: 'width 1s ease-out',
          }}
        />
      </div>

      <p
        className="mt-2 text-xs text-center italic"
        style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
      >
        {mia} still MIA — will you be next?
      </p>
    </div>
  )
}
