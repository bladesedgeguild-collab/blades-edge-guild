'use client'

import { useEffect, useState } from 'react'

interface ReturnMeterProps {
  total: number
  returned: number
}

export function ReturnMeter({ total, returned }: ReturnMeterProps) {
  const [width, setWidth] = useState(0)
  const pct = total > 0 ? (returned / total) * 100 : 0

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div
      className="w-full rounded-xl px-6 py-5"
      style={{ backgroundColor: '#241a0e' }}
    >
      <div className="mb-3 flex justify-between items-baseline">
        <span
          className="text-sm font-semibold"
          style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
        >
          {returned} of {total} members have answered the call
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
        {total - returned} still MIA — will you be next?
      </p>
    </div>
  )
}
