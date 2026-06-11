'use client'

import { useEffect, useState } from 'react'

const ORIGINAL_TOTAL = 187
const GUILD_MAX = 200

interface ReturnMeterProps {
  totalRoster: number      // current active guildies (last_online_days < 9999)
  returnedOriginal: number // original members who returned
  newCount: number         // totalRoster - returnedOriginal
}

export function ReturnMeter({ totalRoster, returnedOriginal, newCount }: ReturnMeterProps) {
  const [width, setWidth] = useState(0)

  // Bar fills based on current guildies out of GUILD_MAX
  const fillPct = Math.min((totalRoster / GUILD_MAX) * 100, 100)
  // Where the green→gold split falls within the filled bar
  const returnedPct = totalRoster > 0
    ? Math.min((returnedOriginal / totalRoster) * 100, 100)
    : 0

  useEffect(() => {
    const t = setTimeout(() => setWidth(fillPct), 100)
    return () => clearTimeout(t)
  }, [fillPct])

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

      {/* Bar: fills to currentGuildies/200; green = returned, gold = new */}
      <div
        className="h-4 rounded-full overflow-hidden"
        style={{ backgroundColor: '#0d0b07' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(to right,
              #1aff6e 0%,
              #1aff6e ${returnedPct}%,
              #c9961a ${returnedPct}%,
              #c9961a 100%
            )`,
            boxShadow: '0 0 12px rgba(26,255,110,0.4)',
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
