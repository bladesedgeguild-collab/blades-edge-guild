'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { getCharacterArt } from '@/lib/character-art'

const CLASS_COLORS: Record<string, string> = {
  MAGE: '#3fc7eb', PALADIN: '#f48cba', WARRIOR: '#c69b3a',
  PRIEST: '#ffffff', DRUID: '#ff7c0a', HUNTER: '#aad372',
  ROGUE: '#fff468', WARLOCK: '#8788ee', SHAMAN: '#0070dd',
  DEATH_KNIGHT: '#c41e3a', MONK: '#00ff98', DEMON_HUNTER: '#a330c9',
}

const RACE_CLASSES: Record<string, string[]> = {
  'Human':     ['Warrior', 'Paladin', 'Rogue', 'Priest', 'Mage', 'Warlock'],
  'Dwarf':     ['Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest'],
  'Night Elf': ['Warrior', 'Hunter', 'Rogue', 'Priest', 'Druid'],
  'Gnome':     ['Warrior', 'Rogue', 'Mage', 'Warlock'],
  'Draenei':   ['Warrior', 'Paladin', 'Hunter', 'Priest', 'Shaman', 'Mage'],
}

type Step =
  | 'search' | 'confirm' | 'newForm' | 'newConfirm'
  | 'cinematic'
  | 'alts' | 'altSearch' | 'altConfirm' | 'altNewForm' | 'altNewConfirm'

type CharForm   = { name: string; race: string; cls: string; level: string }
type CharErrors = { name?: string; race?: string; cls?: string; level?: string }

type SearchChar = {
  id: string
  name: string
  class: string
  race: string | null
  level: number
  rank_name: string | null
  rank_index: number | null
  last_zone: string | null
  claimed_by: string | null
  joined_guild_at: string | null
  professions: { name: string; skill_level: number; is_primary: boolean }[]
}

type AltEntry = { id: string; name: string; class: string }

const selectStyle: React.CSSProperties = {
  background: 'rgba(20,14,4,0.9)',
  border: '1px solid rgba(61,46,21,0.6)',
  color: '#f0e6c8',
  fontFamily: 'var(--be-font-body)',
  fontSize: '1rem',
  padding: '12px 16px',
  borderRadius: 4,
  width: '100%',
  cursor: 'pointer',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--be-font-display)',
  fontSize: '0.72rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'rgba(201,150,26,0.8)',
  marginBottom: 6,
  display: 'block',
}

const errorStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#ff6b6b',
  marginTop: 4,
  fontFamily: 'var(--be-font-body)',
}

function StepHeader({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <div className="mb-6 text-center">
      <p style={{ fontFamily: 'var(--be-font-display)', fontSize: 11, letterSpacing: '0.15em', color: 'var(--be-gold)', textTransform: 'uppercase' }}>
        Step {String(current).padStart(2, '0')} · of · {String(total).padStart(2, '0')}
      </p>
      <div className="flex justify-center gap-2 mt-2 mb-3">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: i < current ? 'var(--be-gold)' : 'var(--be-iron-3)' }} />
        ))}
      </div>
      <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: 22, color: 'var(--be-ink)', margin: 0 }}>
        {label}
      </h2>
    </div>
  )
}

function CharRow({ char, onClick, selected, showCheck, disableClaimed }: {
  char: SearchChar; onClick: () => void; selected?: boolean; showCheck?: boolean; disableClaimed?: boolean
}) {
  const color = CLASS_COLORS[char.class] ?? '#888'
  const isDisabled = !!(disableClaimed && char.claimed_by && !selected)
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={isDisabled ? 'Already claimed' : undefined}
      className="w-full text-left flex items-center gap-3 transition-colors relative overflow-hidden"
      style={{ padding: '14px 16px', minHeight: 52, background: selected ? 'rgba(201,150,26,0.1)' : 'transparent', cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.5 : 1, borderBottom: '1px solid rgba(61,46,21,0.4)' }}
      onMouseEnter={(e) => { if (!isDisabled) (e.currentTarget as HTMLElement).style.background = 'rgba(201,150,26,0.1)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = selected ? 'rgba(201,150,26,0.1)' : 'transparent' }}
    >
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: color }} />
      <span style={{ marginLeft: 10, fontFamily: 'var(--be-font-display)', fontSize: '1.1rem', color: isDisabled ? 'var(--be-iron-2)' : 'var(--be-gold)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {char.name}
      </span>
      <span style={{ fontFamily: 'var(--be-font-display)', fontSize: '0.9rem', color: 'var(--be-iron-2)', flexShrink: 0 }}>L{char.level}</span>
      <span style={{ fontFamily: 'var(--be-font-body)', fontSize: '0.9rem', fontWeight: 'bold', color, flexShrink: 0 }}>
        {char.class.charAt(0) + char.class.slice(1).toLowerCase().replace('_', ' ')}
      </span>
      {char.rank_name && (
        <span style={{ fontSize: '0.8rem', color: 'var(--be-gold-2)', fontFamily: 'var(--be-font-display)', flexShrink: 0 }}>{char.rank_name}</span>
      )}
      {char.claimed_by && (
        <span style={{ fontSize: '0.8rem', color: 'var(--be-iron-2)', fontFamily: 'var(--be-font-display)', letterSpacing: '0.1em', border: '1px solid var(--be-iron-3)', borderRadius: 2, padding: '1px 5px', flexShrink: 0 }}>CLAIMED</span>
      )}
      {showCheck && selected && <span style={{ color: 'var(--be-gold)', fontSize: 14, flexShrink: 0 }}>✓</span>}
    </button>
  )
}

function CharFormFields({ form, errors, onChange, onSubmit, submitLabel }: {
  form: CharForm; errors: CharErrors; onChange: (f: CharForm) => void; onSubmit: () => void; submitLabel: string
}) {
  const availableClasses = form.race ? (RACE_CLASSES[form.race] ?? []) : []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={labelStyle}>Character Name</label>
        <input
          type="text" autoComplete="off" placeholder="Exactly as it appears in game"
          value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })}
          style={{ width: '100%', padding: '12px 16px', background: 'rgba(20,14,4,0.9)', border: `1px solid ${errors.name ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)'}`, color: '#f0e6c8', fontFamily: 'var(--be-font-body)', fontSize: '1rem', borderRadius: 4, outline: 'none', boxSizing: 'border-box' }}
          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = errors.name ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)' }}
        />
        {errors.name && <p style={errorStyle}>{errors.name}</p>}
      </div>
      <div>
        <label style={labelStyle}>Race</label>
        <select
          value={form.race} onChange={(e) => onChange({ ...form, race: e.target.value, cls: '' })}
          style={{ ...selectStyle, borderColor: errors.race ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)' }}
          onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
          onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = errors.race ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)' }}
        >
          <option value="">— Select your race —</option>
          {Object.keys(RACE_CLASSES).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {errors.race && <p style={errorStyle}>{errors.race}</p>}
      </div>
      <div>
        <label style={labelStyle}>Class</label>
        <select
          value={form.cls} disabled={!form.race} onChange={(e) => onChange({ ...form, cls: e.target.value })}
          style={{ ...selectStyle, borderColor: errors.cls ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)', opacity: form.race ? 1 : 0.5 }}
          onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
          onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = errors.cls ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)' }}
        >
          <option value="">{form.race ? '— Select your class —' : '— Select race first —'}</option>
          {availableClasses.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.cls && <p style={errorStyle}>{errors.cls}</p>}
      </div>
      <div>
        <label style={labelStyle}>Current Level</label>
        <input
          type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 46"
          value={form.level} onChange={(e) => onChange({ ...form, level: e.target.value.replace(/[^0-9]/g, '') })}
          style={{ width: '100%', padding: '12px 16px', background: 'rgba(20,14,4,0.9)', border: `1px solid ${errors.level ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)'}`, color: '#f0e6c8', fontFamily: 'var(--be-font-body)', fontSize: '1rem', borderRadius: 4, outline: 'none', boxSizing: 'border-box' }}
          onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
          onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = errors.level ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)' }}
        />
        {errors.level && <p style={errorStyle}>{errors.level}</p>}
      </div>
      <button
        onClick={onSubmit}
        style={{ width: '100%', padding: '14px 0', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: '0.9rem', letterSpacing: '0.08em', cursor: 'pointer', marginTop: 4 }}
      >
        {submitLabel}
      </button>
    </div>
  )
}

function ghostBtn(label: string, onClick: () => void) {
  return (
    <button
      onClick={onClick}
      style={{ background: 'none', border: 'none', color: 'var(--be-gold-2)', fontFamily: 'var(--be-font-display)', fontSize: '0.75rem', letterSpacing: '0.1em', cursor: 'pointer', padding: '0 0 20px', display: 'block' }}
    >
      {label}
    </button>
  )
}

function NotInRosterButton({ onClick }: { onClick: () => void }) {
  return (
    <div style={{ marginTop: 16, textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--be-font-body)', fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 14, marginBottom: 12 }}>
        Not in the roster yet?
      </p>
      <button
        onClick={onClick}
        style={{ padding: '12px 24px', background: 'transparent', border: '1px solid rgba(201,150,26,0.4)', borderRadius: 6, color: 'var(--be-gold)', fontFamily: 'var(--be-font-display)', fontSize: '0.85rem', letterSpacing: '0.05em', cursor: 'pointer' }}
        onMouseEnter={(e) => { ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(201,150,26,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
        onMouseLeave={(e) => { ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,150,26,0.4)' }}
      >
        Create New Character →
      </button>
    </div>
  )
}

function SearchInput({ value, onChange, onFocus, onBlur, placeholder, hasDropdown, autoFocus }: {
  value: string; onChange: (v: string) => void; onFocus?: () => void; onBlur?: () => void
  placeholder: string; hasDropdown: boolean; autoFocus?: boolean
}) {
  return (
    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--be-iron-2)', pointerEvents: 'none', fontSize: 16, zIndex: 1 }}>
      ⌕
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
          width: 'calc(100vw)', // overridden by the outer relative div
          padding: '12px 12px 12px 12px',
          backgroundColor: 'var(--be-bg-1)', border: '1px solid var(--be-iron-3)',
          borderRadius: hasDropdown ? 'var(--be-radius) var(--be-radius) 0 0' : 'var(--be-radius)',
          color: 'var(--be-ink)', fontFamily: 'var(--be-font-body)', fontSize: 17, outline: 'none', boxSizing: 'border-box',
        }}
        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--be-gold)'; onFocus?.() }}
        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--be-iron-3)'; onBlur?.() }}
      />
    </span>
  )
}

function validateForm(form: CharForm): CharErrors {
  const errs: CharErrors = {}
  const name = form.name.trim()
  if (!name) errs.name = 'Character name is required.'
  else if (name.length < 2) errs.name = 'Name must be at least 2 characters.'
  else if (name.length > 24) errs.name = 'Name must be 24 characters or fewer.'
  if (!form.race) errs.race = 'Please select a race.'
  if (!form.cls) errs.cls = 'Please select a class.'
  const lvl = parseInt(form.level)
  if (!form.level.trim() || isNaN(lvl) || lvl < 1 || lvl > 70) errs.level = 'Please enter a level between 1 and 70'
  return errs
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('search')

  // Main character
  const [selectedChar, setSelectedChar]     = useState<SearchChar | null>(null)
  const [isNewChar, setIsNewChar]           = useState(false)
  const [searchQuery, setSearchQuery]       = useState('')
  const [searchResults, setSearchResults]   = useState<SearchChar[]>([])
  const [defaultResults, setDefaultResults] = useState<SearchChar[]>([])
  const [searchFocused, setSearchFocused]   = useState(false)
  const [searching, setSearching]           = useState(false)
  const [newForm, setNewForm]               = useState<CharForm>({ name: '', race: '', cls: '', level: '' })
  const [newErrors, setNewErrors]           = useState<CharErrors>({})

  // Alts
  const [addedAlts, setAddedAlts]             = useState<AltEntry[]>([])
  const [altCandidate, setAltCandidate]       = useState<SearchChar | null>(null)
  const [altSearchQuery, setAltSearchQuery]   = useState('')
  const [altSearchResults, setAltSearchResults] = useState<SearchChar[]>([])
  const [altSearching, setAltSearching]       = useState(false)
  const [altNewForm, setAltNewForm]           = useState<CharForm>({ name: '', race: '', cls: '', level: '' })
  const [altNewErrors, setAltNewErrors]       = useState<CharErrors>({})

  // Shared
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [showContinue, setShowContinue] = useState(false)
  const [maleOnRight, setMaleOnRight]   = useState(true)

  const cinematicTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/characters/search?default=true')
      .then((r) => r.json())
      .then((d) => setDefaultResults(d.characters ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (searchQuery.length < 1) { setSearchResults([]); setSearching(false); return }
    setSearching(true)
    const t = setTimeout(async () => {
      const res = await fetch(`/api/characters/search?q=${encodeURIComponent(searchQuery)}`)
      const d = await res.json()
      setSearchResults(d.characters ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    if (altSearchQuery.length < 1) { setAltSearchResults([]); setAltSearching(false); return }
    setAltSearching(true)
    const addedIds = new Set(addedAlts.map((a) => a.id))
    const t = setTimeout(async () => {
      const res = await fetch(`/api/characters/search?q=${encodeURIComponent(altSearchQuery)}`)
      const d = await res.json()
      const chars: SearchChar[] = d.characters ?? []
      setAltSearchResults(chars.filter((c) => !c.claimed_by && c.id !== selectedChar?.id && !addedIds.has(c.id)))
      setAltSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [altSearchQuery, selectedChar, addedAlts])

  useEffect(() => {
    if (step !== 'cinematic') return
    setShowContinue(false)
    cinematicTimer.current = setTimeout(() => setShowContinue(true), 3300)
    return () => { if (cinematicTimer.current) clearTimeout(cinematicTimer.current) }
  }, [step])

  useEffect(() => { setMaleOnRight(Math.random() > 0.5) }, [])

  async function handleClaimMain(char: SearchChar) {
    setLoading(true); setError(null)
    const res = await fetch('/api/characters/claim', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character_id: char.id, is_alt: false }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed to claim character'); return }
    setSelectedChar(char); setIsNewChar(false); setStep('cinematic')
  }

  function handleNewFormSubmit() {
    const errs = validateForm(newForm)
    setNewErrors(errs)
    if (Object.keys(errs).length > 0) return
    setStep('newConfirm')
  }

  async function handleNewCharClaim() {
    setLoading(true); setError(null)
    const res = await fetch('/api/characters/claim-new', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newForm.name.trim(), race: newForm.race, class: newForm.cls.toUpperCase(), level: parseInt(newForm.level), is_new_member: true }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.detail ? `${data.error}: ${data.detail} (${data.code})` : (data.error ?? 'Failed to create character')); return }
    setSelectedChar({ id: data.character.id, name: data.character.name, class: data.character.class, race: newForm.race, level: data.character.level, rank_name: 'Fresh Recruit', rank_index: 9, last_zone: null, claimed_by: null, joined_guild_at: null, professions: [] })
    setIsNewChar(true); setStep('cinematic')
  }

  async function handleFinish() {
    setLoading(true)
    try { await fetch('/api/users/complete-onboarding', { method: 'PATCH' }) } catch (e) { console.error(e) }
    finally { window.location.href = '/dashboard' }
  }

  async function handleClaimRosterAlt(char: SearchChar) {
    setLoading(true); setError(null)
    const res = await fetch('/api/characters/claim-alt', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character_id: char.id }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed to claim alt'); return }
    setAddedAlts((prev) => [...prev, { id: data.character.id, name: data.character.name, class: char.class }])
    setAltCandidate(null); setAltSearchQuery(''); setAltSearchResults([]); setStep('alts')
  }

  function handleAltNewFormSubmit() {
    const errs = validateForm(altNewForm)
    setAltNewErrors(errs)
    if (Object.keys(errs).length > 0) return
    setStep('altNewConfirm')
  }

  async function handleAltNewClaim() {
    setLoading(true); setError(null)
    const res = await fetch('/api/characters/claim-alt', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: altNewForm.name.trim(), race: altNewForm.race, class: altNewForm.cls, level: parseInt(altNewForm.level) }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.detail ? `${data.error}: ${data.detail}` : (data.error ?? 'Failed to create alt')); return }
    setAddedAlts((prev) => [...prev, { id: data.character.id, name: data.character.name, class: altNewForm.cls.toUpperCase() }])
    setAltNewForm({ name: '', race: '', cls: '', level: '' }); setAltSearchQuery(''); setAltSearchResults([]); setStep('alts')
  }

  const dropdownChars = searchQuery.length > 0 ? searchResults : (searchFocused ? defaultResults : [])
  const newFormClassColor = CLASS_COLORS[newForm.cls.toUpperCase()] ?? '#888'
  const primaryProfs = selectedChar?.professions.filter((p) => p.is_primary) ?? []
  const showNotInRoster = searchQuery.length >= 2 && !searching && searchResults.length === 0
  const showAltNotInRoster = altSearchQuery.length >= 2 && !altSearching && altSearchResults.length === 0

  // ── CINEMATIC ──
  if (step === 'cinematic') {
    const art = getCharacterArt(selectedChar?.race ?? null, selectedChar?.class ?? null)
    const leftFigure  = art ? (maleOnRight ? art.female : art.male)   : null
    const rightFigure = art ? (maleOnRight ? art.male   : art.female) : null
    const embers = Array.from({ length: 28 }, (_, i) => ({
      id: i, left: `${Math.random() * 100}%`, size: 3 + Math.random() * 2,
      delay: Math.random() * 6, duration: 6 + Math.random() * 6, emberX: `${(Math.random() - 0.5) * 120}px`,
    }))
    return (
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(ellipse 60% 40% at 50% 30%, rgba(120, 70, 10, 0.15) 0%, transparent 70%), radial-gradient(ellipse at center, rgba(60, 35, 5, 0.95) 0%, rgba(30, 18, 3, 0.98) 45%, rgba(10, 7, 2, 1) 100%)`, overflow: 'hidden' }}>
        {embers.map((e) => (
          <span key={e.id} style={{ position: 'absolute', bottom: '-10px', left: e.left, width: e.size, height: e.size, borderRadius: '50%', backgroundColor: 'var(--be-gold)', boxShadow: '0 0 4px var(--be-gold)', animation: `be-ember-rise ${e.duration}s ease-in ${e.delay}s infinite`, ['--ember-x' as string]: e.emberX } as React.CSSProperties} />
        ))}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: '100%', minHeight: '100vh', position: 'relative' }}>

          <div className="figure-column figure-column-left">
            {leftFigure && (
              <div className="figure-container">
                <div className="layer-positioner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={leftFigure} className="figure-ghost ghost-drift-left" alt="" aria-hidden="true" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                </div>
                <div className="layer-positioner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={leftFigure} className="figure-echo echo-drift-left" alt="" aria-hidden="true" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                </div>
                <div className="layer-positioner">
                  <span className="figure-hero-glow-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={leftFigure} className="figure-hero" alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="oath-center-content" style={{ padding: '40px 20px', animation: 'be-sigil-rise 1.4s ease-out both', position: 'relative' }}>
          <div className="oath-reveal-stack">
          <div style={{ position: 'relative', width: 280, height: 280 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/guild-crest.png" alt="Guild Crest" style={{ width: '280px', height: '280px', borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(201,150,26,0.6)', boxShadow: '0 0 0 6px rgba(201,150,26,0.15), 0 0 40px rgba(26,255,110,0.4), 0 0 80px rgba(26,255,110,0.2)', opacity: 0, animation: 'be-stamp 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '280px', height: '280px', borderRadius: '50%', border: '2px solid rgba(201,150,26,0.8)', opacity: 0, animation: 'be-stamp-ring 0.8s ease-out 1.4s both', pointerEvents: 'none' }} />
          </div>
          <p style={{ fontFamily: 'var(--be-font-display)', fontSize: '1.4rem', letterSpacing: '0.25em', color: 'var(--be-portal)', textTransform: 'uppercase', margin: 0, opacity: 0, animation: 'be-fade-in 0.8s ease-out 1.8s both' }}>
            The Oath is Sealed
          </p>
          <p className="character-name" style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: '7rem', color: 'var(--be-ink)', lineHeight: 1, margin: 0, opacity: 0, animation: 'be-fade-in 0.8s ease-out 2.1s both' }}>
            {selectedChar?.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0, animation: 'be-fade-in 0.6s ease-out 2.4s both' }}>
            <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', backgroundColor: CLASS_COLORS[selectedChar?.class ?? ''] ?? '#888' }} />
            <span style={{ fontFamily: 'var(--be-font-display)', fontSize: '1.2rem', color: 'var(--be-ink-2)', letterSpacing: '0.12em' }}>
              {selectedChar?.class} · {isNewChar ? 'NEW RECRUIT' : 'OF BLÅDES EDGE'}
            </span>
          </div>
          <div className="oath-button-slot">
            {showContinue && (
              <button
                onClick={() => setStep('alts')}
                className="oath-continue-btn"
                style={{ padding: '18px 48px', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: '1.1rem', letterSpacing: '0.1em', cursor: 'pointer', animation: 'be-fade-in 0.6s ease-out both', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Continue →
              </button>
            )}
          </div>
          </div>
          </div>

          <div className="figure-column figure-column-right">
            {rightFigure && (
              <div className="figure-container">
                <div className="layer-positioner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={rightFigure} className="figure-ghost ghost-drift-right" alt="" aria-hidden="true" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                </div>
                <div className="layer-positioner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={rightFigure} className="figure-echo echo-drift-right" alt="" aria-hidden="true" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                </div>
                <div className="layer-positioner">
                  <span className="figure-hero-glow-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={rightFigure} className="figure-hero" alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    )
  }

  // ── SHELL ──
  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 56, paddingBottom: 64, paddingLeft: 16, paddingRight: 16, background: "url('/images/hero-portal.png') center/cover no-repeat fixed" }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        <div style={{ textAlign: 'center', marginBottom: -60, position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-block', width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 0 0 2px rgba(201,150,26,0.4), 0 0 30px rgba(26,255,110,0.35), 0 0 60px rgba(26,255,110,0.15)', animation: 'be-aura-pulse 4.5s ease-in-out infinite' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/guild-crest.png" alt="Blådes Edge" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(10,8,5,0.88)', backdropFilter: 'blur(8px)', border: '1px solid rgba(201,150,26,0.25)', borderRadius: 12, padding: '72px 40px 40px', position: 'relative' }}>
          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(165,30,30,0.3)', border: '1px solid rgba(200,60,60,0.4)', borderRadius: 4, color: '#f87171', fontSize: 14, fontFamily: 'var(--be-font-ui)' }}>
              {error}
            </div>
          )}

          {/* ── SEARCH ── */}
          {step === 'search' && (
            <div>
              <StepHeader current={1} total={3} label="Find Your Character" />
              <p style={{ fontFamily: 'var(--be-font-body)', fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 15, marginBottom: 20, textAlign: 'center' }}>
                Search the guild roster by name.
              </p>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--be-iron-2)', pointerEvents: 'none', fontSize: 16, zIndex: 1 }}>⌕</span>
                <input
                  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Darliouse, Skålbogg, Raghop…"
                  style={{ width: '100%', padding: '12px 12px 12px 36px', backgroundColor: 'var(--be-bg-1)', border: '1px solid var(--be-iron-3)', borderRadius: dropdownChars.length > 0 ? 'var(--be-radius) var(--be-radius) 0 0' : 'var(--be-radius)', color: 'var(--be-ink)', fontFamily: 'var(--be-font-body)', fontSize: 17, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { setSearchFocused(true); (e.target as HTMLInputElement).style.borderColor = 'var(--be-gold)' }}
                  onBlur={(e) => { setSearchFocused(false); (e.target as HTMLInputElement).style.borderColor = 'var(--be-iron-3)' }}
                />
                {dropdownChars.length > 0 && (
                  <div onMouseDown={(e) => e.preventDefault()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, backgroundColor: 'var(--be-bg-0)', border: '1px solid var(--be-gold)', borderTop: 'none', borderRadius: '0 0 var(--be-radius) var(--be-radius)', overflow: 'hidden', maxHeight: 360, overflowY: 'auto' }}>
                    {dropdownChars.map((char) => (
                      <CharRow key={char.id} char={char} disableClaimed onClick={() => {
                        if (!char.claimed_by) { setSelectedChar(char); setStep('confirm'); setSearchQuery(''); setSearchResults([]); setSearchFocused(false) }
                      }} />
                    ))}
                  </div>
                )}
              </div>
              {showNotInRoster && (
                <NotInRosterButton onClick={() => { setNewForm({ name: searchQuery, race: '', cls: '', level: '' }); setNewErrors({}); setStep('newForm') }} />
              )}
            </div>
          )}

          {/* ── NEW FORM ── */}
          {step === 'newForm' && (
            <div>
              <StepHeader current={1} total={3} label="Declare your character" />
              {ghostBtn('← Search the roster instead', () => { setStep('search'); setNewErrors({}) })}
              <CharFormFields form={newForm} errors={newErrors} onChange={setNewForm} onSubmit={handleNewFormSubmit} submitLabel="Continue →" />
            </div>
          )}

          {/* ── CONFIRM (roster character) ── */}
          {step === 'confirm' && selectedChar && (
            <div>
              <StepHeader current={2} total={3} label="Is this you?" />
              <div style={{ background: 'linear-gradient(135deg, var(--be-bg-1) 0%, var(--be-bg-2) 100%)', border: '1px solid var(--be-iron-3)', borderLeft: `4px solid ${CLASS_COLORS[selectedChar.class] ?? '#888'}`, borderRadius: 'var(--be-radius)', padding: 24, marginBottom: 20 }}>
                <p style={{ fontFamily: 'var(--be-font-display)', fontSize: 11, letterSpacing: '0.15em', color: CLASS_COLORS[selectedChar.class] ?? '#888', marginBottom: 6 }}>{selectedChar.class}</p>
                <h1 style={{ fontFamily: 'var(--be-font-display)', fontSize: 48, color: 'var(--be-ink)', margin: '0 0 6px', lineHeight: 1 }}>{selectedChar.name}</h1>
                <p style={{ fontFamily: 'var(--be-font-body)', fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 15, marginBottom: 16 }}>Level {selectedChar.level}</p>
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
                      <p style={{ fontSize: 13, color: 'var(--be-ink-2)', fontFamily: 'var(--be-font-body)' }}>{new Date(selectedChar.joined_guild_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  )}
                  {primaryProfs.length > 0 && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--be-ink-4)', fontFamily: 'var(--be-font-display)', marginBottom: 2 }}>PROFESSIONS</p>
                      <p style={{ fontSize: 13, color: 'var(--be-ink-2)', fontFamily: 'var(--be-font-body)' }}>{primaryProfs.map((p) => p.name).join(' / ')}</p>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button onClick={() => { setSelectedChar(null); setStep('search') }} style={{ flex: 1, padding: '12px 0', backgroundColor: 'transparent', border: '1px solid var(--be-iron-3)', borderRadius: 'var(--be-radius)', color: 'var(--be-iron-2)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: 'pointer' }}>← Not me, search again</button>
                <button onClick={() => handleClaimMain(selectedChar)} disabled={loading} style={{ flex: 2, padding: '12px 0', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                  {loading ? 'Claiming…' : 'Yes, this is me →'}
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--be-ink-4)', fontFamily: 'var(--be-font-body)', fontStyle: 'italic', textAlign: 'center' }}>Claiming binds {selectedChar.name} to this account. You can release it from your profile settings.</p>
            </div>
          )}

          {/* ── NEW CONFIRM ── */}
          {step === 'newConfirm' && (
            <div>
              <StepHeader current={2} total={3} label="Is this correct?" />
              <div style={{ background: 'linear-gradient(135deg, var(--be-bg-1) 0%, var(--be-bg-2) 100%)', border: '1px solid var(--be-iron-3)', borderLeft: `4px solid ${newFormClassColor}`, borderRadius: 'var(--be-radius)', padding: 24, marginBottom: 20 }}>
                <p style={{ fontFamily: 'var(--be-font-display)', fontSize: 11, letterSpacing: '0.15em', color: newFormClassColor, marginBottom: 6 }}>{newForm.cls.toUpperCase()}</p>
                <h1 style={{ fontFamily: 'var(--be-font-display)', fontSize: 48, color: 'var(--be-ink)', margin: '0 0 6px', lineHeight: 1 }}>{newForm.name}</h1>
                <p style={{ fontFamily: 'var(--be-font-body)', fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 15, marginBottom: 16 }}>Level {newForm.level}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                  <div>
                    <p style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--be-ink-4)', fontFamily: 'var(--be-font-display)', marginBottom: 2 }}>GUILD RANK</p>
                    <span style={{ display: 'inline-block', padding: '2px 8px', border: '1px solid var(--be-gold-3)', borderRadius: 2, fontSize: 13, color: 'var(--be-gold)', fontFamily: 'var(--be-font-display)' }}>Fresh Recruit</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--be-ink-4)', fontFamily: 'var(--be-font-display)', marginBottom: 2 }}>PROFESSIONS</p>
                    <p style={{ fontSize: 13, color: 'var(--be-ink-3)', fontFamily: 'var(--be-font-body)', fontStyle: 'italic' }}>To Be Determined</p>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button onClick={() => setStep('newForm')} style={{ flex: 1, padding: '12px 0', backgroundColor: 'transparent', border: '1px solid var(--be-iron-3)', borderRadius: 'var(--be-radius)', color: 'var(--be-iron-2)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: 'pointer' }}>← Make Edits</button>
                <button onClick={handleNewCharClaim} disabled={loading} style={{ flex: 2, padding: '12px 0', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                  {loading ? 'Claiming…' : `Yes, claim ${newForm.name}`}
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--be-ink-4)', fontFamily: 'var(--be-font-body)', fontStyle: 'italic', textAlign: 'center' }}>You&apos;ll be added to the guild roster as a new recruit.</p>
            </div>
          )}

          {/* ── ALTS ── */}
          {step === 'alts' && (
            <div>
              <StepHeader current={3} total={3} label="Add your alts" />
              <p style={{ fontFamily: 'var(--be-font-body)', color: 'var(--be-ink-3)', fontSize: 15, textAlign: 'center', marginBottom: 6 }}>
                Got other characters in the guild? Add them here.
              </p>
              <p style={{ fontSize: 12, color: 'var(--be-ink-4)', fontFamily: 'var(--be-font-body)', fontStyle: 'italic', textAlign: 'center', marginBottom: 20 }}>
                You can come back and add more anytime.
              </p>
              {addedAlts.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {addedAlts.map((alt) => {
                    const color = CLASS_COLORS[alt.class] ?? '#888'
                    return (
                      <div key={alt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(61,46,21,0.4)' }}>
                        <span style={{ width: 4, height: 24, backgroundColor: color, borderRadius: 2, flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--be-font-display)', fontSize: '1rem', color: 'var(--be-gold)', flex: 1 }}>{alt.name}</span>
                        <span style={{ fontFamily: 'var(--be-font-body)', fontSize: '0.85rem', color, flexShrink: 0 }}>
                          {alt.class.charAt(0) + alt.class.slice(1).toLowerCase().replace('_', ' ')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
              <button
                onClick={() => { setAltSearchQuery(''); setAltSearchResults([]); setStep('altSearch') }}
                style={{ width: '100%', padding: '12px 0', marginBottom: 12, backgroundColor: 'transparent', border: '1px solid rgba(201,150,26,0.4)', borderRadius: 6, color: 'var(--be-gold)', fontFamily: 'var(--be-font-display)', fontSize: '0.85rem', letterSpacing: '0.05em', cursor: 'pointer' }}
                onMouseEnter={(e) => { ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(201,150,26,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
                onMouseLeave={(e) => { ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,150,26,0.4)' }}
              >
                + Add an Alt
              </button>
              <button onClick={handleFinish} disabled={loading} style={{ width: '100%', padding: '14px 0', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: '0.9rem', letterSpacing: '0.08em', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                {loading ? 'Entering the Hall…' : 'Done, take me to the Hall →'}
              </button>
            </div>
          )}

          {/* ── ALT SEARCH ── */}
          {step === 'altSearch' && (
            <div>
              {ghostBtn('← Back to alts', () => setStep('alts'))}
              <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: 22, color: 'var(--be-ink)', margin: '0 0 8px', textAlign: 'center' }}>Search for an Alt</h2>
              <p style={{ fontFamily: 'var(--be-font-body)', fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 14, marginBottom: 20, textAlign: 'center' }}>Search unclaimed roster characters</p>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--be-iron-2)', pointerEvents: 'none', fontSize: 16, zIndex: 1 }}>⌕</span>
                <input
                  type="text" value={altSearchQuery} onChange={(e) => setAltSearchQuery(e.target.value)}
                  placeholder="Type alt's name…" autoFocus
                  style={{ width: '100%', padding: '12px 12px 12px 36px', backgroundColor: 'var(--be-bg-1)', border: '1px solid var(--be-iron-3)', borderRadius: altSearchResults.length > 0 ? 'var(--be-radius) var(--be-radius) 0 0' : 'var(--be-radius)', color: 'var(--be-ink)', fontFamily: 'var(--be-font-body)', fontSize: 17, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--be-gold)' }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--be-iron-3)' }}
                />
                {altSearchResults.length > 0 && (
                  <div onMouseDown={(e) => e.preventDefault()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, backgroundColor: 'var(--be-bg-0)', border: '1px solid var(--be-gold)', borderTop: 'none', borderRadius: '0 0 var(--be-radius) var(--be-radius)', overflow: 'hidden', maxHeight: 300, overflowY: 'auto' }}>
                    {altSearchResults.map((char) => (
                      <CharRow key={char.id} char={char} onClick={() => { setAltCandidate(char); setStep('altConfirm') }} />
                    ))}
                  </div>
                )}
              </div>
              {showAltNotInRoster && (
                <NotInRosterButton onClick={() => { setAltNewForm({ name: altSearchQuery, race: '', cls: '', level: '' }); setAltNewErrors({}); setStep('altNewForm') }} />
              )}
            </div>
          )}

          {/* ── ALT CONFIRM (roster) ── */}
          {step === 'altConfirm' && altCandidate && (
            <div>
              {ghostBtn('← Search again', () => { setAltCandidate(null); setStep('altSearch') })}
              <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: 22, color: 'var(--be-ink)', margin: '0 0 16px', textAlign: 'center' }}>Add this alt?</h2>
              <div style={{ background: 'linear-gradient(135deg, var(--be-bg-1) 0%, var(--be-bg-2) 100%)', border: '1px solid var(--be-iron-3)', borderLeft: `4px solid ${CLASS_COLORS[altCandidate.class] ?? '#888'}`, borderRadius: 'var(--be-radius)', padding: 24, marginBottom: 20 }}>
                <p style={{ fontFamily: 'var(--be-font-display)', fontSize: 11, letterSpacing: '0.15em', color: CLASS_COLORS[altCandidate.class] ?? '#888', marginBottom: 6 }}>{altCandidate.class}</p>
                <h1 style={{ fontFamily: 'var(--be-font-display)', fontSize: 40, color: 'var(--be-ink)', margin: '0 0 6px', lineHeight: 1 }}>{altCandidate.name}</h1>
                <p style={{ fontFamily: 'var(--be-font-body)', fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 15 }}>
                  Level {altCandidate.level}{altCandidate.race ? ` · ${altCandidate.race}` : ''}{altCandidate.rank_name ? ` · ${altCandidate.rank_name}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { setAltCandidate(null); setStep('altSearch') }} style={{ flex: 1, padding: '12px 0', backgroundColor: 'transparent', border: '1px solid var(--be-iron-3)', borderRadius: 'var(--be-radius)', color: 'var(--be-iron-2)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: 'pointer' }}>← Not this one</button>
                <button onClick={() => handleClaimRosterAlt(altCandidate)} disabled={loading} style={{ flex: 2, padding: '12px 0', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                  {loading ? 'Adding…' : `Yes, add ${altCandidate.name}`}
                </button>
              </div>
            </div>
          )}

          {/* ── ALT NEW FORM ── */}
          {step === 'altNewForm' && (
            <div>
              {ghostBtn('← Search instead', () => setStep('altSearch'))}
              <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: 22, color: 'var(--be-ink)', margin: '0 0 20px', textAlign: 'center' }}>Create a new alt</h2>
              <CharFormFields form={altNewForm} errors={altNewErrors} onChange={setAltNewForm} onSubmit={handleAltNewFormSubmit} submitLabel="Continue →" />
            </div>
          )}

          {/* ── ALT NEW CONFIRM ── */}
          {step === 'altNewConfirm' && (() => {
            const color = CLASS_COLORS[altNewForm.cls.toUpperCase()] ?? '#888'
            return (
              <div>
                {ghostBtn('← Make Edits', () => setStep('altNewForm'))}
                <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: 22, color: 'var(--be-ink)', margin: '0 0 16px', textAlign: 'center' }}>Add this alt?</h2>
                <div style={{ background: 'linear-gradient(135deg, var(--be-bg-1) 0%, var(--be-bg-2) 100%)', border: '1px solid var(--be-iron-3)', borderLeft: `4px solid ${color}`, borderRadius: 'var(--be-radius)', padding: 24, marginBottom: 20 }}>
                  <p style={{ fontFamily: 'var(--be-font-display)', fontSize: 11, letterSpacing: '0.15em', color, marginBottom: 6 }}>{altNewForm.cls.toUpperCase()}</p>
                  <h1 style={{ fontFamily: 'var(--be-font-display)', fontSize: 40, color: 'var(--be-ink)', margin: '0 0 6px', lineHeight: 1 }}>{altNewForm.name}</h1>
                  <p style={{ fontFamily: 'var(--be-font-body)', fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 15 }}>Level {altNewForm.level} · {altNewForm.race} · Fresh Recruit</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setStep('altNewForm')} style={{ flex: 1, padding: '12px 0', backgroundColor: 'transparent', border: '1px solid var(--be-iron-3)', borderRadius: 'var(--be-radius)', color: 'var(--be-iron-2)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: 'pointer' }}>← Make Edits</button>
                  <button onClick={handleAltNewClaim} disabled={loading} style={{ flex: 2, padding: '12px 0', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                    {loading ? 'Adding…' : `Yes, add ${altNewForm.name}`}
                  </button>
                </div>
              </div>
            )
          })()}

        </div>
      </div>
    </div>
  )
}
