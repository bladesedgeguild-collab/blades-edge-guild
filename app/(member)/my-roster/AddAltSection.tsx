'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
}

type SearchChar = {
  id: string; name: string; class: string; race: string | null; level: number
  rank_name: string | null; claimed_by: string | null
  professions: { name: string; skill_level: number; is_primary: boolean }[]
}

type CharForm   = { name: string; race: string; cls: string; level: string }
type CharErrors = { name?: string; race?: string; cls?: string; level?: string }

type ModalStep = 'search' | 'confirm' | 'newForm' | 'newConfirm'

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

export function AddAltSection({ alts, mainCharId }: { alts: AltChar[]; mainCharId: string }) {
  const router = useRouter()

  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState<ModalStep>('search')

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchChar[]>([])
  const [searching, setSearching] = useState(false)
  const [focused, setFocused] = useState(false)

  const [candidate, setCandidate] = useState<SearchChar | null>(null)
  const [form, setForm] = useState<CharForm>({ name: '', race: '', cls: '', level: '' })
  const [errors, setErrors] = useState<CharErrors>({})

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (query.length < 1) { setResults([]); setSearching(false); return }
    setSearching(true)
    const t = setTimeout(async () => {
      const res = await fetch(`/api/characters/search?q=${encodeURIComponent(query)}`)
      const d = await res.json()
      const chars: SearchChar[] = d.characters ?? []
      const altIds = new Set(alts.map((a) => a.id))
      setResults(chars.filter((c) => !c.claimed_by && c.id !== mainCharId && !altIds.has(c.id)))
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query, alts, mainCharId])

  function openModal() {
    setModalOpen(true); setStep('search'); setQuery(''); setResults([])
    setCandidate(null); setForm({ name: '', race: '', cls: '', level: '' })
    setErrors({}); setError(null)
  }

  function closeModal() {
    setModalOpen(false)
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
    setModalOpen(false)
    router.refresh()
  }

  const showNotInRoster = query.length >= 2 && !searching && results.length === 0
  const newFormClassColor = CLASS_COLORS[form.cls.toUpperCase()] ?? '#888'
  const availableClasses = form.race ? (RACE_CLASSES[form.race] ?? []) : []

  return (
    <>
      {/* Alt cards grid */}
      {alts.length > 0 && (
        <div style={{ padding: '0 40px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {alts.map((alt) => {
            const color = CLASS_COLORS[alt.class] ?? '#888'
            return (
              <div key={alt.id} style={{ background: 'rgba(20,14,4,0.6)', border: `1px solid ${color}33`, borderLeft: `3px solid ${color}`, borderRadius: 4, padding: '14px 16px' }}>
                <p style={{ fontFamily: 'var(--be-font-display)', fontSize: '1rem', color, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {alt.name}
                </p>
                <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.8)', fontSize: '0.8rem', margin: '0 0 8px' }}>
                  {[alt.race, alt.class.charAt(0) + alt.class.slice(1).toLowerCase(), `L${alt.level}`].filter(Boolean).join(' · ')}
                </p>
                {alt.rank_name && (
                  <span className="be-rank-pill" style={{ fontSize: '0.6rem', padding: '2px 8px' }}>{alt.rank_name}</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Alt button */}
      <div style={{ padding: alts.length === 0 ? '0 40px 32px' : '0 40px 32px' }}>
        {alts.length === 0 && (
          <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.6)', fontSize: '0.9rem', textAlign: 'center', marginBottom: 20 }}>
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

      {/* Modal */}
      {modalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(10,8,5,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div style={{ width: '100%', maxWidth: 500, backgroundColor: 'rgba(16,11,4,0.97)', border: '1px solid rgba(201,150,26,0.3)', borderRadius: 12, padding: '32px 32px 28px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Close */}
            <button
              onClick={closeModal}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--be-iron-2)', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}
              aria-label="Close"
            >
              ×
            </button>

            {error && (
              <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(165,30,30,0.3)', border: '1px solid rgba(200,60,60,0.4)', borderRadius: 4, color: '#f87171', fontSize: 14 }}>
                {error}
              </div>
            )}

            {/* ── SEARCH ── */}
            {step === 'search' && (
              <div>
                <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: 20, color: 'var(--be-ink)', margin: '0 0 6px' }}>Search for an Alt</h2>
                <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 14, marginBottom: 20 }}>
                  Search unclaimed roster characters
                </p>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--be-iron-2)', pointerEvents: 'none', fontSize: 16, zIndex: 1 }}>⌕</span>
                  <input
                    type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type alt's name…" autoFocus
                    style={{ width: '100%', padding: '12px 12px 12px 36px', backgroundColor: 'var(--be-bg-1)', border: '1px solid var(--be-iron-3)', borderRadius: results.length > 0 ? 'var(--be-radius) var(--be-radius) 0 0' : 'var(--be-radius)', color: 'var(--be-ink)', fontFamily: 'var(--be-font-body)', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={(e) => { setFocused(true); (e.target as HTMLInputElement).style.borderColor = 'var(--be-gold)' }}
                    onBlur={(e) => { setFocused(false); (e.target as HTMLInputElement).style.borderColor = 'var(--be-iron-3)' }}
                  />
                  {results.length > 0 && (
                    <div onMouseDown={(e) => e.preventDefault()} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, backgroundColor: 'var(--be-bg-0)', border: '1px solid var(--be-gold)', borderTop: 'none', borderRadius: '0 0 var(--be-radius) var(--be-radius)', overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
                      {results.map((char) => {
                        const color = CLASS_COLORS[char.class] ?? '#888'
                        return (
                          <button key={char.id} onClick={() => { setCandidate(char); setStep('confirm') }}
                            className="w-full text-left flex items-center gap-3 relative overflow-hidden"
                            style={{ padding: '12px 16px', minHeight: 48, background: 'transparent', cursor: 'pointer', borderBottom: '1px solid rgba(61,46,21,0.4)', width: '100%' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,150,26,0.1)' }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                          >
                            <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: color }} />
                            <span style={{ marginLeft: 8, fontFamily: 'var(--be-font-display)', fontSize: '1rem', color: 'var(--be-gold)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{char.name}</span>
                            <span style={{ fontFamily: 'var(--be-font-display)', fontSize: '0.85rem', color: 'var(--be-iron-2)', flexShrink: 0 }}>L{char.level}</span>
                            <span style={{ fontFamily: 'var(--be-font-body)', fontSize: '0.85rem', fontWeight: 'bold', color, flexShrink: 0 }}>{char.class.charAt(0) + char.class.slice(1).toLowerCase().replace('_', ' ')}</span>
                            {char.rank_name && <span style={{ fontSize: '0.75rem', color: 'var(--be-gold-2)', fontFamily: 'var(--be-font-display)', flexShrink: 0 }}>{char.rank_name}</span>}
                          </button>
                        )
                      })}
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
              </div>
            )}

            {/* ── CONFIRM ── */}
            {step === 'confirm' && candidate && (
              <div>
                <button onClick={() => { setCandidate(null); setStep('search') }} style={{ background: 'none', border: 'none', color: 'var(--be-gold-2)', fontFamily: 'var(--be-font-display)', fontSize: '0.72rem', letterSpacing: '0.1em', cursor: 'pointer', padding: '0 0 16px', display: 'block' }}>← Search again</button>
                <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: 20, color: 'var(--be-ink)', margin: '0 0 16px' }}>Add this alt?</h2>
                <div style={{ background: 'linear-gradient(135deg, var(--be-bg-1) 0%, var(--be-bg-2) 100%)', border: '1px solid var(--be-iron-3)', borderLeft: `4px solid ${CLASS_COLORS[candidate.class] ?? '#888'}`, borderRadius: 'var(--be-radius)', padding: 20, marginBottom: 20 }}>
                  <p style={{ fontFamily: 'var(--be-font-display)', fontSize: 10, letterSpacing: '0.15em', color: CLASS_COLORS[candidate.class] ?? '#888', marginBottom: 4 }}>{candidate.class}</p>
                  <h3 style={{ fontFamily: 'var(--be-font-display)', fontSize: 36, color: 'var(--be-ink)', margin: '0 0 4px', lineHeight: 1 }}>{candidate.name}</h3>
                  <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 14, margin: 0 }}>
                    Level {candidate.level}{candidate.race ? ` · ${candidate.race}` : ''}{candidate.rank_name ? ` · ${candidate.rank_name}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setCandidate(null); setStep('search') }} style={{ flex: 1, padding: '11px 0', backgroundColor: 'transparent', border: '1px solid var(--be-iron-3)', borderRadius: 'var(--be-radius)', color: 'var(--be-iron-2)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: 'pointer' }}>← Not this one</button>
                  <button onClick={() => handleClaimRosterAlt(candidate)} disabled={loading} style={{ flex: 2, padding: '11px 0', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                    {loading ? 'Adding…' : `Yes, add ${candidate.name}`}
                  </button>
                </div>
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
                    <input type="text" autoComplete="off" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      style={{ width: '100%', padding: '11px 14px', background: 'rgba(20,14,4,0.9)', border: `1px solid ${errors.name ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)'}`, color: '#f0e6c8', fontFamily: 'var(--be-font-body)', fontSize: '0.95rem', borderRadius: 4, outline: 'none', boxSizing: 'border-box' }}
                      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
                      onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = errors.name ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)' }}
                    />
                    {errors.name && <p style={errorStyle}>{errors.name}</p>}
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
                  <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 14, margin: 0 }}>
                    Level {form.level} · {form.race} · Fresh Recruit
                  </p>
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
