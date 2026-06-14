'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCharacterArt } from '@/lib/character-art'

const CLASS_COLORS: Record<string, string> = {
  MAGE: '#3fc7eb', PALADIN: '#f48cba', WARRIOR: '#c69b3a',
  PRIEST: '#ffffff', DRUID: '#ff7c0a', HUNTER: '#aad372',
  ROGUE: '#fff468', WARLOCK: '#8788ee', SHAMAN: '#0070dd',
  DEATH_KNIGHT: '#c41e3a', MONK: '#00ff98', DEMON_HUNTER: '#a330c9',
}

export type ActiveChar = {
  id: string; name: string; class: string; race: string | null
  level: number; rank_name: string | null; rank_index: number | null
  professions: { name: string; skill_level: number; is_primary: boolean }[]
}

export type UnclaimedChar = {
  id: string; name: string; class: string; race: string | null
  level: number; rank_name: string | null; rank_index: number | null
  professions: { name: string }[]
}

type SortKey = 'level' | 'rank' | 'class' | 'race' | 'profession'

// ── Icons ──────────────────────────────────────────────────
const CrossedSwordsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="16" y1="2" x2="2" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="2" y1="4" x2="4" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="14" y1="16" x2="16" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
  </svg>
)

const CrownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M2 13 L4 6 L9 10 L14 4 L16 6 L16 13 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    <line x1="2" y1="15" x2="16" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="4" cy="6" r="1" fill="currentColor"/>
    <circle cx="14" cy="4" r="1" fill="currentColor"/>
    <circle cx="9" cy="10" r="1" fill="currentColor"/>
  </svg>
)

const ArcaneOrbIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="9" cy="9" r="2" fill="currentColor" opacity="0.6"/>
    <line x1="9" y1="1" x2="9" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="9" y1="14" x2="9" y2="17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="1" y1="9" x2="4" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="14" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const HelmIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M4 10 Q4 4 9 3 Q14 4 14 10 L14 14 Q14 15 13 15 L5 15 Q4 15 4 14 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    <line x1="4" y1="11" x2="2" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 13 L2 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="6" y1="15" x2="6" y2="17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="12" y1="15" x2="12" y2="17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const HammerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="8" y="2" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <line x1="10" y1="6" x2="4" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="6" y1="6" x2="12" y2="16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4"/>
  </svg>
)

// ── Sort config ─────────────────────────────────────────────
const SORTS: { key: SortKey; label: string; color: string; bgTint: string; icon: React.ReactNode }[] = [
  { key: 'level',      label: 'Level', color: '#c9961a', bgTint: 'rgba(201,150,26,0.06)',  icon: <CrossedSwordsIcon /> },
  { key: 'rank',       label: 'Rank',  color: '#e8c96a', bgTint: 'rgba(232,201,106,0.06)', icon: <CrownIcon /> },
  { key: 'class',      label: 'Class', color: '#3fc7eb', bgTint: 'rgba(63,199,235,0.05)',  icon: <ArcaneOrbIcon /> },
  { key: 'race',       label: 'Race',  color: '#aad372', bgTint: 'rgba(170,211,114,0.05)', icon: <HelmIcon /> },
  { key: 'profession', label: 'Craft', color: '#ff7c0a', bgTint: 'rgba(255,124,10,0.05)',  icon: <HammerIcon /> },
]

function sortChars<T extends { level: number; rank_index: number | null; class: string; race: string | null; professions: { name: string }[] }>(
  chars: T[], key: SortKey
): T[] {
  return [...chars].sort((a, b) => {
    switch (key) {
      case 'level':      return b.level - a.level
      case 'rank':       return (a.rank_index ?? 9999) - (b.rank_index ?? 9999)
      case 'class':      return a.class.localeCompare(b.class)
      case 'race':       return (a.race ?? 'zzz').localeCompare(b.race ?? 'zzz')
      case 'profession': {
        const pa = a.professions?.[0]?.name ?? 'zzz'
        const pb = b.professions?.[0]?.name ?? 'zzz'
        return pa.localeCompare(pb)
      }
    }
  })
}

function classLabel(cls: string) {
  return cls.charAt(0) + cls.slice(1).toLowerCase().replace('_', ' ')
}

// ── Component ───────────────────────────────────────────────
export function GuildiesClient({ active, unclaimed }: { active: ActiveChar[]; unclaimed: UnclaimedChar[] }) {
  const [activeSort, setActiveSort] = useState<SortKey>('level')
  const router = useRouter()

  const sorted          = sortChars(active, activeSort)
  const sortedUnclaimed = sortChars(unclaimed, activeSort)
  const activeSortDef   = SORTS.find(s => s.key === activeSort)!

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(201,150,26,0.5)', margin: '0 0 8px', textTransform: 'uppercase' }}>
          Blådes Edge
        </p>
        <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', color: '#f0e6c8', margin: '0 0 8px', lineHeight: 1.1 }}>
          Guildies
        </h1>
        <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.65)', fontSize: '1rem', margin: 0 }}>
          {active.length} active members · {unclaimed.length} unclaimed
        </p>
      </div>

      {/* Sort buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {SORTS.map(sort => (
          <button
            key={sort.key}
            onClick={() => setActiveSort(sort.key)}
            style={{
              background: activeSort === sort.key ? sort.color + '22' : 'var(--be-bg-2)',
              border: `1px solid ${activeSort === sort.key ? sort.color : 'rgba(201,150,26,0.2)'}`,
              color: activeSort === sort.key ? sort.color : 'var(--be-muted)',
              borderRadius: '10px',
              padding: '0.65rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'Cinzel, serif',
              fontSize: '0.8rem',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            {sort.icon}
            {sort.label}
          </button>
        ))}
      </div>

      {/* Active roster */}
      <div style={{ background: activeSortDef.bgTint, borderRadius: 12, transition: 'background 400ms ease', border: '1px solid rgba(61,46,21,0.4)', overflow: 'hidden' }}>
        {/* Column header */}
        <div className="guildie-row guildie-header">
          <div />
          <div>Name</div>
          <div>Class</div>
          <div>Lvl</div>
          <div>Rank</div>
          <div>Professions</div>
        </div>

        {sorted.map(char => {
          const art   = getCharacterArt(char.race, char.class)
          const color = CLASS_COLORS[char.class] ?? '#8a7a5a'
          const profs = char.professions.filter(p => p.is_primary).map(p => p.name)
          return (
            <div key={char.id} className="guildie-row">
              <div className="guildie-art">
                {art && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art.female} className="guildie-art-fig" alt="" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art.male}   className="guildie-art-fig" alt="" />
                  </>
                )}
              </div>
              <div className="guildie-name-col">
                <span data-character-name style={{ color, fontFamily: 'Cinzel, serif', textTransform: 'none', fontVariant: 'normal' }}>
                  {char.name}
                </span>
                <span className="guildie-sub">{char.race}</span>
              </div>
              <div className="guildie-class-col">
                <span style={{ color }}>● {classLabel(char.class)}</span>
              </div>
              <div className="guildie-level-col">
                <span style={{ color: 'var(--be-gold)', fontFamily: 'Cinzel, serif' }}>{char.level}</span>
              </div>
              <div className="guildie-rank-col">
                {char.rank_name && <span className="rank-badge">{char.rank_name}</span>}
              </div>
              <div className="guildie-prof-col">
                {profs.length > 0
                  ? profs.join('  ')
                  : <span style={{ color: 'var(--be-muted)', fontStyle: 'italic' }}>—</span>}
              </div>
            </div>
          )
        })}

        {sorted.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'var(--be-muted)' }}>
            No active members yet.
          </div>
        )}
      </div>

      {/* Claim CTA */}
      <div className="guildie-claim-cta">
        <div className="guildie-claim-text">
          <span className="guildie-claim-title">Is one of these your alt?</span>
          <span className="guildie-claim-sub">Claim unclaimed characters and add them to your roster.</span>
        </div>
        <button className="guildie-claim-btn" onClick={() => router.push('/my-roster')}>
          Add Alts on My Roster →
        </button>
      </div>

      {/* Unclaimed section */}
      <div style={{ marginTop: '2.5rem' }}>
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(201,150,26,0.45)', margin: '0 0 1rem', textTransform: 'uppercase' }}>
          Unclaimed Characters &amp; Original Members
        </p>
        <div style={{ background: activeSortDef.bgTint, borderRadius: 12, transition: 'background 400ms ease', border: '1px solid rgba(61,46,21,0.3)', overflow: 'hidden', opacity: 0.35 }}>
          {sortedUnclaimed.map(char => {
            const color = CLASS_COLORS[char.class] ?? '#8a7a5a'
            return (
              <div key={char.id} className="guildie-row">
                <div style={{ width: 64 }} />
                <div className="guildie-name-col">
                  <span data-character-name style={{ color: 'var(--be-muted)', fontFamily: 'Cinzel, serif', textTransform: 'none', fontVariant: 'normal' }}>
                    {char.name}
                  </span>
                  <span className="guildie-sub">{char.race}</span>
                </div>
                <div className="guildie-class-col">
                  <span style={{ color }}>● {classLabel(char.class)}</span>
                </div>
                <div className="guildie-level-col">
                  <span style={{ fontFamily: 'Cinzel, serif' }}>{char.level}</span>
                </div>
                <div className="guildie-rank-col">
                  {char.rank_name && <span className="rank-badge">{char.rank_name}</span>}
                </div>
                <div className="guildie-prof-col">
                  {char.professions.length > 0
                    ? char.professions.slice(0, 2).map(p => p.name).join('  ')
                    : <span style={{ fontStyle: 'italic' }}>—</span>}
                </div>
              </div>
            )
          })}
          {sortedUnclaimed.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', fontFamily: "'Spectral', serif", fontStyle: 'italic' }}>
              All characters have been claimed.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
