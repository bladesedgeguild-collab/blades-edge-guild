'use client'

import { useState } from 'react'

const CLASS_COLORS: Record<string, string> = {
  MAGE: '#3fc7eb', PALADIN: '#f48cba', WARRIOR: '#c69b3a',
  PRIEST: '#ffffff', DRUID: '#ff7c0a', HUNTER: '#aad372',
  ROGUE: '#fff468', WARLOCK: '#8788ee', SHAMAN: '#0070dd',
}

export type RosterChar = {
  name: string
  class: string
  level: number
  rank_name: string | null
  status: string
  race?: string | null
  last_online_days?: number | null
  professions?: { name: string; skill_level: number; is_primary: boolean }[]
}

function NameChip({ char, variant }: { char: RosterChar; variant: 'active' | 'originals' }) {
  const [hovered, setHovered] = useState(false)
  const classColor = CLASS_COLORS[char.class] ?? '#c9961a'

  // Returned = has a real last_online_days (not the 9999 placeholder)
  const isReturned = (char.last_online_days ?? 9999) < 9999

  // Originals section: dim MIA chars; active section: always full opacity
  const chipOpacity = hovered ? 1 : (variant === 'originals' && !isReturned ? 0.35 : 1)
  const nameColor = (variant === 'originals' && !isReturned && !hovered) ? '#8a7a5a' : classColor
  const dotColor = (variant === 'originals' && !isReturned && !hovered) ? '#8a7a5a' : classColor

  const primaryProfs = (char.professions ?? []).filter((p) => p.is_primary).slice(0, 2)
  const profText = primaryProfs.length > 0
    ? primaryProfs.map((p) => p.name).join(' · ')
    : 'No professions listed'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
        opacity: chipOpacity,
        borderRadius: hovered ? 4 : 9999,
        padding: hovered ? '10px 16px' : '8px 20px',
        backgroundColor: hovered ? 'rgba(36,26,14,0.95)' : 'rgba(26,18,8,0.7)',
        border: `1px solid rgba(61,46,21,${hovered ? 0.9 : 0.6})`,
        height: hovered ? 'auto' : 52,
        minHeight: 52,
        width: hovered ? 230 : 'auto',
        transition: 'all 0.25s ease',
        zIndex: hovered ? 10 : 1,
        position: 'relative',
        cursor: 'default',
        overflow: 'hidden',
        alignSelf: 'center',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: dotColor,
          flexShrink: 0,
        }}
      />
      {hovered ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.9rem', color: classColor, whiteSpace: 'nowrap' }}>
            {char.name}
          </span>
          <span style={{ fontFamily: "'Crimson Pro', serif", fontSize: '0.75rem', color: '#f0e6c8', whiteSpace: 'nowrap' }}>
            {char.class.charAt(0) + char.class.slice(1).toLowerCase()}
            {char.race ? ` · ${char.race}` : ''}
            {` · ${char.level}`}
          </span>
          {char.rank_name && (
            <span style={{ fontSize: '0.7rem', color: '#8a7a5a', whiteSpace: 'nowrap' }}>
              {char.rank_name}
            </span>
          )}
          <span style={{ fontSize: '0.68rem', color: '#8a7a5a', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
            {profText}
          </span>
        </div>
      ) : (
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: nameColor, whiteSpace: 'nowrap' }}>
          {char.name}
        </span>
      )}
    </div>
  )
}

function RosterRow({
  chars,
  direction,
  variant,
  paused,
}: {
  chars: RosterChar[]
  direction: 'left' | 'right'
  variant: 'active' | 'originals'
  paused: boolean
}) {
  const doubled = [...chars, ...chars]
  // Animation speed is set via CSS class; only play-state needs to be inline
  const rowClass = `cinematic-row-${direction}-${variant}`

  return (
    <div style={{ overflow: 'hidden', width: '100%', height: 68, display: 'flex', alignItems: 'center' }}>
      <div
        className={rowClass}
        style={{
          display: 'flex',
          gap: 16,
          animationPlayState: paused ? 'paused' : 'running',
          width: 'max-content',
          alignItems: 'center',
        }}
      >
        {doubled.map((char, i) => (
          <NameChip key={`${char.name}-${i}`} char={char} variant={variant} />
        ))}
      </div>
    </div>
  )
}

export function CinematicRoster({
  chars,
  rowCount = 4,
  variant = 'originals',
}: {
  chars: RosterChar[]
  rowCount?: number
  variant?: 'active' | 'originals'
}) {
  const [paused, setPaused] = useState(false)

  if (chars.length === 0) return null

  function rotated(offset: number): RosterChar[] {
    const n = offset % chars.length
    return [...chars.slice(n), ...chars.slice(0, n)]
  }

  const rows = Array.from({ length: rowCount }, (_, i) => ({
    chars: rotated(Math.floor((i * chars.length) / rowCount)),
    direction: (i % 2 === 0 ? 'left' : 'right') as 'left' | 'right',
  }))

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}
    >
      {rows.map((row, i) => (
        <RosterRow
          key={i}
          chars={row.chars}
          direction={row.direction}
          variant={variant}
          paused={paused}
        />
      ))}
    </div>
  )
}
