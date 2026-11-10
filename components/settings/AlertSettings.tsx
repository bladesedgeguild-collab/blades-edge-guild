'use client'

import { useState } from 'react'
import { displayClassName, effectiveRoles, type LfgRole } from '@/lib/roles'
import { fullName } from '@/lib/names'

export type AlertCharacter = {
  id: string
  name: string
  last_name: string | null
  class: string
  level: number
  isMain: boolean
  roles: string[] | null
}

export function AlertSettings({
  characters,
  discordLinked,
  initialBanner,
  initialDiscord,
  initialMatchIds,
}: {
  characters: AlertCharacter[]
  discordLinked: boolean
  initialBanner: boolean
  initialDiscord: boolean
  initialMatchIds: string[] | null
}) {
  const [siteBanner, setSiteBanner] = useState(initialBanner)
  const [discordMentions, setDiscordMentions] = useState(discordLinked && initialDiscord)
  const [matched, setMatched] = useState<string[]>(
    initialMatchIds ?? characters.map(character => character.id),
  )
  const [roles, setRoles] = useState<Record<string, LfgRole[]>>(() => {
    const next: Record<string, LfgRole[]> = {}
    for (const character of characters) next[character.id] = effectiveRoles(character.class, character.roles)
    return next
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function toggleMatch(id: string) {
    setMatched(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  }

  function toggleRole(id: string, role: LfgRole, allowed: LfgRole[]) {
    setRoles(prev => {
      const current = prev[id] ?? allowed
      const next = current.includes(role) ? current.filter(item => item !== role) : [...current, role]
      return { ...prev, [id]: next.length > 0 ? next : current }
    })
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/settings/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteBanner,
          discordMentions,
          matchCharacterIds: matched,
          characters: characters.map(character => ({ id: character.id, roles: roles[character.id] ?? [] })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      setMessage(res.ok ? 'Alert settings saved.' : (data.error ?? 'Could not save.'))
    } catch {
      setMessage('Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="settings-section">
      <h2 className="settings-heading">LFG Alerts</h2>
      <p style={{ fontFamily: "'Spectral', serif", color: 'rgba(138,122,90,0.9)', marginTop: 0 }}>
        The banner and Discord mentions use your claimed main and alts. A character matches when its level is in the dungeon&apos;s green range and it can fill an open role.
      </p>
      <label className="settings-row">
        <span className="settings-label">Site banner</span>
        <input type="checkbox" checked={siteBanner} onChange={event => setSiteBanner(event.target.checked)} />
      </label>
      <label className="settings-row">
        <span className="settings-label">Discord mentions</span>
        {discordLinked ? (
          <input type="checkbox" checked={discordMentions} onChange={event => setDiscordMentions(event.target.checked)} />
        ) : (
          <span className="settings-hint">Connect Discord above to allow @mentions.</span>
        )}
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
        {characters.length === 0 && (
          <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.7)' }}>
            Claim a character to choose who gets matched.
          </p>
        )}
        {characters.map(character => {
          const allowed = effectiveRoles(character.class, null)
          const picked = roles[character.id] ?? allowed
          return (
            <div key={character.id} style={{ border: '1px solid rgba(61,46,21,0.5)', borderRadius: 6, padding: '0.8rem 1rem' }}>
              <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <input type="checkbox" checked={matched.includes(character.id)} onChange={() => toggleMatch(character.id)} />
                <span style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}>
                  {character.isMain ? '★ ' : ''}{fullName(character.name, character.last_name)}
                </span>
                <span className="settings-hint">
                  {displayClassName(character.class)} · lvl {character.level}
                </span>
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.45rem' }}>
                {allowed.map(role => (
                  <label key={role} style={{ fontFamily: "'Spectral', serif", color: '#f0e6c8', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={picked.includes(role)}
                      onChange={() => toggleRole(character.id, role, allowed)}
                    />{' '}
                    {role}
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button className="settings-btn-secondary" type="button" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save alert settings'}
        </button>
        {message && <span className="settings-hint">{message}</span>}
      </div>
    </section>
  )
}
