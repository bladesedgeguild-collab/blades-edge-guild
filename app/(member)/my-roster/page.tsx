import type { CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AddAltSection } from './AddAltSection'

const CLASS_COLORS: Record<string, string> = {
  MAGE: '#3fc7eb', PALADIN: '#f48cba', WARRIOR: '#c69b3a',
  PRIEST: '#ffffff', DRUID: '#ff7c0a', HUNTER: '#aad372',
  ROGUE: '#fff468', WARLOCK: '#8788ee', SHAMAN: '#0070dd',
  DEATH_KNIGHT: '#c41e3a', MONK: '#00ff98', DEMON_HUNTER: '#a330c9',
}

type MainChar = {
  id: string; name: string; class: string; race: string | null; level: number
  rank_name: string | null; rank_index: number | null; status: string | null; joined_guild_at: string | null
  professions: { name: string; skill_level: number; is_primary: boolean }[]
}

type AltChar = { id: string; name: string; class: string; race: string | null; level: number; rank_name: string | null }

const tile: CSSProperties = { background: 'rgba(26,18,8,0.6)', border: '1px solid rgba(61,46,21,0.5)', borderRadius: 4 }
const eyebrow: CSSProperties = { fontFamily: 'var(--be-font-display)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,150,26,0.85)', margin: 0 }
const fieldLabel: CSSProperties = { fontFamily: 'var(--be-font-display)', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(138,122,90,0.6)', margin: '0 0 4px' }
const fieldValue: CSSProperties = { fontFamily: "'Spectral', serif", fontSize: '0.9rem', color: '#c4b490', margin: 0 }

function statusBadge(s: string | null): { label: string; color: string } {
  if (s === 'returned') return { label: 'RETURNED', color: '#4ade80' }
  if (s === 'new') return { label: 'NEW RECRUIT', color: '#c9961a' }
  return { label: 'MIA', color: 'rgba(138,122,90,0.6)' }
}

export default async function MyRosterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileRaw } = await supabase
    .from('users')
    .select('display_name, claimed_character_id')
    .eq('id', user?.id ?? '')
    .single()

  const profile = profileRaw as { display_name: string | null; claimed_character_id: string | null } | null

  let mainChar: MainChar | null = null
  let alts: AltChar[] = []

  if (profile?.claimed_character_id) {
    const { data: charData } = await supabase
      .from('characters')
      .select('id, name, class, race, level, rank_name, rank_index, status, joined_guild_at, professions(name, skill_level, is_primary)')
      .eq('id', profile.claimed_character_id)
      .single()
    mainChar = charData as unknown as MainChar

    const { data: altData } = await supabase
      .from('characters')
      .select('id, name, class, race, level, rank_name')
      .eq('claimed_by', user?.id ?? '')
      .neq('id', profile.claimed_character_id)
      .order('name', { ascending: true })
    alts = (altData ?? []) as unknown as AltChar[]
  }

  if (!mainChar) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ fontFamily: 'var(--be-font-display)', color: 'rgba(138,122,90,0.7)', fontSize: '1rem', marginBottom: 24 }}>
          No character claimed yet.
        </p>
        <Link href="/onboarding" style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: '#c9961a', color: '#0d0b07', borderRadius: 4, fontFamily: 'var(--be-font-display)', fontSize: '0.85rem', letterSpacing: '0.08em', textDecoration: 'none' }}>
          Claim your character
        </Link>
      </div>
    )
  }

  const charColor = CLASS_COLORS[mainChar.class] ?? '#c9961a'
  const primaryProfs = mainChar.professions.filter((p) => p.is_primary)
  const status = statusBadge(mainChar.status)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Hero header ── */}
      <div style={{ ...tile, padding: '36px 40px 28px', borderBottom: '2px solid rgba(201,150,26,0.25)' }}>
        <p style={{ fontFamily: 'var(--be-font-display)', fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(201,150,26,0.6)', margin: '0 0 12px' }}>
          Your Main
        </p>
        <h1 className="character-name" style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: charColor, lineHeight: 1.05, margin: '0 0 10px' }}>
          {mainChar.name}
        </h1>
        <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.8)', fontSize: '1rem', margin: '0 0 18px' }}>
          {[mainChar.race, mainChar.class.charAt(0) + mainChar.class.slice(1).toLowerCase(), `Level ${mainChar.level}`].filter(Boolean).join(' · ')}
        </p>
        {mainChar.rank_name && <div className="be-rank-pill">{mainChar.rank_name}</div>}
      </div>

      {/* ── Vitals ── */}
      <div style={{ ...tile, padding: '24px 40px' }}>
        <p style={{ ...eyebrow, marginBottom: 20 }}>Character Vitals</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px 32px' }}>
          <div>
            <p style={fieldLabel}>Professions</p>
            {primaryProfs.length > 0 ? (
              primaryProfs.map((p) => (
                <p key={p.name} style={fieldValue}>
                  {p.name} <span style={{ color: 'rgba(138,122,90,0.6)' }}>({p.skill_level})</span>
                </p>
              ))
            ) : (
              <p style={{ ...fieldValue, fontStyle: 'italic', color: 'rgba(138,122,90,0.5)' }}>To Be Determined</p>
            )}
          </div>
          <div>
            <p style={fieldLabel}>Member Since</p>
            <p style={fieldValue}>
              {mainChar.joined_guild_at
                ? new Date(mainChar.joined_guild_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
          <div>
            <p style={fieldLabel}>Status</p>
            <span style={{ display: 'inline-block', padding: '2px 10px', border: `1px solid ${status.color}55`, borderRadius: 2, fontSize: 10, color: status.color, fontFamily: 'var(--be-font-display)', letterSpacing: '0.1em' }}>
              {status.label}
            </span>
          </div>
          <div>
            <p style={fieldLabel}>Realm</p>
            <p style={fieldValue}>Dreamscythe</p>
          </div>
        </div>
      </div>

      {/* ── Alts ── */}
      <div style={tile}>
        <div style={{ padding: '24px 40px 20px' }}>
          <p style={eyebrow}>Your Alts</p>
        </div>
        <AddAltSection alts={alts} mainCharId={mainChar.id} />
      </div>

    </div>
  )
}
