'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DUNGEONS } from '@/data/dungeons/index'
import type { Dungeon, DungeonContinent } from '@/data/dungeons/types'
import type { LfgSidebarPost } from './page'
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

function formatWindow(post: LfgSidebarPost): string {
  const days = post.days_available?.length
    ? post.days_available.join(', ')
    : post.days_available !== null && post.days_available !== undefined
    ? 'Any day'
    : null
  if (post.time_start && post.time_end)
    return `${days || 'Any day'}, ${post.time_start}–${post.time_end} MT`
  if (days) return days
  return post.available_window ?? ''
}

interface Props {
  playerLevel: number
  activeLFG: LfgSidebarPost[]
  dungeonNames: Record<string, string>
}

export default function DungeonsClient({ playerLevel, activeLFG, dungeonNames }: Props) {
  const [continent, setContinent] = useState<Continent>('All')
  const [overrideLevel, setOverrideLevel] = useState<number | null>(null)

  const effectiveLevel = overrideLevel ?? playerLevel

  const filtered = continent === 'All'
    ? DUNGEONS
    : DUNGEONS.filter(d => d.continent === continent)

  return (
    <>
      {/* Header row: title + LFG sidebar */}
      <div className="df-header-row">
        <div className="df-header-left">
          <h1 className="df-title">Dungeon Finder</h1>
          <p className="df-subtitle">
            Every den of darkness, every vault of peril. Sorted for your level.
          </p>
        </div>
        {activeLFG.length > 0 && (
          <div className="df-lfg-sidebar">
            <div className="df-lfg-sidebar-title">⚔️ Active LFG Calls</div>
            {activeLFG.map(post => {
              const window = formatWindow(post)
              return (
                <div key={post.id} className="df-lfg-sidebar-post">
                  <div className="df-lfg-sidebar-dungeon">
                    {dungeonNames[post.dungeon_slug] ?? post.dungeon_slug}
                  </div>
                  <div className="df-lfg-sidebar-caller">
                    {post.character_name}
                    {' '}
                    <span className="df-lfg-sidebar-role">({post.role})</span>
                  </div>
                  {window && (
                    <div className="df-lfg-sidebar-window">{window}</div>
                  )}
                  {post.current_group && (
                    <div className="df-lfg-sidebar-comp">
                      <span>🛡 {post.current_group.tank}</span>
                      <span>💚 {post.current_group.healer}</span>
                      <span>⚔️ {post.current_group.dps}</span>
                    </div>
                  )}
                  <Link
                    href={`/dungeons/${post.dungeon_slug}`}
                    className="df-lfg-sidebar-link"
                  >
                    View &rarr;
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
      </div>

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
                    </div>
                    {status === 'locked' && (
                      <div className="df-card-locked-overlay">
                        Requires Level {dungeon.recommendedLevelMin}
                      </div>
                    )}
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
