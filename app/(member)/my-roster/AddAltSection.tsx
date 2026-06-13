'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GuildShieldCheck } from '@/components/GuildShieldCheck'

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

type AltChar = {
  id: string; name: string; class: string; race: string | null; level: number; rank_name: string | null
  professions: { name: string; skill_level: number; is_primary: boolean }[]
}

function altProfessions(profs: { name: string; is_primary: boolean }[]): string {
  const primary = profs.filter(p => p.is_primary).slice(0, 2)
  const p1 = primary[0]?.name ?? 'Prof 1 TBD'
  const p2 = primary[1]?.name ?? 'Prof 2 TBD'
  return `${p1}  ${p2}`
}

type SearchChar = {
  id: string; name: string; class: string; race: string | null; level: number
  rank_name: string | null; claimed_by: string | null
  professions: { name: string; skill_level: number; is_primary: boolean }[]
}

type CharForm   = { name: string; race: string; cls: string; level: string }
type CharErrors = { name?: string; race?: string; cls?: string; level?: string }

type ModalStep = 'search' | 'newForm' | 'newConfirm'

const selectStyle: React.CSSProperties = {
  background: 'rgba(20,14,4,0.9)', border: '1px solid rgba(61,46,21,0.6)',
  color: '#f0e6c8', fontFamily: 'var(--be-font-body)', fontSize: '1rem',
  padding: '12px 16px', borderRadius: 4, width: '100%', cursor: 'pointer', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--be-font-display)', fontSize: '0.72rem', letterSpacing: '0.16em',
  textTransform: 'uppercase', color: 'rgba(201,150,26,0.8)', marginBottom: 6, display: 'block',
}

const errorStyle: React.CSSProperties = {
  fontSize: '0.8rem', color: '#ff6b6b', marginTop: 4, fontFamily: 'var(--be-font-body)',
}

const WOW_NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿÐðÞþÆæŒœÅåÄäÖöÜüÑñ]+$/

function validateWowName(name: string): string | null {
  if (!name || name.trim().length === 0) return 'Name is required.'
  if (name.length < 2) return 'Name must be at least 2 characters.'
  if (name.length > 12) return 'Name must be 12 characters or fewer.'
  if (!WOW_NAME_REGEX.test(name)) return 'Names can only contain letters. No numbers, spaces, or symbols.'
  return null
}

function validateForm(form: CharForm): CharErrors {
  const errs: CharErrors = {}
  const nameError = validateWowName(form.name.trim())
  if (nameError) errs.name = nameError
  if (!form.race) errs.race = 'Please select a race.'
  if (!form.cls) errs.cls = 'Please select a class.'
  const lvl = parseInt(form.level)
  if (!form.level.trim() || isNaN(lvl) || lvl < 1 || lvl > 70) errs.level = 'Please enter a level between 1 and 70'
  return errs
}

export function AddAltSection({ alts, mainCharId }: { alts: AltChar[]; mainCharId: string }) {
  const router = useRouter()

  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState<ModalStep>('search')

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchChar[]>([])
  const [searching, setSearching] = useState(false)

  const [selectedChars, setSelectedChars] = useState<SearchChar[]>([])

  const [form, setForm] = useState<CharForm>({ name: '', race: '', cls: '', level: '' })
  const [errors, setErrors] = useState<CharErrors>({})

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCloseWarning, setShowCloseWarning] = useState(false)

  useEffect(() => {
    if (query.length < 1) { setResults([]); setSearching(false); return }
    setSearching(true)
    const t = setTimeout(async () => {
      const res = await fetch(`/api/characters/search?q=${encodeURIComponent(query)}`)
      const d = await res.json()
      const chars: SearchChar[] = d.characters ?? []
      // Deduplicate by id (safety net for join duplicates)
      const unique = chars.filter((c, i, self) => i === self.findIndex((x) => x.id === c.id))
      const altIds = new Set(alts.map((a) => a.id))
      setResults(unique.filter((c) => !c.claimed_by && c.id !== mainCharId && !altIds.has(c.id)))
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query, alts, mainCharId])

  function openModal() {
    setModalOpen(true); setStep('search'); setQuery(''); setResults([])
    setSelectedChars([]); setShowCloseWarning(false)
    setForm({ name: '', race: '', cls: '', level: '' })
    setErrors({}); setError(null)
  }

  function closeModal() { setShowCloseWarning(false); setModalOpen(false) }

  function handleClose() {
    if (selectedChars.length > 0) { setShowCloseWarning(true); return }
    closeModal()
  }

  function handleBackdropClick() {
    if (selectedChars.length > 0) return  // protect selections from accidental dismiss
    closeModal()
  }

  const toggleSelect = (char: SearchChar) => {
    setSelectedChars(prev =>
      prev.find(c => c.id === char.id)
        ? prev.filter(c => c.id !== char.id)
        : [...prev, char]
    )
  }

  const isSelected = (char: SearchChar) => selectedChars.some(c => c.id === char.id)

  async function handleAddAlts() {
    if (selectedChars.length === 0) return
    setLoading(true)
    setError(null)
    for (const char of selectedChars) {
      const res = await fetch('/api/characters/claim-alt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character_id: char.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `Failed to add ${char.name}`)
        setLoading(false)
        return
      }
    }
    setLoading(false)
    setModalOpen(false)
    router.refresh()
  }

  async function handleCreateAlt() {
    setLoading(true); setError(null)
    const res = await fetch('/api/characters/claim-alt', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name.trim(), race: form.race, class: form.cls, level: parseInt(form.level) }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.detail ? `${data.error}: ${data.detail}` : (data.error ?? 'Failed to create alt')); return }
    setModalOpen(false); router.refresh()
  }

  const showNotInRoster = query.length >= 2 && !searching && results.length === 0
  const newFormClassColor = CLASS_COLORS[form.cls.toUpperCase()] ?? '#888'

  // Dynamic columns: max 10 rows per column, up to 4 columns
  const getColumns = (items: SearchChar[]) => {
    const total = items.length
    if (total === 0) return []
    const numCols = Math.min(Math.ceil(total / 10), 4)
    const perCol = Math.ceil(total / numCols)
    const cols: SearchChar[][] = []
    for (let i = 0; i < numCols; i++) {
      cols.push(items.slice(i * perCol, (i + 1) * perCol))
    }
    return cols
  }
  const columns = getColumns(results)

  const renderResultRow = (char: SearchChar) => {
    const color = CLASS_COLORS[char.class] ?? '#888'
    const selected = isSelected(char)
    return (
      <button
        key={char.id}
        className={`alt-result-row${selected ? ' selected' : ''}`}
        onClick={() => toggleSelect(char)}
        style={selected ? { background: '#c9961a' } : {}}
      >
        <div
          className="alt-result-avatar"
          style={selected ? {
            background: 'rgba(26,18,8,0.2)',
            border: '1px solid rgba(26,18,8,0.4)',
            color: '#1a1208',
          } : {
            background: `${color}22`,
            border: `1px solid ${color}99`,
            color,
          }}
        >
          {char.name.charAt(0)}
        </div>
        <div className="alt-result-info">
          <span className="alt-result-name" style={{ color, filter: selected ? 'brightness(0.55)' : 'none' }}>
            {char.name}
          </span>
          <span className="alt-result-meta" style={{ color: selected ? '#5a3a08' : 'var(--be-muted)' }}>
            L{char.level} · {char.class.charAt(0) + char.class.slice(1).toLowerCase().replace('_', ' ')}{char.race ? ` · ${char.race}` : ''}
          </span>
        </div>
        <div className="alt-result-check">
          {selected ? <GuildShieldCheck size={20} color="#1a1208" /> : <div className="alt-result-checkbox" />}
        </div>
      </button>
    )
  }
  const availableClasses = form.race ? (RACE_CLASSES[form.race] ?? []) : []
  const inlineNameError = form.name.length >= 1 ? validateWowName(form.name) : null
  const shownNameError = inlineNameError ?? errors.name
  const nameHasError = !!shownNameError

  return (
    <>
      {/* Tile: Your Alts */}
      <div style={{ background: 'rgba(26,18,8,0.6)', border: '1px solid rgba(61,46,21,0.5)', borderRadius: 4 }}>

        {/* Header row */}
        <div className="alts-tile-header" style={{ padding: '24px 40px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: 'var(--be-font-display)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,150,26,0.85)', margin: 0 }}>
            Your Alts
          </p>
          <button
            onClick={openModal}
            style={{ padding: '4px 12px', background: 'transparent', border: '1px solid rgba(201,150,26,0.3)', borderRadius: 4, color: 'rgba(201,150,26,0.8)', fontFamily: 'var(--be-font-display)', fontSize: '0.62rem', letterSpacing: '0.12em', cursor: 'pointer' }}
            onMouseEnter={(e) => { ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,150,26,0.7)'; (e.currentTarget as HTMLElement).style.color = '#c9961a' }}
            onMouseLeave={(e) => { ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,150,26,0.3)'; (e.currentTarget as HTMLElement).style.color = 'rgba(201,150,26,0.8)' }}
          >
            + ADD ALT
          </button>
        </div>

        {/* Alt cards — two-column grid */}
        {alts.length > 0 && (
          <div className="alts-grid">
            {alts.map((alt) => {
              const color = CLASS_COLORS[alt.class] ?? '#888'
              return (
                <div key={alt.id} className="alt-card" style={{ borderLeft: `4px solid ${color}` }}>
                  <div className="alt-card-left">
                    {/* textTransform: none is critical — prevents Cinzel from converting ß→SS */}
                    <span className="alt-card-name" data-character-name style={{ color, textTransform: 'none' }}>
                      {alt.name}
                    </span>
                    <span className="alt-card-sub">
                      {[alt.class.charAt(0) + alt.class.slice(1).toLowerCase().replace('_', ' '), alt.race, `Level ${alt.level}`].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <div className="alt-card-professions">{altProfessions(alt.professions)}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Alt big button */}
        <div className="alts-tile-footer" style={{ padding: alts.length === 0 ? '0 40px 32px' : '8px 40px 32px' }}>
          {alts.length === 0 && (
            <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.55)', fontSize: '0.9rem', textAlign: 'center', marginBottom: 20 }}>
              Your allies await. Bring your alts into the fold.
            </p>
          )}
          <button className="add-alt-btn" onClick={openModal}>
            <div className="alt-btn-figures">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/characters/Gnome_Warrior_M.png"   className="alt-fig alt-fig-1" alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/characters/Human_Priest_M.png"    className="alt-fig alt-fig-2" alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/characters/Draenei_Shaman_M.png"  className="alt-fig alt-fig-3" alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/characters/NightElf_Druid_F.png"  className="alt-fig alt-fig-4" alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/characters/Dwarf_Rogue_F.png"     className="alt-fig alt-fig-5" alt="" />
            </div>
            <div className="alt-btn-label">
              <span className="alt-btn-title">Add an Alt</span>
              <span className="alt-btn-sub">Bring another character into the guild</span>
            </div>
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="alt-search-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) handleBackdropClick() }}
        >
          <div className="alt-search-modal">

            <button onClick={handleClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--be-iron-2)', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }} aria-label="Close">×</button>

            {showCloseWarning && (
              <div className="alt-close-warning">
                <span>You have {selectedChars.length} character{selectedChars.length > 1 ? 's' : ''} selected.</span>
                <button onClick={closeModal}>Discard and close</button>
                <button onClick={() => setShowCloseWarning(false)}>Keep selecting</button>
              </div>
            )}

            {error && (
              <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(165,30,30,0.3)', border: '1px solid rgba(200,60,60,0.4)', borderRadius: 4, color: '#f87171', fontSize: 14 }}>
                {error}
              </div>
            )}

            {/* ── SEARCH (multi-select) ── */}
            {step === 'search' && (
              <div>
                <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: 20, color: 'var(--be-ink)', margin: '0 0 6px' }}>Search for Alts</h2>
                <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 14, marginBottom: 16 }}>Select one or more unclaimed characters</p>

                {/* Selected tray */}
                {selectedChars.length > 0 && (
                  <div className="alt-selected-tray">
                    {selectedChars.map(char => (
                      <div
                        key={char.id}
                        className="alt-selected-chip"
                        style={{ borderColor: CLASS_COLORS[char.class] ?? '#c9961a' }}
                      >
                        <GuildShieldCheck size={14} color={CLASS_COLORS[char.class] ?? '#c9961a'} />
                        <span style={{ color: CLASS_COLORS[char.class] ?? '#c9961a' }}>{char.name}</span>
                        <button
                          className="alt-selected-remove"
                          onClick={() => toggleSelect(char)}
                          aria-label={`Remove ${char.name}`}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search input */}
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--be-iron-2)', pointerEvents: 'none', fontSize: 16, zIndex: 1 }}>⌕</span>
                  <input
                    type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type a character name…" autoFocus
                    style={{ width: '100%', padding: '12px 12px 12px 36px', backgroundColor: 'var(--be-bg-1)', border: '1px solid var(--be-iron-3)', borderRadius: results.length > 0 ? 'var(--be-radius) var(--be-radius) 0 0' : 'var(--be-radius)', color: 'var(--be-ink)', fontFamily: 'var(--be-font-body)', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--be-gold)' }}
                    onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--be-iron-3)' }}
                  />

                  {results.length > 0 && (
                    <div onMouseDown={(e) => e.preventDefault()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99999, backgroundColor: 'var(--be-bg-1)', border: '1px solid rgba(201,150,26,0.3)', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                      <div
                        className="alt-results-grid"
                        style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
                      >
                        {columns.map((col, colIdx) => (
                          <div key={colIdx} className="alt-results-col">
                            {col.map(renderResultRow)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {showNotInRoster && (
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 14, marginBottom: 12 }}>Not in the roster yet?</p>
                    <button
                      onClick={() => { setForm({ name: query, race: '', cls: '', level: '' }); setErrors({}); setStep('newForm') }}
                      style={{ padding: '10px 22px', background: 'transparent', border: '1px solid rgba(201,150,26,0.4)', borderRadius: 6, color: 'var(--be-gold)', fontFamily: 'var(--be-font-display)', fontSize: '0.82rem', letterSpacing: '0.05em', cursor: 'pointer' }}
                      onMouseEnter={(e) => { ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(201,150,26,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
                      onMouseLeave={(e) => { ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,150,26,0.4)' }}
                    >
                      Create New Alt →
                    </button>
                  </div>
                )}

                {/* Confirm / add button */}
                <button
                  className="alt-confirm-btn"
                  onClick={handleAddAlts}
                  disabled={selectedChars.length === 0 || loading}
                >
                  {loading
                    ? 'Adding…'
                    : selectedChars.length === 0
                      ? 'Select characters above'
                      : `Add ${selectedChars.length} Alt${selectedChars.length > 1 ? 's' : ''} →`
                  }
                </button>
              </div>
            )}

            {/* ── NEW FORM ── */}
            {step === 'newForm' && (
              <div>
                <button onClick={() => setStep('search')} style={{ background: 'none', border: 'none', color: 'var(--be-gold-2)', fontFamily: 'var(--be-font-display)', fontSize: '0.72rem', letterSpacing: '0.1em', cursor: 'pointer', padding: '0 0 16px', display: 'block' }}>← Search instead</button>
                <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: 20, color: 'var(--be-ink)', margin: '0 0 20px' }}>Create a new alt</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Character Name</label>
                    <input type="text" autoComplete="off" value={form.name}
                      maxLength={12}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      style={{ width: '100%', padding: '11px 14px', background: 'rgba(20,14,4,0.9)', border: `1px solid ${nameHasError ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)'}`, color: '#f0e6c8', fontFamily: 'var(--be-font-body)', fontSize: '0.95rem', borderRadius: 4, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
                      onBlur={(e) => {
                        if (form.name.length > 0) {
                          const cap = form.name.replace(/^[a-z]/, (c) => c.toUpperCase())
                          if (cap !== form.name) setForm({ ...form, name: cap })
                        }
                        ;(e.target as HTMLInputElement).style.borderColor = nameHasError ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 }}>
                      <span style={{ flex: 1 }}>{shownNameError && <span style={errorStyle}>{shownNameError}</span>}</span>
                      <span style={{ fontFamily: 'var(--be-font-body)', fontSize: '0.72rem', color: form.name.length >= 12 ? 'var(--be-gold)' : 'rgba(138,122,90,0.5)', flexShrink: 0, marginLeft: 8 }}>
                        {form.name.length} / 12
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Race</label>
                    <select value={form.race} onChange={(e) => setForm({ ...form, race: e.target.value, cls: '' })}
                      style={{ ...selectStyle, borderColor: errors.race ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)' }}
                      onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
                      onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = errors.race ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)' }}
                    >
                      <option value="">— Select race —</option>
                      {Object.keys(RACE_CLASSES).map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {errors.race && <p style={errorStyle}>{errors.race}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Class</label>
                    <select value={form.cls} disabled={!form.race} onChange={(e) => setForm({ ...form, cls: e.target.value })}
                      style={{ ...selectStyle, borderColor: errors.cls ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)', opacity: form.race ? 1 : 0.5 }}
                      onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
                      onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = errors.cls ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)' }}
                    >
                      <option value="">{form.race ? '— Select class —' : '— Select race first —'}</option>
                      {availableClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.cls && <p style={errorStyle}>{errors.cls}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Level</label>
                    <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 46"
                      value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value.replace(/[^0-9]/g, '') })}
                      style={{ width: '100%', padding: '11px 14px', background: 'rgba(20,14,4,0.9)', border: `1px solid ${errors.level ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)'}`, color: '#f0e6c8', fontFamily: 'var(--be-font-body)', fontSize: '0.95rem', borderRadius: 4, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
                      onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = errors.level ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)' }}
                    />
                    {errors.level && <p style={errorStyle}>{errors.level}</p>}
                  </div>
                  <button onClick={() => { const e = validateForm(form); setErrors(e); if (Object.keys(e).length === 0) setStep('newConfirm') }}
                    style={{ width: '100%', padding: '13px 0', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: '0.88rem', letterSpacing: '0.08em', cursor: 'pointer', marginTop: 4 }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── NEW CONFIRM ── */}
            {step === 'newConfirm' && (
              <div>
                <button onClick={() => setStep('newForm')} style={{ background: 'none', border: 'none', color: 'var(--be-gold-2)', fontFamily: 'var(--be-font-display)', fontSize: '0.72rem', letterSpacing: '0.1em', cursor: 'pointer', padding: '0 0 16px', display: 'block' }}>← Make Edits</button>
                <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: 20, color: 'var(--be-ink)', margin: '0 0 16px' }}>Add this alt?</h2>
                <div style={{ background: 'linear-gradient(135deg, var(--be-bg-1) 0%, var(--be-bg-2) 100%)', border: '1px solid var(--be-iron-3)', borderLeft: `4px solid ${newFormClassColor}`, borderRadius: 'var(--be-radius)', padding: 20, marginBottom: 20 }}>
                  <p style={{ fontFamily: 'var(--be-font-display)', fontSize: 10, letterSpacing: '0.15em', color: newFormClassColor, marginBottom: 4 }}>{form.cls.toUpperCase()}</p>
                  <h3 style={{ fontFamily: 'var(--be-font-display)', fontSize: 36, color: 'var(--be-ink)', margin: '0 0 4px', lineHeight: 1 }}>{form.name}</h3>
                  <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 14, margin: 0 }}>Level {form.level} · {form.race} · Fresh Recruit</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStep('newForm')} style={{ flex: 1, padding: '11px 0', backgroundColor: 'transparent', border: '1px solid var(--be-iron-3)', borderRadius: 'var(--be-radius)', color: 'var(--be-iron-2)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: 'pointer' }}>← Make Edits</button>
                  <button onClick={handleCreateAlt} disabled={loading} style={{ flex: 2, padding: '11px 0', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                    {loading ? 'Adding…' : `Yes, add ${form.name}`}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}
