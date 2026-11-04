'use client'

import { useState } from 'react'
import { RACE_CLASSES } from '@/lib/guild-config'
import { RosterFinder, type RosterPick } from '@/components/RosterFinder'

const CLASS_COLORS: Record<string, string> = {
  MAGE: '#3fc7eb', PALADIN: '#f48cba', WARRIOR: '#c69b3a',
  PRIEST: '#ffffff', DRUID: '#ff7c0a', HUNTER: '#aad372',
  ROGUE: '#fff468', WARLOCK: '#8788ee', SHAMAN: '#0070dd',
  DEATH_KNIGHT: '#c41e3a', MONK: '#00ff98', DEMON_HUNTER: '#a330c9',
}

type CharForm   = { name: string; lastName: string; race: string; cls: string; level: string }
type CharErrors = { name?: string; lastName?: string; race?: string; cls?: string; level?: string }

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
  const lastNameError = validateWowName(form.lastName.trim())
  if (lastNameError) errs.lastName = lastNameError
  if (!form.race) errs.race = 'Please select a race.'
  if (!form.cls) errs.cls = 'Please select a class.'
  const lvl = parseInt(form.level)
  if (!form.level.trim() || isNaN(lvl) || lvl < 1 || lvl > 60) errs.level = 'Please enter a level between 1 and 60'
  return errs
}

export function AddAltModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [form, setForm] = useState<CharForm>({ name: '', lastName: '', race: '', cls: '', level: '' })
  const [errors, setErrors] = useState<CharErrors>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    onClose()
  }

  async function handleCreateAlt() {
    setLoading(true); setError(null)
    const res = await fetch('/api/characters/claim-alt', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name.trim(), last_name: form.lastName.trim(), race: form.race, class: form.cls, level: parseInt(form.level) }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.detail ? `${data.error}: ${data.detail}` : (data.error ?? 'Failed to create alt')); return }
    onSuccess()
  }

  async function handleClaimFromRoster(pick: RosterPick) {
    setLoading(true); setError(null)
    const res = await fetch('/api/characters/claim-existing', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character_id: pick.id, as: 'alt' }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Could not claim that character'); return }
    onSuccess()
  }

  const newFormClassColor = CLASS_COLORS[form.cls.toUpperCase()] ?? '#888'
  const availableClasses = form.race ? (RACE_CLASSES[form.race] ?? []) : []
  const inlineNameError = form.name.length >= 1 ? validateWowName(form.name) : null
  const shownNameError = inlineNameError ?? errors.name
  const nameHasError = !!shownNameError
  const inlineLastNameError = form.lastName.length >= 1 ? validateWowName(form.lastName) : null
  const shownLastNameError = inlineLastNameError ?? errors.lastName
  const lastNameHasError = !!shownLastNameError

  return (
    <div
      className="alt-search-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="alt-search-modal">
        <button
          onClick={handleClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--be-iron-2)', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}
          aria-label="Close"
        >×</button>

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(165,30,30,0.3)', border: '1px solid rgba(200,60,60,0.4)', borderRadius: 4, color: '#f87171', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* ── FORM ── */}
        {step === 'form' && (
          <div>
            <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: 20, color: 'var(--be-ink)', margin: '0 0 20px' }}>Add an Alt</h2>
            <RosterFinder disabled={loading} pickLabel="Add as alt" onPick={handleClaimFromRoster} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input type="text" autoComplete="off" value={form.name} maxLength={12}
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
                  <span style={{ fontFamily: 'var(--be-font-body)', fontSize: '0.72rem', color: form.name.length >= 12 ? 'var(--be-gold)' : 'rgba(138,122,90,0.5)', flexShrink: 0, marginLeft: 8 }}>{form.name.length} / 12</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input type="text" autoComplete="off" value={form.lastName} maxLength={12}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(20,14,4,0.9)', border: `1px solid ${lastNameHasError ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)'}`, color: '#f0e6c8', fontFamily: 'var(--be-font-body)', fontSize: '0.95rem', borderRadius: 4, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
                  onBlur={(e) => {
                    if (form.lastName.length > 0) {
                      const cap = form.lastName.replace(/^[a-z]/, (c) => c.toUpperCase())
                      if (cap !== form.lastName) setForm({ ...form, lastName: cap })
                    }
                    ;(e.target as HTMLInputElement).style.borderColor = lastNameHasError ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 }}>
                  <span style={{ flex: 1 }}>{shownLastNameError && <span style={errorStyle}>{shownLastNameError}</span>}</span>
                  <span style={{ fontFamily: 'var(--be-font-body)', fontSize: '0.72rem', color: form.lastName.length >= 12 ? 'var(--be-gold)' : 'rgba(138,122,90,0.5)', flexShrink: 0, marginLeft: 8 }}>{form.lastName.length} / 12</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Race</label>
                <select value={form.race} onChange={(e) => setForm({ ...form, race: e.target.value, cls: '' })}
                  style={{ ...selectStyle, borderColor: errors.race ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)' }}
                  onFocus={(e) => { (e.target as HTMLSelectElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
                  onBlur={(e) => { (e.target as HTMLSelectElement).style.borderColor = errors.race ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)' }}
                >
                  <option value="">Select race...</option>
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
                  <option value="">{form.race ? 'Select class...' : 'Select race first...'}</option>
                  {availableClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.cls && <p style={errorStyle}>{errors.cls}</p>}
              </div>
              <div>
                <label style={labelStyle}>Level</label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g. 12"
                  value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value.replace(/[^0-9]/g, '') })}
                  style={{ width: '100%', padding: '11px 14px', background: 'rgba(20,14,4,0.9)', border: `1px solid ${errors.level ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)'}`, color: '#f0e6c8', fontFamily: 'var(--be-font-body)', fontSize: '0.95rem', borderRadius: 4, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(201,150,26,0.7)' }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = errors.level ? 'rgba(255,107,107,0.6)' : 'rgba(61,46,21,0.6)' }}
                />
                {errors.level && <p style={errorStyle}>{errors.level}</p>}
              </div>
              <button
                onClick={() => { const e = validateForm(form); setErrors(e); if (Object.keys(e).length === 0) setStep('confirm') }}
                style={{ width: '100%', padding: '13px 0', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: '0.88rem', letterSpacing: '0.08em', cursor: 'pointer', marginTop: 4 }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── CONFIRM ── */}
        {step === 'confirm' && (
          <div>
            <button onClick={() => setStep('form')} style={{ background: 'none', border: 'none', color: 'var(--be-gold-2)', fontFamily: 'var(--be-font-display)', fontSize: '0.72rem', letterSpacing: '0.1em', cursor: 'pointer', padding: '0 0 16px', display: 'block' }}>← Make Edits</button>
            <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: 20, color: 'var(--be-ink)', margin: '0 0 16px' }}>Add this alt?</h2>
            <div style={{ background: 'linear-gradient(135deg, var(--be-bg-1) 0%, var(--be-bg-2) 100%)', border: '1px solid var(--be-iron-3)', borderLeft: `4px solid ${newFormClassColor}`, borderRadius: 'var(--be-radius)', padding: 20, marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--be-font-display)', fontSize: 10, letterSpacing: '0.15em', color: newFormClassColor, marginBottom: 4 }}>{form.cls.toUpperCase()}</p>
              <h3 style={{ fontFamily: 'var(--be-font-display)', fontSize: 36, color: 'var(--be-ink)', margin: '0 0 4px', lineHeight: 1, textTransform: 'none', fontVariant: 'normal', fontVariantCaps: 'normal', fontVariantLigatures: 'none', WebkitFontFeatureSettings: '"case" 0', fontFeatureSettings: '"case" 0' }}>
                {form.name} <span style={{ color: 'var(--be-ink-3)', fontSize: '0.6em' }}>{form.lastName}</span>
              </h3>
              <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'var(--be-ink-3)', fontSize: 14, margin: 0 }}>Level {form.level} · {form.race} · Fresh Recruit</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('form')} style={{ flex: 1, padding: '11px 0', backgroundColor: 'transparent', border: '1px solid var(--be-iron-3)', borderRadius: 'var(--be-radius)', color: 'var(--be-iron-2)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: 'pointer' }}>← Make Edits</button>
              <button onClick={handleCreateAlt} disabled={loading} style={{ flex: 2, padding: '11px 0', backgroundColor: 'var(--be-gold)', color: '#0d0b07', border: 'none', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
                {loading ? 'Adding…' : `Yes, add ${form.name}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
