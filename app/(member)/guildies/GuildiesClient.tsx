'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCharacterArt } from '@/lib/character-art'
import { AddAltModal } from '@/components/AddAltModal'

const CLASS_COLORS: Record<string, string> = {
  MAGE: '#3fc7eb', PALADIN: '#f48cba', WARRIOR: '#c69b3a',
  PRIEST: '#ffffff', DRUID: '#ff7c0a', HUNTER: '#aad372',
  ROGUE: '#fff468', WARLOCK: '#8788ee', SHAMAN: '#0070dd',
  DEATH_KNIGHT: '#c41e3a', MONK: '#00ff98', DEMON_HUNTER: '#a330c9',
}

const RANK_DISPLAY_MAP: Record<string, string> = {
  'Ally Emissary':   'Officer',
  'Grand Marshal':   'Officer',
  'Event Warden':    'Officer',
  'Vanguard Elite':  'Vanguard Elite',
  'Exalted Hero':    'Veteran',
  'Revered Champ':   'Member',
  'Honored Veteran': 'Member',
  'Trusted Ally':    'Trusted Ally',
  'Fresh Recruit':   'Fresh Recruit',
  'Guild Master':    'Guild Master',
  'GM Alt':          'GM Alt',
  'Officer':         'Officer',
  'Officer Alt':     'Officer Alt',
  'Recruiter':       'Recruiter',
  'Veteran':         'Veteran',
  'Member':          'Member',
}

const RANK_SUBMENU_OPTIONS = [
  'Guild Master',
  'GM Alt',
  'Officer',
  'Officer Alt',
  'Vanguard Elite',
  'Recruiter',
  'Veteran',
  'Member',
  'Trusted Ally',
  'Fresh Recruit',
]

function displayRank(rankName: string): string {
  return RANK_DISPLAY_MAP[rankName] ?? rankName
}

export type RosterChar = {
  id: string; name: string; class: string; race: string | null
  level: number; rank_name: string | null; rank_index: number | null
  professions: { name: string; skill_level: number; is_primary: boolean }[]
}

export type MiaChar = {
  id: string; name: string; class: string; race: string | null
  level: number; rank_name: string | null; rank_index: number | null
  professions: { name: string; skill_level?: number | null }[]
}

// Legacy type aliases
export type ActiveChar    = RosterChar
export type UnclaimedChar = RosterChar

type MergedChar = RosterChar & { isClaimed: boolean }

type AnyChar = {
  level: number; rank_index: number | null; class: string
  race: string | null; rank_name: string | null
  professions: { name: string; skill_level?: number | null }[]
}

type SortKey = 'level' | 'rank' | 'class' | 'race' | 'profession'

// ── Icons ───────────────────────────────────────────────────
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

// ── Sort config ──────────────────────────────────────────────
const SORTS: { key: SortKey; label: string; color: string; bgTint: string; icon: React.ReactNode; hasSubmenu: boolean }[] = [
  { key: 'level',      label: 'Level', color: '#c9961a', bgTint: 'rgba(201,150,26,0.06)',  icon: <CrossedSwordsIcon />, hasSubmenu: false },
  { key: 'rank',       label: 'Rank',  color: '#e8c96a', bgTint: 'rgba(232,201,106,0.06)', icon: <CrownIcon />,         hasSubmenu: true  },
  { key: 'class',      label: 'Class', color: '#3fc7eb', bgTint: 'rgba(63,199,235,0.05)',  icon: <ArcaneOrbIcon />,     hasSubmenu: true  },
  { key: 'race',       label: 'Race',  color: '#aad372', bgTint: 'rgba(170,211,114,0.05)', icon: <HelmIcon />,          hasSubmenu: true  },
  { key: 'profession', label: 'Craft', color: '#ff7c0a', bgTint: 'rgba(255,124,10,0.05)',  icon: <HammerIcon />,        hasSubmenu: true  },
]

function sortChars<T extends AnyChar>(chars: T[], key: SortKey, filter?: string | null): T[] {
  return [...chars].sort((a, b) => {
    switch (key) {
      case 'level':  return b.level - a.level
      case 'rank':   return (a.rank_index ?? 9999) - (b.rank_index ?? 9999)
      case 'class':  return a.class.localeCompare(b.class) || b.level - a.level
      case 'race':   return (a.race ?? 'zzz').localeCompare(b.race ?? 'zzz') || b.level - a.level
      case 'profession': {
        const getSkill = (c: T): number => {
          if (filter) return c.professions?.find(p => p.name === filter)?.skill_level ?? 0
          const skills = c.professions?.map(p => p.skill_level ?? 0) ?? []
          return skills.length > 0 ? Math.max(...skills) : 0
        }
        return getSkill(b) - getSkill(a) || b.level - a.level
      }
    }
  })
}

function getSubmenuValues(key: SortKey, members: AnyChar[]): string[] {
  switch (key) {
    case 'class':
      return [...new Set(members.map(m => m.class))].sort()
    case 'race':
      return [...new Set(
        members.map(m => m.race === 'NightElf' ? 'Night Elf' : m.race).filter((r): r is string => r !== null)
      )].sort()
    case 'rank': {
      const presentNormalized = new Set(
        members.map(m => m.rank_name ? displayRank(m.rank_name) : '').filter(Boolean)
      )
      return RANK_SUBMENU_OPTIONS.filter(r => presentNormalized.has(r))
    }
    case 'profession':
      return [...new Set(
        members.flatMap(m => m.professions?.map(p => p.name) ?? [])
      )].sort()
    default:
      return []
  }
}

function applyFilter<T extends AnyChar>(list: T[], sort: SortKey, filter: string | null): T[] {
  if (!filter) return list
  switch (sort) {
    case 'class':      return list.filter(c => c.class === filter)
    case 'race':       return list.filter(c => (c.race === 'NightElf' ? 'Night Elf' : c.race) === filter)
    case 'rank':       return list.filter(c => c.rank_name && displayRank(c.rank_name) === filter)
    case 'profession': return list.filter(c => c.professions?.some(p => p.name === filter))
    default:           return list
  }
}

function classLabel(cls: string) {
  return cls.charAt(0) + cls.slice(1).toLowerCase().replace('_', ' ')
}

// ── Component ────────────────────────────────────────────────
export function GuildiesClient({
  claimed,
  unclaimedActive,
  miaOriginals,
}: {
  claimed: RosterChar[]
  unclaimedActive: RosterChar[]
  miaOriginals: MiaChar[]
}) {
  const [activeSort, setActiveSort] = useState<SortKey>('level')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [openSubmenu, setOpenSubmenu] = useState<SortKey | null>(null)
  const [showAddAltModal, setShowAddAltModal] = useState(false)
  const router = useRouter()

  const mergedActive: MergedChar[] = [
    ...claimed.map(c => ({ ...c, isClaimed: true  as const })),
    ...unclaimedActive.map(c => ({ ...c, isClaimed: false as const })),
  ]

  const allMembers = [...mergedActive, ...miaOriginals] as AnyChar[]
  const activeSortDef = SORTS.find(s => s.key === activeSort)!

  const sortedMerged = applyFilter(
    sortChars(mergedActive, activeSort, activeFilter),
    activeSort, activeFilter
  )
  const sortedMia = applyFilter(
    sortChars(miaOriginals, activeSort, activeFilter),
    activeSort, activeFilter
  )

  const totalActive = claimed.length + unclaimedActive.length

  return (
    <div className="page-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>

      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(201,150,26,0.5)', margin: '0 0 8px', textTransform: 'uppercase' }}>
          Blådes Edge
        </p>
        <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', color: '#f0e6c8', margin: '0 0 8px', lineHeight: 1.1 }}>
          Guildies
        </h1>
        <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.65)', fontSize: '1rem', margin: 0 }}>
          {totalActive} active members · {claimed.length} registered · {miaOriginals.length} MIA originals
        </p>
      </div>

      {/* Sort buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {SORTS.map(sort => {
          const isActive = activeSort === sort.key
          const submenuValues = sort.hasSubmenu ? getSubmenuValues(sort.key, allMembers) : []
          return (
            <div key={sort.key} className="sort-btn-wrapper">
              <button
                className={`sort-btn${isActive ? ' sort-btn-active' : ''}`}
                style={isActive ? {
                  background: sort.color + '22',
                  border: `1px solid ${sort.color}`,
                  color: sort.color,
                } : undefined}
                onClick={() => {
                  if (!sort.hasSubmenu) {
                    setActiveSort(sort.key)
                    setOpenSubmenu(null)
                    if (activeSort !== sort.key) setActiveFilter(null)
                  } else {
                    setActiveSort(sort.key)
                    setOpenSubmenu(openSubmenu === sort.key ? null : sort.key)
                    if (activeSort !== sort.key) setActiveFilter(null)
                  }
                }}
              >
                {sort.icon}
                {sort.label}
                {activeFilter && isActive && (
                  <span className="sort-filter-badge">: {activeFilter}</span>
                )}
                {sort.hasSubmenu && (
                  <span style={{ fontSize: '0.6rem', marginLeft: '0.15rem' }}>▾</span>
                )}
              </button>

              {sort.hasSubmenu && openSubmenu === sort.key && (
                <div className="sort-submenu">
                  <button
                    className={`submenu-item${activeFilter === null ? ' active' : ''}`}
                    onClick={() => { setActiveFilter(null); setOpenSubmenu(null) }}
                  >
                    All {sort.label}s
                  </button>
                  {submenuValues.map(value => (
                    <button
                      key={value}
                      className={`submenu-item${activeFilter === value ? ' active' : ''}`}
                      onClick={() => {
                        setActiveFilter(activeFilter === value ? null : value)
                        setOpenSubmenu(null)
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Active Guild Members — merged single list */}
      <div style={{ background: activeSortDef.bgTint, borderRadius: 12, transition: 'background 400ms ease', border: '1px solid rgba(61,46,21,0.4)', overflow: 'hidden' }}>
        <div className="guildie-row guildie-header">
          <div />
          <div>Name</div>
          <div>Class</div>
          <div>Lvl</div>
          <div>Rank</div>
          <div>Professions</div>
        </div>

        {sortedMerged.map(char => {
          const art   = char.isClaimed ? getCharacterArt(char.race, char.class) : null
          const color = CLASS_COLORS[char.class] ?? '#8a7a5a'
          const profs = char.professions.filter(p => p.is_primary).map(p => `${p.skill_level} ${p.name}`)
          return (
            <div key={char.id} className="guildie-row" style={{ opacity: char.isClaimed ? 1 : 0.55 }}>
              <div className="guildie-art">
                {char.isClaimed && art ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art.female} className="guildie-art-fig" alt="" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art.male}   className="guildie-art-fig" alt="" />
                  </>
                ) : (
                  <div style={{ width: 64 }} />
                )}
              </div>
              <div className="guildie-name-col">
                <span data-character-name style={{ color: char.isClaimed ? color : 'var(--be-muted)', fontFamily: 'Cinzel, serif', textTransform: 'none', fontVariant: 'normal' }}>
                  {char.name}
                </span>
                <span className="guildie-sub">{char.race === 'NightElf' ? 'Night Elf' : char.race}</span>
              </div>
              <div className="guildie-class-col">
                <span style={{ color }}>● {classLabel(char.class)}</span>
              </div>
              <div className="guildie-level-col">
                <span style={{ color: char.isClaimed ? 'var(--be-gold)' : undefined, fontFamily: 'Cinzel, serif' }}>{char.level}</span>
              </div>
              <div className="guildie-rank-col">
                {char.isClaimed
                  ? char.rank_name && <span className="rank-badge">{displayRank(char.rank_name)}</span>
                  : <span className="unclaimed-badge">Unclaimed</span>
                }
              </div>
              <div className="guildie-prof-col">
                {profs.length > 0
                  ? profs.join('  ')
                  : <span style={{ color: 'var(--be-muted)', fontStyle: 'italic' }}>—</span>}
              </div>
            </div>
          )
        })}

        {sortedMerged.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'var(--be-muted)' }}>
            No active members match this filter.
          </div>
        )}
      </div>

      {/* Claim CTA */}
      <div className="guildie-claim-cta">
        <div className="guildie-claim-text">
          <span className="guildie-claim-title">Is one of these your alt?</span>
          <span className="guildie-claim-sub">Claim unclaimed characters and add them to your roster.</span>
        </div>
        <button className="guildie-claim-btn" onClick={() => setShowAddAltModal(true)}>
          Claim your alt — add it to your roster
        </button>
      </div>

      {showAddAltModal && (
        <AddAltModal
          onClose={() => setShowAddAltModal(false)}
          onSuccess={() => { setShowAddAltModal(false); router.refresh() }}
        />
      )}

      {/* Original Members — Still MIA */}
      <div style={{ marginTop: '2.5rem' }}>
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(201,150,26,0.45)', margin: '0 0 1rem', textTransform: 'uppercase' }}>
          Original Members — Still MIA
        </p>
        <div style={{ background: activeSortDef.bgTint, borderRadius: 12, transition: 'background 400ms ease', border: '1px solid rgba(61,46,21,0.3)', overflow: 'hidden', opacity: 0.35 }}>
          {sortedMia.map(char => {
            const color = CLASS_COLORS[char.class] ?? '#8a7a5a'
            return (
              <div key={char.id} className="guildie-row">
                <div style={{ width: 64 }} />
                <div className="guildie-name-col">
                  <span data-character-name style={{ color: 'var(--be-muted)', fontFamily: 'Cinzel, serif', textTransform: 'none', fontVariant: 'normal' }}>
                    {char.name}
                  </span>
                  <span className="guildie-sub">{char.race === 'NightElf' ? 'Night Elf' : char.race}</span>
                </div>
                <div className="guildie-class-col">
                  <span style={{ color }}>● {classLabel(char.class)}</span>
                </div>
                <div className="guildie-level-col">
                  <span style={{ fontFamily: 'Cinzel, serif' }}>{char.level}</span>
                </div>
                <div className="guildie-rank-col">
                  {char.rank_name && <span className="rank-badge">{displayRank(char.rank_name)}</span>}
                </div>
                <div className="guildie-prof-col">
                  {char.professions.length > 0
                    ? char.professions.slice(0, 2).map(p => p.skill_level ? `${p.skill_level} ${p.name}` : p.name).join('  ')
                    : <span style={{ fontStyle: 'italic' }}>—</span>}
                </div>
              </div>
            )
          })}
          {sortedMia.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', fontFamily: "'Spectral', serif", fontStyle: 'italic' }}>
              {miaOriginals.length === 0 ? 'All original members have returned!' : 'No members match this filter.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
