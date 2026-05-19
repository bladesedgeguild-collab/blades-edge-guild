'use client'

export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const CLASS_COLORS: Record<string, string> = {
  MAGE: '#3fc7eb', PALADIN: '#f48cba', WARRIOR: '#c69b3a',
  PRIEST: '#ffffff', DRUID: '#ff7c0a', HUNTER: '#aad372',
  ROGUE: '#fff468', WARLOCK: '#8788ee', SHAMAN: '#0070dd',
  DEATH_KNIGHT: '#c41e3a', MONK: '#00ff98', DEMON_HUNTER: '#a330c9',
}

const CLASSES = [
  'WARRIOR', 'PALADIN', 'HUNTER', 'ROGUE', 'PRIEST',
  'SHAMAN', 'MAGE', 'WARLOCK', 'DRUID',
]

type Step = 'search' | 'confirm' | 'cinematic' | 'alts' | 'done'

type SearchChar = {
  id: string
  name: string
  class: string
  level: number
  rank_name: string | null
  rank_index: number | null
  last_zone: string | null
  claimed_by: string | null
  joined_guild_at: string | null
  professions: { name: string; skill_level: number; is_primary: boolean }[]
}

const shellBg = {
  background: `linear-gradient(180deg, rgba(13,11,7,0.94), rgba(13,11,7,0.98)),
               url('/images/hero-portal.png') center/cover fixed`,
} as React.CSSProperties

const crestStyle: React.CSSProperties = {
  width: 148,
  filter: `drop-shadow(0 0 18px oklch(0.7 0.20 145 / 0.55)) drop-shadow(0 0 6px oklch(0.7 0.15 258 / 0.6))`,
  animation: 'be-aura-pulse 4.5s ease-in-out infinite',
}

function StepHeader({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <div className="mb-6 text-center">
      <p style={{ fontFamily: 'var(--be-font-display)', fontSize: 11, letterSpacing: '0.15em', color: 'var(--be-gold)', textTransform: 'uppercase' }}>
        Step {String(current).padStart(2, '0')} · of · {String(total).padStart(2, '0')}
      </p>
      <div className="flex justify-center gap-2 mt-2 mb-3">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: i < current ? 'var(--be-gold)' : 'var(--be-iron-3)',
            }}
          />
        ))}
      </div>
      <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: 22, color: 'var(--be-ink)', margin: 0 }}>
        {label}
      </h2>
    </div>
  )
}

function CharRow({
  char,
  onClick,
  selected,
  showCheck,
}: {
  char: SearchChar
  onClick: () => void
  selected?: boolean
  showCheck?: boolean
}) {
  const color = CLASS_COLORS[char.class] ?? '#888'
  const claimed = !!char.claimed_by
  return (
    <button
      onClick={onClick}
      disabled={claimed && !selected}
      title={claimed && !selected ? 'This character is already claimed' : undefined}
      className="w-full text-left flex items-center gap-3 px-4 py-2.5 transition-colors relative overflow-hidden"
      style={{
        background: selected ? 'rgba(201,168,76,0.08)' : 'transparent',
        cursor: claimed && !selected ? 'not-allowed' : 'pointer',
        opacity: claimed && !selected ? 0.5 : 1,
      }}
      onMouseEnter={(e) => { if (!claimed) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = selected ? 'rgba(201,168,76,0.08)' : 'transparent' }}
    >
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color }} />
      <span style={{ marginLeft: 8, fontFamily: 'var(--be-font-display)', fontSize: 14, color: claimed ? 'var(--be-iron-2)' : 'var(--be-gold)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {char.name}
      </span>
      <span style={{ fontFamily: 'var(--be-font-display)', fontSize: 11, color: 'var(--be-iron-2)', flexShrink: 0 }}>
        L{char.level}
      </span>
      <span style={{ fontFamily: 'var(--be-font-body)', fontSize: 12, color, flexShrink: 0 }}>
        {char.class.charAt(0) + char.class.slice(1).toLowerCase().replace('_', ' ')}
      </span>
      {char.rank_name && (
        <span style={{ fontSize: 11, color: 'var(--be-iron-2)', fontFamily: 'var(--be-font-display)', flexShrink: 0 }}>
          {char.rank_name}
        </span>
      )}
      {claimed && (
        <span style={{ fontSize: 10, color: 'var(--be-iron-2)', fontFamily: 'var(--be-font-display)', letterSpacing: '0.1em', border: '1px solid var(--be-iron-3)', borderRadius: 2, padding: '1px 4px', flexShrink: 0 }}>
          CLAIMED
        </span>
      )}
      {showCheck && selected && (
        <span style={{ color: 'var(--be-gold)', fontSize: 14, flexShrink: 0 }}>✓</span>
      )}
    </button>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('search')
  const [selectedChar, setSelectedChar] = useState<SearchChar | null>(null)
  const [selectedAlts, setSelectedAlts] = useState<string[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchChar[]>([])
  const [rosterStats, setRosterStats] = useState<{ total: number; unclaimed: number } | null>(null)

  const [showNewMember, setShowNewMember] = useState(false)
  const [newName, setNewName] = useState('')
  const [newClass, setNewClass] = useState('WARRIOR')
  const [newLevel, setNewLevel] = useState(60)

  const [allUnclaimed, setAllUnclaimed] = useState<SearchChar[]>([])
  const [altFilter, setAltFilter] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showContinue, setShowContinue] = useState(false)

  const cinematicTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch roster stats on mount
  useEffect(() => {
    fetch('/api/characters/search?count=true')
      .then((r) => r.json())
      .then((d) => setRosterStats(d))
      .catch(() => {})
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/characters/search?q=${encodeURIComponent(searchQuery)}`)
      const d = await res.json()
      setSearchResults(d.characters ?? [])
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  // Fetch all unclaimed for alts step
  useEffect(() => {
    if (step !== 'alts') return
    fetch(`/api/characters/search?q=${encodeURIComponent(altFilter.length >= 2 ? altFilter : 'a')}`)
      .then((r) => r.json())
      .then((d) => {
        const chars: SearchChar[] = d.characters ?? []
        setAllUnclaimed(chars.filter((c) => !c.claimed_by && c.id !== selectedChar?.id))
      })
      .catch(() => {})
  }, [step, altFilter, selectedChar])

  // Cinematic timer
  useEffect(() => {
    if (step !== 'cinematic') return
    setShowContinue(false)
    cinematicTimer.current = setTimeout(() => setShowContinue(true), 3300)
    return () => { if (cinematicTimer.current) clearTimeout(cinematicTimer.current) }
  }, [step])

  async function handleClaimMain(char: SearchChar) {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/characters/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character_id: char.id, is_alt: false }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed to claim character'); return }
    setSelectedChar(char)
    setStep('cinematic')
  }

  async function handleCreateNew() {
    if (!newName.trim()) { setError('Enter a character name.'); return }
    setLoading(true)
    setError(null)
    const res = await fetch('/api/characters/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), class: newClass, level: newLevel, is_alt: false }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed to create character'); return }
    setSelectedChar({
      id: data.character.id,
      name: newName.trim(),
      class: newClass,
      level: newLevel,
      rank_name: null,
      rank_index: null,
      last_zone: null,
      claimed_by: null,
      joined_guild_at: null,
      professions: [],
    })
    setStep('cinematic')
  }

  async function handleClaimAlts() {
    setLoading(true)
    setError(null)
    for (const id of selectedAlts) {
      await fetch('/api/characters/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character_id: id, is_alt: true }),
      })
    }
    setLoading(false)
    await completeOnboarding()
  }

  async function completeOnboarding() {
    setLoading(true)
    await fetch('/api/users/complete-onboarding', { method: 'PATCH' })
    setLoading(false)
    router.push('/dashboard')
    router.refresh()
  }

  function toggleAlt(id: string) {
    setSelectedAlts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const filteredAlts = altFilter.length >= 2
    ? allUnclaimed.filter((c) => c.name.toLowerCase().includes(altFilter.toLowerCase()))
    : allUnclaimed

  const primaryProfs = selectedChar?.professions.filter((p) => p.is_primary) ?? []

  // ── CINEMATIC ──
  if (step === 'cinematic') {
    const embers = Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 3 + Math.random() * 2,
      delay: Math.random() * 6,
      duration: 6 + Math.random() * 6,
      emberX: `${(Math.random() - 0.5) * 120}px`,
    }))
    return (
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 60%, oklch(0.18 0.10 145 / 0.35) 0%, #000 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {embers.map((e) => (
          <span
            key={e.id}
            style={{
              position: 'absolute',
              bottom: '-10px',
              left: e.left,
              width: e.size,
              height: e.size,
              borderRadius: '50%',
              backgroundColor: 'var(--be-gold)',
              boxShadow: '0 0 4px var(--be-gold)',
              animation: `be-ember-rise ${e.duration}s ease-in ${e.delay}s infinite`,
              ['--ember-x' as string]: e.emberX,
            } as React.CSSProperties}
          />
        ))}
        <div style={{ textAlign: 'center', animation: 'be-sigil-rise 1.4s ease-out both', position: 'relative', zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/guild-crest.png"
            alt="Guild Crest"
            style={{ width: 220, margin: '0 auto 24px', display: 'block', animation: 'be-aura-pulse 4.5s ease-in-out infinite' }}
          />
          <p style={{ fontFamily: 'var(--be-font-display)', fontSize: 12, letterSpacing: '0.25em', color: 'var(--be-portal)', textTransform: 'uppercase', marginBottom: 12 }}>
            The Oath is Sealed
          </p>
          <p style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 72, color: 'var(--be-ink)', lineHeight: 1, marginBottom: 16 }}>
            {selectedChar?.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
              backgroundColor: CLASS_COLORS[selectedChar?.class ?? ''] ?? '#888',
            }} />
            <span style={{ fontFamily: 'var(--be-font-display)', fontSize: 13, color: 'var(--be-ink-2)', letterSpacing: '0.12em' }}>
              {selectedChar?.class} · OF BLÅDES EDGE
            </span>
          </div>
          {showContinue && (
            <button
              onClick={() => setStep('alts')}
              style={{
                marginTop: 40,
                padding: '12px 32px',
                backgroundColor: 'var(--be-gold)',
                color: '#0d0b07',
                border: 'none',
                borderRadius: 'var(--be-radius)',
                fontFamily: 'var(--be-font-display)',
                fontSize: 14,
                letterSpacing: '0.1em',
                cursor: 'pointer',
                animation: 'be-fade-in 0.6s ease-out both',
              }}
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── SHELL (all other steps) ──
  return (
    <div style={{ ...shellBg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '48px 16px' }}>
      <div style={{ width: '100%', maxWidth: 560, position: 'relative' }}>
        {/* Side rails */}
        <span style={{
          position: 'absolute', left: -2, top: 0, bottom: 0, width: 2,
          background: 'linear-gradient(180deg, transparent, var(--be-gold), transparent)',
          opacity: 0.4,
        }} />
        <span style={{
          position: 'absolute', right: -2, top: 0, bottom: 0, width: 2,
          background: 'linear-gradient(180deg, transparent, var(--be-gold), transparent)',
          opacity: 0.4,
        }} />

        {/* Guild crest */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/guild-crest.png" alt="Blådes Edge" style={crestStyle} />
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(165,30,30,0.3)', border: '1px solid rgba(200,60,60,0.4)', borderRadius: 4, color: '#f87171', fontSize: 14, fontFamily: 'var(--be-font-ui)' }}>
            {error}
          </div>
        )}

        {/* ── SEARCH STEP ── */}
        {step === 'search' && (
          <div>
            <StepHeader current={1} total={3} label="Claim your character" />
            <p style={{ fontFamily: 'var(--be-font-body)', fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 15, marginBottom: 20, textAlign: 'center' }}>
              Find yourself in the roster. Start typing your character&apos;s name.
            </p>

            {!showNewMember && (
              <>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--be-iron-2)', pointerEvents: 'none', fontSize: 16 }}>
                    ⌕
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Darliouse, Skålbogg, Raghop…"
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 36px',
                      backgroundColor: 'var(--be-bg-1)',
                      border: '1px solid var(--be-iron-3)',
                      borderRadius: 'var(--be-radius)',
                      color: 'var(--be-ink)',
                      fontFamily: 'var(--be-font-body)',
                      fontSize: 17,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--be-gold)' }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--be-iron-3)' }}
                  />
                  {searchResults.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                      backgroundColor: 'var(--be-bg-1)',
                      border: '1px solid var(--be-iron-3)',
                      borderTop: 'none',
                      borderRadius: '0 0 var(--be-radius) var(--be-radius)',
                      overflow: 'hidden',
                    }}>
                      {searchResults.map((char) => (
                        <CharRow
                          key={char.id}
                          char={char}
                          onClick={() => {
                            if (!char.claimed_by) {
                              setSelectedChar(char)
                              setStep('confirm')
                              setSearchQuery('')
                              setSearchResults([])
                            }
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {rosterStats && (
                  <p style={{ fontSize: 12, color: 'var(--be-ink-4)', fontFamily: 'var(--be-font-ui)', textAlign: 'center', marginBottom: 16 }}>
                    {rosterStats.total} characters in roster · {rosterStats.unclaimed} unclaimed
                  </p>
                )}

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <button
                    onClick={() => setShowNewMember(true)}
                    style={{ fontFamily: 'var(--be-font-body)', fontStyle: 'italic', fontSize: 14, color: 'var(--be-ink-4)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    I&apos;m a new member — create my character
                  </button>
                </div>
              </>
            )}

            {showNewMember && (
              <div style={{ backgroundColor: 'var(--be-bg-1)', border: '1px solid var(--be-iron-3)', borderRadius: 4, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="text"
                  placeholder="Character name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ padding: '10px 12px', backgroundColor: 'var(--be-bg-2)', border: '1px solid var(--be-iron-3)', borderRadius: 'var(--be-radius)', color: 'var(--be-ink)', fontFamily: 'var(--be-font-body)', fontSize: 15, outline: 'none' }}
                />
                <select
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  style={{ padding: '10px 12px', backgroundColor: 'var(--be-bg-2)', border: '1px solid var(--be-iron-3)', borderRadius: 'var(--be-radius)', color: 'var(--be-ink)', fontFamily: 'var(--be-font-body)', fontSize: 15, outline: 'none' }}
                >
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Level"
                  value={newLevel}
                  min={1}
                  max={70}
                  onChange={(e) => setNewLevel(parseInt(e.target.value) || 1)}
                  style={{ padding: '10px 12px', backgroundColor: 'var(--be-bg-2)', border: '1px solid var(--be-iron-3)', borderRadius: 'var(--be-radius)', color: 'var(--be-ink)', fontFamily: 'var(--be-font-body)', fontSize: 15, outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleCreateNew}
                    disabled={loading}
                    style={{ flex: 1, padding: '11px 0', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
                  >
                    {loading ? 'Creating…' : 'Create & Claim'}
                  </button>
                  <button
                    onClick={() => setShowNewMember(false)}
                    style={{ flex: 1, padding: '11px 0', backgroundColor: 'transparent', color: 'var(--be-iron-2)', border: '1px solid var(--be-iron-3)', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CONFIRM STEP ── */}
        {step === 'confirm' && selectedChar && (
          <div>
            <StepHeader current={2} total={3} label="Is this you?" />
            <div style={{
              background: 'linear-gradient(135deg, var(--be-bg-1) 0%, var(--be-bg-2) 100%)',
              border: '1px solid var(--be-iron-3)',
              borderLeft: `4px solid ${CLASS_COLORS[selectedChar.class] ?? '#888'}`,
              borderRadius: 'var(--be-radius)',
              padding: 24,
              marginBottom: 20,
            }}>
              <p style={{ fontFamily: 'var(--be-font-display)', fontSize: 11, letterSpacing: '0.15em', color: CLASS_COLORS[selectedChar.class] ?? '#888', marginBottom: 6 }}>
                {selectedChar.class}
              </p>
              <h1 style={{ fontFamily: 'var(--be-font-display)', fontSize: 48, color: 'var(--be-ink)', margin: '0 0 6px', lineHeight: 1 }}>
                {selectedChar.name}
              </h1>
              <p style={{ fontFamily: 'var(--be-font-body)', fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 15, marginBottom: 16 }}>
                Level {selectedChar.level}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                {selectedChar.rank_name && (
                  <div>
                    <p style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--be-ink-4)', fontFamily: 'var(--be-font-display)', marginBottom: 2 }}>GUILD RANK</p>
                    <span style={{ display: 'inline-block', padding: '2px 8px', border: '1px solid var(--be-gold-3)', borderRadius: 2, fontSize: 13, color: 'var(--be-gold)', fontFamily: 'var(--be-font-display)' }}>{selectedChar.rank_name}</span>
                  </div>
                )}
                {selectedChar.joined_guild_at && (
                  <div>
                    <p style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--be-ink-4)', fontFamily: 'var(--be-font-display)', marginBottom: 2 }}>MEMBER SINCE</p>
                    <p style={{ fontSize: 13, color: 'var(--be-ink-2)', fontFamily: 'var(--be-font-body)' }}>
                      {new Date(selectedChar.joined_guild_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
                {primaryProfs.length > 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--be-ink-4)', fontFamily: 'var(--be-font-display)', marginBottom: 2 }}>PROFESSIONS</p>
                    <p style={{ fontSize: 13, color: 'var(--be-ink-2)', fontFamily: 'var(--be-font-body)' }}>
                      {primaryProfs.map((p) => p.name).join(' / ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <button
                onClick={() => { setSelectedChar(null); setStep('search') }}
                style={{ flex: 1, padding: '12px 0', backgroundColor: 'transparent', border: '1px solid var(--be-iron-3)', borderRadius: 'var(--be-radius)', color: 'var(--be-iron-2)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: 'pointer' }}
              >
                ← This isn&apos;t me
              </button>
              <button
                onClick={() => handleClaimMain(selectedChar)}
                disabled={loading}
                style={{ flex: 2, padding: '12px 0', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? 'Claiming…' : `Yes, claim ${selectedChar.name}`}
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--be-ink-4)', fontFamily: 'var(--be-font-body)', fontStyle: 'italic', textAlign: 'center' }}>
              Claiming binds {selectedChar.name} to this account. Made a mistake? You can release the character from your profile settings.
            </p>
          </div>
        )}

        {/* ── ALTS STEP ── */}
        {step === 'alts' && (
          <div>
            <StepHeader current={3} total={3} label="Add your alts" />
            <p style={{ fontFamily: 'var(--be-font-body)', color: 'var(--be-ink-3)', fontSize: 15, textAlign: 'center', marginBottom: 6 }}>
              Pick any other characters on this account — they&apos;ll be grouped under{' '}
              <span style={{ color: 'var(--be-gold)' }}>{selectedChar?.name}</span>.
            </p>
            <p style={{ fontSize: 12, color: 'var(--be-ink-4)', fontFamily: 'var(--be-font-body)', fontStyle: 'italic', textAlign: 'center', marginBottom: 20 }}>
              You can come back and add more anytime.
            </p>

            <input
              type="text"
              value={altFilter}
              onChange={(e) => setAltFilter(e.target.value)}
              placeholder="Filter unclaimed roster…"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--be-bg-1)',
                border: '1px solid var(--be-iron-3)',
                borderRadius: 'var(--be-radius)',
                color: 'var(--be-ink)',
                fontFamily: 'var(--be-font-body)',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 8,
              }}
              onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--be-gold)' }}
              onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--be-iron-3)' }}
            />

            <div style={{
              maxHeight: 360,
              overflowY: 'auto',
              backgroundColor: 'var(--be-bg-1)',
              border: '1px solid var(--be-iron-3)',
              borderRadius: 'var(--be-radius)',
              marginBottom: 24,
            }}>
              {filteredAlts.length === 0 ? (
                <p style={{ padding: '20px', textAlign: 'center', color: 'var(--be-ink-4)', fontFamily: 'var(--be-font-body)', fontStyle: 'italic', fontSize: 14 }}>
                  {altFilter.length >= 2 ? 'No matches found.' : 'Type to search unclaimed characters.'}
                </p>
              ) : (
                filteredAlts.map((char) => (
                  <CharRow
                    key={char.id}
                    char={char}
                    onClick={() => toggleAlt(char.id)}
                    selected={selectedAlts.includes(char.id)}
                    showCheck
                  />
                ))
              )}
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--be-font-display)', fontSize: 40, color: 'var(--be-gold)', margin: 0, lineHeight: 1 }}>
                {selectedAlts.length}
              </p>
              <p style={{ fontFamily: 'var(--be-font-display)', fontSize: 11, letterSpacing: '0.15em', color: 'var(--be-ink-3)', textTransform: 'uppercase', marginTop: 4 }}>
                Alts Selected
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={completeOnboarding}
                disabled={loading}
                style={{ flex: 1, padding: '12px 0', backgroundColor: 'transparent', border: '1px solid var(--be-iron-3)', borderRadius: 'var(--be-radius)', color: 'var(--be-iron-2)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
              >
                Skip for now
              </button>
              <button
                onClick={selectedAlts.length > 0 ? handleClaimAlts : completeOnboarding}
                disabled={loading}
                style={{ flex: 2, padding: '12px 0', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? 'Saving…' : selectedAlts.length > 0 ? `Claim ${selectedAlts.length} alt${selectedAlts.length > 1 ? 's' : ''}` : 'Choose alts…'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
