'use client'

import { useEffect, useState } from 'react'

const ORIGINAL_TOTAL = 286

interface ReturnMeterProps {
  totalRoster: number
  returnedOriginal: number
  newCount: number
}

export function ReturnMeter({ totalRoster, returnedOriginal, newCount }: ReturnMeterProps) {
  const [width, setWidth] = useState(0)

  const totalFill = Math.min((totalRoster / ORIGINAL_TOTAL) * 100, 100)
  // returnedPct = percentage of the bar that is green (within the filled area)
  const returnedPct = totalRoster > 0
    ? (returnedOriginal / totalRoster) * 100
    : 0

  useEffect(() => {
    const t = setTimeout(() => setWidth(totalFill), 100)
    return () => clearTimeout(t)
  }, [totalFill])

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

      {/* Gradient bar: green (returned) blends into gold (new) */}
      <div className="meter-track">
        <div
          className="meter-bar"
          style={{
            width: `${width}%`,
            background: `linear-gradient(to right,
              #1aff6e 0%,
              #1aff6e ${Math.max(0, returnedPct - 4)}%,
              #8adf6a ${returnedPct}%,
              #d4a830 ${Math.min(100, returnedPct + 4)}%,
              #c9961a 100%
            )`,
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
