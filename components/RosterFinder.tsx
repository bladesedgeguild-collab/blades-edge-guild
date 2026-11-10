'use client'

import { useEffect, useState } from 'react'
import { fullName } from '@/lib/names'
import { displayRace } from '@/lib/guild-config'

export type RosterPick = {
  id: string
  name: string
  last_name: string | null
  class: string
  race: string | null
  level: number
  rank_name: string | null
}

const CLASS_COLORS: Record<string, string> = {
  MAGE: '#3fc7eb', PALADIN: '#f48cba', WARRIOR: '#c69b3a', PRIEST: '#ffffff', DRUID: '#ff7c0a',
  HUNTER: '#aad372', ROGUE: '#fff468', WARLOCK: '#8788ee', SHAMAN: '#0070dd',
}

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()

/**
 * "Find your name" search over unclaimed characters imported from the guild
 * roster (GRM upload on /officers). Members who joined in game and visit after
 * a roster refresh can claim their character instead of typing it out.
 */
export function RosterFinder({ onPick, disabled, pickLabel = 'This is me' }: {
  onPick: (c: RosterPick) => void
  disabled?: boolean
  pickLabel?: string
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<RosterPick[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setResults([]); setSearched(false); return }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/characters/search?unclaimed=true&q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        const data = await res.json()
        setResults(data.characters ?? [])
        setSearched(true)
      } catch { /* aborted */ }
      finally { setSearching(false) }
    }, 250)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [q])

  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ fontFamily: 'var(--be-font-display)', fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(201,150,26,0.8)', marginBottom: 6, display: 'block' }}>
        Already in the guild? Find your name
      </label>
      <input
        type="search" autoComplete="off" placeholder="Start typing your character's name…"
        value={q} onChange={(e) => setQ(e.target.value)}
        style={{ width: '100%', padding: '12px 16px', background: 'rgba(20,14,4,0.9)', border: '1px solid rgba(201,150,26,0.45)', color: '#f0e6c8', fontFamily: 'var(--be-font-body)', fontSize: '1rem', borderRadius: 4, outline: 'none', boxSizing: 'border-box' }}
      />
      {searching && <p style={{ fontFamily: 'var(--be-font-body)', fontStyle: 'italic', color: 'var(--be-ink-4)', fontSize: 13, margin: '8px 0 0' }}>Searching the roster…</p>}
      {results.length > 0 && (
        <div style={{ marginTop: 8, border: '1px solid rgba(61,46,21,0.6)', borderRadius: 4, overflow: 'hidden' }}>
          {results.map((c) => {
            const cls = (c.class ?? '').toUpperCase()
            const color = CLASS_COLORS[cls] ?? '#888'
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid rgba(61,46,21,0.4)', background: 'rgba(20,14,4,0.6)' }}>
                <span style={{ width: 4, height: 28, backgroundColor: color, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--be-font-display)', color: 'var(--be-gold)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName(c.name, c.last_name)}</div>
                  <div style={{ fontFamily: 'var(--be-font-body)', color: 'var(--be-ink-3)', fontSize: '0.8rem' }}>
                    {[c.level ? `Level ${c.level}` : null, displayRace(c.race), cls ? titleCase(cls) : null, c.rank_name].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <button type="button" disabled={disabled} onClick={() => onPick(c)}
                  style={{ flexShrink: 0, padding: '8px 12px', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
                  {pickLabel}
                </button>
              </div>
            )
          })}
        </div>
      )}
      {searched && !searching && results.length === 0 && (
        <p style={{ fontFamily: 'var(--be-font-body)', fontStyle: 'italic', color: 'var(--be-ink-4)', fontSize: 13, margin: '8px 0 0' }}>
          Not on the roster yet (it is refreshed by hand after people join in game). Add your character below instead.
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 4px' }}>
        <span style={{ flex: 1, height: 1, background: 'rgba(61,46,21,0.6)' }} />
        <span style={{ fontFamily: 'var(--be-font-display)', fontSize: 11, letterSpacing: '0.15em', color: 'var(--be-ink-4)', textTransform: 'uppercase' }}>or add it yourself</span>
        <span style={{ flex: 1, height: 1, background: 'rgba(61,46,21,0.6)' }} />
      </div>
    </div>
  )
}
