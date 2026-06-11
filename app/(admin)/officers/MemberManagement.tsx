'use client'

import { useCallback, useEffect, useState } from 'react'
import { CLASS_COLORS, CharacterClass } from '@/types'

type Claim = {
  id: string
  name: string
  class: string
  claimed_at: string | null
  claimer: { id: string; display_name: string | null; role: string } | null
}

type Member = {
  id: string
  display_name: string | null
  discord_username: string | null
  role: string
  created_at: string
  main_char: { id: string; name: string; class: string } | null
  alts_count: number
}

type PendingUser = {
  id: string
  display_name: string | null
  discord_username: string | null
  created_at: string
}

type MemberData = {
  claims: Claim[]
  members: Member[]
  pending: PendingUser[]
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#1a1208',
  border: '1px solid #3d2e15',
  borderRadius: 12,
  overflow: 'hidden',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 14px',
  fontFamily: "'Cinzel', serif",
  color: '#8a7a5a',
  fontSize: '0.72rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  backgroundColor: '#0d0b07',
}

const tdStyle: React.CSSProperties = {
  padding: '9px 14px',
  borderTop: '1px solid #2a1e0e',
  verticalAlign: 'middle',
}

const subHeading: React.CSSProperties = {
  fontFamily: "'Cinzel', serif",
  color: '#c9961a',
  fontSize: '0.8rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  marginBottom: '0.6rem',
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#c9961a',
  gm: '#c9961a',
  officer: '#b07d3a',
  member: '#5a4a2a',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 7px',
        borderRadius: 4,
        fontSize: '0.7rem',
        fontFamily: "'Cinzel', serif",
        border: `1px solid ${ROLE_COLORS[role] ?? '#3d2e15'}`,
        color: ROLE_COLORS[role] ?? '#8a7a5a',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {role}
    </span>
  )
}

function SmallBtn({
  onClick,
  loading,
  danger,
  children,
}: {
  onClick: () => void
  loading?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '3px 10px',
        fontSize: '0.72rem',
        fontFamily: "'Cinzel', serif",
        borderRadius: 4,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.5 : 1,
        border: danger ? '1px solid #ef4444' : '1px solid #c9961a',
        color: danger ? '#ef4444' : '#c9961a',
        background: 'transparent',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {loading ? '…' : children}
    </button>
  )
}

export function MemberManagement() {
  const [data, setData] = useState<MemberData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/officers/member-data')
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to load')
        return
      }
      setData(await res.json())
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function setBusy(id: string, busy: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev)
      busy ? next.add(id) : next.delete(id)
      return next
    })
  }

  async function releaseClaim(characterId: string, charName: string) {
    if (!confirm(`Release claim on ${charName}? Character will return to MIA status.`)) return
    setBusy(characterId, true)
    try {
      await fetch('/api/officers/release-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character_id: characterId }),
      })
      await load()
    } finally {
      setBusy(characterId, false)
    }
  }

  async function resetUser(userId: string, name: string) {
    if (!confirm(`Reset onboarding for ${name}? This clears their character claim and forces re-onboarding.`)) return
    setBusy(userId, true)
    try {
      await fetch('/api/officers/reset-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      await load()
    } finally {
      setBusy(userId, false)
    }
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`DELETE account for ${name}? This cannot be undone.`)) return
    setBusy(userId, true)
    try {
      await fetch('/api/officers/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      await load()
    } finally {
      setBusy(userId, false)
    }
  }

  if (loading) {
    return (
      <p style={{ fontFamily: "'Spectral', serif", color: '#8a7a5a', fontSize: '0.9rem', fontStyle: 'italic' }}>
        Loading member data…
      </p>
    )
  }

  if (error) {
    return (
      <p style={{ fontFamily: "'Spectral', serif", color: '#f87171', fontSize: '0.9rem' }}>
        {error}
      </p>
    )
  }

  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── Section A: Character Claims ── */}
      <div>
        <p style={subHeading}>
          Character Claims
          <span style={{ fontFamily: "'Spectral', serif", color: '#8a7a5a', fontSize: '0.8rem', fontWeight: 400, marginLeft: 8, letterSpacing: 0, textTransform: 'none' }}>
            ({data.claims.length})
          </span>
        </p>

        {data.claims.length === 0 ? (
          <p style={{ fontFamily: "'Spectral', serif", color: '#8a7a5a', fontSize: '0.85rem', fontStyle: 'italic' }}>
            No characters claimed yet.
          </p>
        ) : (
          <div style={cardStyle}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Character</th>
                    <th style={thStyle}>Claimed By</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Claimed</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {data.claims.map((claim) => {
                    const classColor = CLASS_COLORS[claim.class as CharacterClass] ?? '#c9961a'
                    return (
                      <tr key={claim.id}>
                        <td style={tdStyle}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: classColor, flexShrink: 0, display: 'inline-block' }} />
                            <span style={{ fontFamily: "'Cinzel', serif", color: classColor, fontSize: '0.82rem' }}>
                              {claim.name}
                            </span>
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: "'Spectral', serif", color: '#f0e6c8' }}>
                          {claim.claimer?.display_name ?? '—'}
                        </td>
                        <td style={tdStyle}>
                          {claim.claimer ? <RoleBadge role={claim.claimer.role} /> : '—'}
                        </td>
                        <td style={{ ...tdStyle, fontFamily: "'Spectral', serif", color: '#8a7a5a', fontSize: '0.78rem' }}>
                          {claim.claimed_at ? new Date(claim.claimed_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <SmallBtn
                            onClick={() => releaseClaim(claim.id, claim.name)}
                            loading={busyIds.has(claim.id)}
                          >
                            Release Claim
                          </SmallBtn>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Section B: All Registered Members ── */}
      <div>
        <p style={subHeading}>
          Registered Members
          <span style={{ fontFamily: "'Spectral', serif", color: '#8a7a5a', fontSize: '0.8rem', fontWeight: 400, marginLeft: 8, letterSpacing: 0, textTransform: 'none' }}>
            ({data.members.length})
          </span>
        </p>

        {data.members.length === 0 ? (
          <p style={{ fontFamily: "'Spectral', serif", color: '#8a7a5a', fontSize: '0.85rem', fontStyle: 'italic' }}>
            No registered members yet.
          </p>
        ) : (
          <div style={cardStyle}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Member</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Main Character</th>
                    <th style={thStyle}>Alts</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {data.members.map((m) => {
                    const mainClassColor = m.main_char
                      ? (CLASS_COLORS[m.main_char.class as CharacterClass] ?? '#c9961a')
                      : '#8a7a5a'
                    return (
                      <tr key={m.id}>
                        <td style={{ ...tdStyle, fontFamily: "'Cinzel', serif", color: '#f0e6c8', fontSize: '0.82rem' }}>
                          {m.display_name ?? m.discord_username ?? m.id.slice(0, 8)}
                        </td>
                        <td style={tdStyle}>
                          <RoleBadge role={m.role} />
                        </td>
                        <td style={tdStyle}>
                          {m.main_char ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: mainClassColor, flexShrink: 0, display: 'inline-block' }} />
                              <span style={{ fontFamily: "'Cinzel', serif", color: mainClassColor, fontSize: '0.78rem' }}>
                                {m.main_char.name}
                              </span>
                            </span>
                          ) : (
                            <span style={{ color: '#5a4a2a', fontFamily: "'Spectral', serif", fontSize: '0.78rem', fontStyle: 'italic' }}>none</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, fontFamily: "'Spectral', serif", color: '#8a7a5a', fontSize: '0.8rem' }}>
                          {m.alts_count > 0 ? m.alts_count : '—'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <SmallBtn
                            onClick={() => resetUser(m.id, m.display_name ?? m.discord_username ?? 'this user')}
                            loading={busyIds.has(m.id)}
                          >
                            Reset Onboarding
                          </SmallBtn>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Section C: Pending / Stuck Users ── */}
      <div>
        <p style={subHeading}>
          Pending / Stuck
          <span style={{ fontFamily: "'Spectral', serif", color: '#8a7a5a', fontSize: '0.8rem', fontWeight: 400, marginLeft: 8, letterSpacing: 0, textTransform: 'none' }}>
            ({data.pending.length})
          </span>
        </p>

        {data.pending.length === 0 ? (
          <p style={{ fontFamily: "'Spectral', serif", color: '#8a7a5a', fontSize: '0.85rem', fontStyle: 'italic' }}>
            No stuck users.
          </p>
        ) : (
          <div style={cardStyle}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Signed Up</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {data.pending.map((u) => (
                    <tr key={u.id}>
                      <td style={{ ...tdStyle, fontFamily: "'Spectral', serif", color: '#f0e6c8' }}>
                        {u.display_name ?? u.discord_username ?? u.id.slice(0, 8)}
                      </td>
                      <td style={{ ...tdStyle, fontFamily: "'Spectral', serif", color: '#8a7a5a', fontSize: '0.78rem' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <SmallBtn
                          danger
                          onClick={() => deleteUser(u.id, u.display_name ?? u.discord_username ?? 'this user')}
                          loading={busyIds.has(u.id)}
                        >
                          Delete Account
                        </SmallBtn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
