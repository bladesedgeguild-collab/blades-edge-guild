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
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="mb-2 flex justify-between items-baseline">
        <span className="text-sm font-semibold" style={{ color: '#c9a84c' }}>
          {returned} of {total} members have answered the call
        </span>
        <span className="text-xs" style={{ color: '#6b7a99' }}>
          {Math.round(pct)}%
        </span>
      </div>

      <div
        className="h-4 rounded-full overflow-hidden"
        style={{ backgroundColor: '#111827' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${width}%`,
            background: 'linear-gradient(90deg, #a07830 0%, #c9a84c 50%, #e8c96e 100%)',
            boxShadow: '0 0 8px rgba(201,168,76,0.6)',
          }}
        />
      </div>

      <p className="mt-2 text-xs text-center" style={{ color: '#6b7a99' }}>
        {total - returned} still MIA — will you be next?
      </p>
    </div>
  )
}
