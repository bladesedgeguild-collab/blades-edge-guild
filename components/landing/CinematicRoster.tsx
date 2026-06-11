'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

const CLASS_COLORS: Record<string, string> = {
  MAGE: '#3fc7eb', PALADIN: '#f48cba', WARRIOR: '#c69b3a',
  PRIEST: '#ffffff', DRUID: '#ff7c0a', HUNTER: '#aad372',
  ROGUE: '#fff468', WARLOCK: '#8788ee', SHAMAN: '#0070dd',
}

// Seconds per chip — controls apparent scroll speed across all sections
const SECONDS_PER_CHIP = 8

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

function NameChip({ char }: { char: RosterChar }) {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const classColor = CLASS_COLORS[char.class] ?? '#c9961a'

  const primaryProfs = (char.professions ?? []).filter((p) => p.is_primary).slice(0, 2)
  const profText = primaryProfs.length > 0
    ? primaryProfs.map((p) => p.name).join(' · ')
    : 'No professions listed'

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.bottom,
    })
  }

  const handleMouseLeave = () => setTooltipPos(null)

  const isHovered = tooltipPos !== null

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          borderRadius: 9999,
          padding: '8px 20px',
          backgroundColor: 'rgba(26,18,8,0.7)',
          border: `1px solid rgba(61,46,21,${isHovered ? 0.9 : 0.6})`,
          height: 52,
          cursor: 'default',
          alignSelf: 'center',
          transition: 'border-color 0.15s ease',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: classColor,
            flexShrink: 0,
          }}
        />
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: classColor, whiteSpace: 'nowrap' }}>
          {char.name}
        </span>
      </div>

      {/* Tooltip via portal — appears below chip, escapes overflow containers */}
      {tooltipPos && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y + 8,
            transform: 'translateX(-50%)',
            zIndex: 9999,
            pointerEvents: 'none',
            background: 'var(--be-bg-1)',
            border: '1px solid rgba(201,150,26,0.4)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            minWidth: '240px',
            maxWidth: '300px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(201,150,26,0.1)',
          }}
        >
          {/* Name */}
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: '1.4rem', color: classColor, marginBottom: '0.5rem', lineHeight: 1.2 }}>
            {char.name}
          </div>

          {/* Class · Race · Level */}
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: 'var(--be-ink)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: classColor, flexShrink: 0 }} />
            {char.class} · {char.race ?? '—'} · Level {char.level}
          </div>

          {/* Rank */}
          {char.rank_name && (
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.75rem', color: 'var(--be-gold)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {char.rank_name}
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(201,150,26,0.2)', marginBottom: '0.5rem' }} />

          {/* Professions */}
          <div style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--be-muted)' }}>
            {profText}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function RosterRow({
  chars,
  direction,
  variant,
  duration,
  paused,
}: {
  chars: RosterChar[]
  direction: 'left' | 'right'
  variant: 'active' | 'originals'
  duration: number
  paused: boolean
}) {
  const doubled = [...chars, ...chars]
  const rowClass = `cinematic-row-${direction}-${variant}`

  return (
    <div style={{ overflow: 'hidden', width: '100%', height: 68, display: 'flex', alignItems: 'center' }}>
      <div
        className={rowClass}
        style={{
          display: 'flex',
          gap: 16,
          animationDuration: `${duration}s`,
          animationPlayState: paused ? 'paused' : 'running',
          width: 'max-content',
          alignItems: 'center',
        }}
      >
        {doubled.map((char, i) => (
          <NameChip key={`${char.name}-${i}`} char={char} />
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

  const rowDuration = chars.length * SECONDS_PER_CHIP

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
          duration={rowDuration}
          paused={paused}
        />
      ))}
    </div>
  )
}
