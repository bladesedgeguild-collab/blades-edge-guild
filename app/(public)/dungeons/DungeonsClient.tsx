'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DUNGEONS } from '@/data/dungeons/index'
import type { Dungeon, DungeonContinent } from '@/data/dungeons/types'
import LFGMiniBox from '@/components/LFGMiniBox'
import './dungeons.css'

type Continent = 'All' | DungeonContinent

function getDungeonStatus(dungeon: Dungeon, level: number): 'active' | 'outleveled' | 'locked' {
  if (level >= dungeon.recommendedLevelMin && level <= dungeon.recommendedLevelMax + 5)
    return 'active'
  if (level > dungeon.recommendedLevelMax + 5)
    return 'outleveled'
  return 'locked'
}

const CONTINENT_BAND: Record<string, string> = {
  'Outland': '#1aff6e22',
  'Eastern Kingdoms': '#3fc7eb22',
  'Kalimdor': '#ff7c0a22',
}

const CONTINENTS: Continent[] = ['All', 'Eastern Kingdoms', 'Kalimdor', 'Outland']

interface Props {
  playerLevel: number
}

export default function DungeonsClient({ playerLevel }: Props) {
  const [continent, setContinent] = useState<Continent>('All')
  const [overrideLevel, setOverrideLevel] = useState<number | null>(null)
  const [showOnlyMyLevel, setShowOnlyMyLevel] = useState(false)

  const effectiveLevel = overrideLevel ?? playerLevel

  const filtered = DUNGEONS
    .filter(d => continent === 'All' || d.continent === continent)
    .filter(d => {
      if (!showOnlyMyLevel) return true
      return getDungeonStatus(d, effectiveLevel) === 'active'
    })

  return (
    <>
      {/* Header */}
      <div className="df-header">
        <h1 className="df-title">Dungeon Finder</h1>
        <p className="df-subtitle">
          Every den of darkness, every vault of peril. Sorted for your level.
        </p>
      </div>

      {/* Full-width LFG section above level selector */}
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
          onChange={e => setOverrideLevel(Number(e.target.value))}
          className="df-level-select"
        >
          {Array.from({ length: 70 }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>Level {n}</option>
          ))}
        </select>
      </div>

      <div className="df-tabs">
        {CONTINENTS.map(c => (
          <button
            key={c}
            onClick={() => setContinent(c)}
            className={`df-tab${continent === c ? ' df-tab--active' : ''}`}
          >
            {c}
          </button>
        ))}
        <span className="df-tabs-divider" />
        <button
          className={`df-tab df-tab-recommended${showOnlyMyLevel ? ' active' : ''}`}
          onClick={() => setShowOnlyMyLevel(v => !v)}
        >
          ★ Your Level
        </button>
      </div>

      {showOnlyMyLevel && (
        <p className="df-level-note">
          Showing only dungeons for level {effectiveLevel}. Click ★ Your Level again to see all dungeons.
        </p>
      )}

      <div className="df-grid-wrapper">
        {filtered.length === 0 ? (
          <p className="df-empty">No dungeons found.</p>
        ) : (
          <div className="df-grid">
            {filtered.map(dungeon => {
              const status = getDungeonStatus(dungeon, effectiveLevel)
              return (
                <Link href={`/dungeons/${dungeon.id}`} key={dungeon.id} className="df-card-link">
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
                        {dungeon.heroicRequiresLevel && (
                          <span className="df-heroic-badge">Heroic Req. 70</span>
                        )}
                      </div>
                      <p className="df-card-summary">{dungeon.summary}</p>
                      <div className="df-card-meta">
                        <span>🗡 {dungeon.groupComp.tank} Tank</span>
                        <span>💚 {dungeon.groupComp.healer} Healer</span>
                        <span>⚔️ {dungeon.groupComp.dps} DPS</span>
                        <span>⏱ ~{dungeon.estimatedTimeMinutes}m</span>
                      </div>
                      {dungeon.quests.filter(q => q.faction !== 'Horde').length > 0 && (
                        <div className="df-card-quests">
                          📜 {dungeon.quests.filter(q => q.faction !== 'Horde').length} quests available
                        </div>
                      )}
                      {dungeon.specialMechanic && (
                        <div className="df-card-special">{dungeon.specialMechanic}</div>
                      )}
                      {status === 'locked' && (
                        <div className="df-requires-pill">
                          Requires Level {dungeon.recommendedLevelMin}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
