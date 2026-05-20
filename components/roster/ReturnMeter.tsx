'use client'

import { useEffect, useState } from 'react'

const ORIGINAL_TOTAL = 187

interface ReturnMeterProps {
  totalRoster: number
  returnedOriginal: number
  newCount: number
}

export function ReturnMeter({ totalRoster, returnedOriginal, newCount }: ReturnMeterProps) {
  const [width, setWidth] = useState(0)
  const pct = Math.min((returnedOriginal / ORIGINAL_TOTAL) * 100, 100)

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100)
    return () => clearTimeout(t)
  }, [pct])

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
            adventurers in the roster
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

      {/* Progress bar */}
      <div className="mb-1 flex justify-between items-baseline">
        <span className="text-xs" style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}>
          Original members returned
        </span>
        <span className="text-xs" style={{ color: '#8a7a5a' }}>
          {Math.round(pct)}%
        </span>
      </div>
      <div
        className="h-4 rounded-full overflow-hidden"
        style={{ backgroundColor: '#0d0b07' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${width}%`,
            background: 'linear-gradient(90deg, #c9961a 0%, #1aff6e 100%)',
            boxShadow: '0 0 12px rgba(26,255,110,0.5)',
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
