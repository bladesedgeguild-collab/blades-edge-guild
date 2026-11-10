'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DUNGEONS, opensOnLabel } from '@/data/dungeons/index'
import type { Dungeon, DungeonContinent } from '@/data/dungeons/types'
import LFGMiniBox from '@/components/LFGMiniBox'
import { GUILD } from '@/lib/guild-config'
import { levelFit, levelFitLabel, type LevelFit } from '@/lib/level-fit'
import './dungeons.css'

type Continent = 'All' | DungeonContinent

const CONTINENT_BAND: Record<string, string> = {
  'Eastern Kingdoms': '#3fc7eb22',
  Kalimdor: '#ff7c0a22',
}

const CONTINENTS: Continent[] = ['All', 'Eastern Kingdoms', 'Kalimdor']

interface Props {
  playerLevel: number
}

export default function DungeonsClient({ playerLevel }: Props) {
  const [continent, setContinent] = useState<Continent>('All')
  const [kind, setKind] = useState<'All' | 'dungeon' | 'raid'>('All')
  const [overrideLevel, setOverrideLevel] = useState<number | null>(null)
  const [showOnlyMyLevel, setShowOnlyMyLevel] = useState(false)

  const effectiveLevel = overrideLevel ?? playerLevel

  const filtered = DUNGEONS
    .filter(dungeon => continent === 'All' || dungeon.continent === continent)
    .filter(dungeon => kind === 'All' || dungeon.instanceType === kind)
    .filter(dungeon => {
      if (!showOnlyMyLevel) return true
      return levelFit(dungeon, effectiveLevel) === 'active'
    })

  return (
    <>
      <div className="df-header">
        <h1 className="df-title">Dungeon Finder</h1>
        <p className="df-subtitle">
          WoW: Forever instances for Alliance, with the level ranges from the Group Finder.
        </p>
      </div>

      <LFGMiniBox title="Active LFG Calls" columns={4} maxRows={2} className="df-lfg-full-section" />

      <div className="df-level-selector">
        <span className="df-level-label">
          Showing dungeons for level{' '}
          <strong style={{ color: 'var(--be-gold)' }}>{effectiveLevel}</strong>
        </span>
        {overrideLevel !== null && overrideLevel !== playerLevel && (
          <button className="df-level-reset" onClick={() => setOverrideLevel(null)}>
            Reset to {playerLevel}
          </button>
        )}
        <select
          value={effectiveLevel}
          onChange={event => setOverrideLevel(Number(event.target.value))}
          className="df-level-select"
        >
          {Array.from({ length: GUILD.maxLevel }, (_, index) => index + 1).map(level => (
            <option key={level} value={level}>Level {level}</option>
          ))}
        </select>
      </div>
      <p className="df-level-note">
        A green border means the run is in range. Gray means the door is shut or the run is outleveled.
        At level {GUILD.maxLevel}, outleveled runs stay readable: No XP (loot, quests or attunement only).
      </p>

      <div className="df-tabs">
        {CONTINENTS.map(name => (
          <button
            key={name}
            onClick={() => setContinent(name)}
            className={`df-tab${continent === name ? ' df-tab--active' : ''}`}
          >
            {name}
          </button>
        ))}
        <span className="df-tabs-divider" />
        {(['All', 'dungeon', 'raid'] as const).map(value => (
          <button
            key={value}
            onClick={() => setKind(value)}
            className={`df-tab${kind === value ? ' df-tab--active' : ''}`}
          >
            {value === 'All' ? 'Dungeons & Raids' : value === 'dungeon' ? 'Dungeons' : 'Raids'}
          </button>
        ))}
        <span className="df-tabs-divider" />
        <button
          className={`df-tab df-tab-recommended${showOnlyMyLevel ? ' active' : ''}`}
          onClick={() => setShowOnlyMyLevel(value => !value)}
        >
          ★ Your Level
        </button>
      </div>

      {showOnlyMyLevel && (
        <p className="df-level-note">
          Showing only dungeons in range for level {effectiveLevel}. Click ★ Your Level again to see all.
        </p>
      )}

      <div className="df-grid-wrapper">
        {filtered.length === 0 ? (
          <p className="df-empty">No dungeons found.</p>
        ) : (
          <div className="df-grid">
            {filtered.map(dungeon => (
              <DungeonCard key={dungeon.id} dungeon={dungeon} level={effectiveLevel} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function DungeonCard({ dungeon, level }: { dungeon: Dungeon; level: number }) {
  const status: LevelFit = levelFit(dungeon, level)
  const label = levelFitLabel(status, dungeon)
  const opens = opensOnLabel(dungeon)
  return (
    <Link href={`/dungeons/${dungeon.id}`} className="df-card-link">
      <div className={`df-card df-card--${status}`}>
        <div
          className="df-card-band"
          style={{ background: CONTINENT_BAND[dungeon.continent] ?? '#ffffff11' }}
        />
        <div className="df-card-body">
          <div className="df-card-zone">
            {dungeon.continent} &middot; {dungeon.zone}
          </div>
          <h3 className="df-card-name">{dungeon.name}</h3>
          <div className="df-card-levels">
            Level {dungeon.recommendedLevelMin}–{dungeon.recommendedLevelMax}
            <span className="df-heroic-badge">
              {dungeon.maxPlayers}-player {dungeon.instanceType}
            </span>
            {dungeon.isNewInForever && <span className="df-heroic-badge">New in Forever</span>}
            {opens && <span className="df-heroic-badge">{opens}</span>}
          </div>
          <p className="df-card-summary">{dungeon.summary}</p>
          <div className="df-card-meta">
            <span>🗡 {dungeon.groupComp.tank} Tank</span>
            <span>💚 {dungeon.groupComp.healer} Healer</span>
            <span>⚔️ {dungeon.groupComp.dps} DPS</span>
            {dungeon.estimatedTimeMinutes != null && <span>⏱ ~{dungeon.estimatedTimeMinutes}m</span>}
          </div>
          {dungeon.requirement && <div className="df-card-special">{dungeon.requirement}</div>}
          {!dungeon.requirement && dungeon.specialMechanic && (
            <div className="df-card-special">{dungeon.specialMechanic}</div>
          )}
          {label && (
            <div className={`df-requires-pill${status === 'no-xp' ? ' df-requires-pill--open' : ''}`}>
              {label}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
