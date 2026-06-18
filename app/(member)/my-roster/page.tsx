import type { CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getCharacterArt } from '@/lib/character-art'
import { AddAltSection } from './AddAltSection'
import ActiveLFGCalls from '@/components/ActiveLFGCalls'
import LFGMiniBox from '@/components/LFGMiniBox'

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

type AltChar = {
  id: string; name: string; class: string; race: string | null; level: number; rank_name: string | null
  professions: { name: string; skill_level: number; is_primary: boolean }[]
}

const tile: CSSProperties = { background: 'rgba(26,18,8,0.6)', border: '1px solid rgba(61,46,21,0.5)', borderRadius: 4 }

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
      .select('id, name, class, race, level, rank_name, professions(name, skill_level, is_primary)')
      .eq('claimed_by', user?.id ?? '')
      .neq('id', profile.claimed_character_id)
      .order('level', { ascending: false })
    alts = (altData ?? []) as unknown as AltChar[]
  }

  if (!mainChar) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: 80, paddingBottom: 80 }}>
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
  const art = getCharacterArt(mainChar.race, mainChar.class)
  const primaryProfs = mainChar.professions.filter((p) => p.is_primary)

  const classLabel = mainChar.class.charAt(0) + mainChar.class.slice(1).toLowerCase().replace('_', ' ')

  const vitalsRows: { label: string; value: string | null; pill?: boolean; classDot?: boolean; professions?: boolean }[] = [
    { label: 'Race',        value: mainChar.race ?? '—' },
    { label: 'Class',       value: classLabel,                                       classDot: true },
    { label: 'Level',       value: String(mainChar.level) },
    { label: 'Professions', value: primaryProfs.map((p) => `${p.skill_level} ${p.name}`).join('  ') || null, professions: true },
    { label: 'Guild Rank',  value: mainChar.rank_name,                               pill: true },
    { label: 'Joined',      value: mainChar.joined_guild_at ? new Date(mainChar.joined_guild_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
  ]

  const vLabel: CSSProperties = { fontFamily: 'var(--be-font-display)', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(138,122,90,0.55)', margin: 0, minWidth: '90px', maxWidth: '90px', flexShrink: 0 }
  const vValue: CSSProperties = { fontFamily: "'Spectral', serif", fontSize: '0.92rem', color: '#c4b490', margin: 0 }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: '1.75rem', paddingBottom: '1.75rem' }}>

      {/* ── Hero ── */}
      <div style={{ ...tile, position: 'relative', overflow: 'hidden', borderBottom: '2px solid rgba(201,150,26,0.18)', minHeight: 220, display: 'flex', alignItems: 'stretch' }}>

        {/* Left content */}
        <div style={{ flex: 1, padding: '32px 40px 28px', position: 'relative', zIndex: 2, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--be-font-display)', fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(201,150,26,0.5)', margin: '0 0 16px' }}>
            Your Main
          </p>

          {/* Name block */}
          <div style={{ marginBottom: 12 }}>
            <p className="roster-hero-class" style={{ fontFamily: 'var(--be-font-display)', fontSize: '1rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(138,122,90,0.6)', margin: '0 0 6px' }}>
              {mainChar.class}
            </p>
            <h1 className="character-name roster-hero-name" data-character-name style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 'clamp(2.2rem, 4vw, 4rem)', color: charColor, lineHeight: 1.05, margin: 0, textTransform: 'none', fontVariant: 'normal', fontVariantCaps: 'normal', fontVariantLigatures: 'none', WebkitFontFeatureSettings: '"case" 0', fontFeatureSettings: '"case" 0' }}>
              {mainChar.name}
            </h1>
          </div>

          <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.65)', fontSize: '1.1rem', margin: '0 0 6px' }}>
            {[mainChar.race, classLabel, `Level ${mainChar.level}`].filter(Boolean).join(' · ')}
          </p>
          <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.4)', fontSize: '0.82rem', margin: '0 0 18px' }}>
            {'<'}Blådes Edge{'>'}
          </p>
          {mainChar.rank_name && <div className="be-rank-pill">{mainChar.rank_name}</div>}
        </div>

        {/* Character art */}
        {art && (
          <div className="roster-hero-art">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art.female} className="roster-hero-fig" alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art.male}   className="roster-hero-fig" alt="" />
          </div>
        )}

        {/* Edit Profile button */}
        <Link href="/settings" className="roster-edit-btn">
          Edit Profile →
        </Link>
      </div>

      {/* ── LFG strip ── */}
      <LFGMiniBox title="Active Dungeon Calls" columns={5} maxRows={1} maxItems={5} className="roster-lfg-strip" />

      {/* ── Body row: Vitals + Alts ── */}
      <div className="roster-body">

        {/* ── Vitals ── */}
        <div className="vitals-tile" style={{ ...tile, padding: '24px 40px' }}>
          <p style={{ fontFamily: 'var(--be-font-display)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,150,26,0.85)', margin: '0 0 20px' }}>
            Character Vitals
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vitalsRows.map((row) => (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 16, paddingBottom: 10, borderBottom: '1px solid rgba(61,46,21,0.25)' }}>
                <span style={vLabel}>{row.label}</span>
                {row.pill && row.value ? (
                  <span className="be-rank-pill" style={{ justifySelf: 'start', fontSize: '0.6rem', padding: '2px 10px' }}>{row.value}</span>
                ) : row.classDot ? (
                  <span style={{ ...vValue, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: charColor, display: 'inline-block', flexShrink: 0 }} />
                    {row.value}
                  </span>
                ) : row.professions ? (
                  <span style={{ ...vValue, color: row.value ? '#c9961a' : 'rgba(138,122,90,0.5)', fontStyle: row.value ? 'normal' : 'italic' }}>
                    {row.value ?? 'Prof 1 TBD  Prof 2 TBD'}
                  </span>
                ) : (
                  <span style={vValue}>{row.value ?? '—'}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Alts (client component owns the tile) ── */}
        <AddAltSection alts={alts} mainCharId={mainChar.id} />

      </div>

      {/* ── Active Dungeon Calls ── */}
      <ActiveLFGCalls />

    </div>
  )
}
