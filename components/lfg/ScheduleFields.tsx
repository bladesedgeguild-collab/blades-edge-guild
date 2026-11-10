'use client'

import { useEffect, useState } from 'react'
import { formatRange, SERVER_TIME_ZONE, zonedWallTimeToUtc } from '@/lib/lfg-time'

export function ScheduleFields({
  date,
  start,
  end,
  onChange,
}: {
  date: string
  start: string
  end: string
  onChange: (next: { date: string; start: string; end: string }) => void
}) {
  const [timeZone, setTimeZone] = useState('')

  useEffect(() => {
    const id = window.setTimeout(() => {
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  let preview: { local: string; server: string } | null = null
  if (timeZone && date && start) {
    const startsAt = zonedWallTimeToUtc(date, start, timeZone)
    if (startsAt) {
      let endsAt = end ? zonedWallTimeToUtc(date, end, timeZone) : null
      if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
        endsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000)
      }
      preview = {
        local: formatRange(startsAt.toISOString(), endsAt?.toISOString(), timeZone),
        server: formatRange(startsAt.toISOString(), endsAt?.toISOString(), SERVER_TIME_ZONE),
      }
    }
  }

  return (
    <div className="lfg-schedule">
      <div className="lfg-time-row">
        <div className="dd-lfg-field" style={{ flex: 1 }}>
          <label className="dd-lfg-label lfg-field-label">Date</label>
          <input
            className="dd-lfg-select lfg-time-select"
            type="date"
            required
            value={date}
            onChange={event => onChange({ date: event.target.value, start, end })}
          />
        </div>
        <div className="dd-lfg-field" style={{ flex: 1 }}>
          <label className="dd-lfg-label lfg-field-label">Start (your time)</label>
          <input
            className="dd-lfg-select lfg-time-select"
            type="time"
            required
            value={start}
            onChange={event => onChange({ date, start: event.target.value, end })}
          />
        </div>
        <div className="dd-lfg-field" style={{ flex: 1 }}>
          <label className="dd-lfg-label lfg-field-label">End (optional)</label>
          <input
            className="dd-lfg-select lfg-time-select"
            type="time"
            value={end}
            onChange={event => onChange({ date, start, end: event.target.value })}
          />
        </div>
      </div>
      {preview && (
        <p className="lfg-timezone">
          <span className="lfg-tz-equiv">Your time: {preview.local}</span>
          <span className="lfg-server-hint">Server time: {preview.server}</span>
        </p>
      )}
    </div>
  )
}
