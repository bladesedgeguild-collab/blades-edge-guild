import type { CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { CharacterClass } from '@/types'
import ActiveLFGCalls from '@/components/ActiveLFGCalls'
import LFGMiniBox from '@/components/LFGMiniBox'
import CampaignBanner from '@/components/CampaignBanner'
import GMCorner from '@/components/GMCorner'

type MainChar = {
  id: string
  name: string
  class: CharacterClass
  race: string | null
  level: number
  rank_name: string | null
  professions: { name: string; skill_level: number; is_primary: boolean }[]
}

type AltChar = { id: string; name: string; class: CharacterClass; level: number }

type FeedEntry = {
  key: string
  who: string
  what: string
  cls: string | null
  when: string | null
}

const CLASS_COLORS: Record<string, string> = {
  MAGE: '#3fc7eb', PALADIN: '#f48cba', WARRIOR: '#c69b3a', PRIEST: '#ffffff',
  DRUID: '#ff7c0a', HUNTER: '#aad372', ROGUE: '#fff468', WARLOCK: '#8788ee',
  SHAMAN: '#0070dd',
}

const tile: CSSProperties = {
  background: 'rgba(26,18,8,0.6)',
  border: '1px solid rgba(61,46,21,0.5)',
  borderRadius: 4,
}

const eyebrow: CSSProperties = {
  fontFamily: 'var(--be-font-display)',
  fontSize: '0.7rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(201,150,26,0.85)',
  margin: '0 0 12px',
}

const PLACEHOLDER_EVENTS = [
  { date: 'TUE', time: '20:00', name: 'Karazhan Progression', signups: 0, cap: 25 },
  { date: 'THU', time: '20:00', name: 'Dungeon Night',           signups: 0, cap: 10 },
  { date: 'SAT', time: '14:00', name: 'Guild Meeting',           signups: 0, cap: 50 },
  { date: 'SUN', time: '20:00', name: 'Heroic Runs',             signups: 0, cap: 5  },
]

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'GUILD CREATED'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (days >= 7) return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (days > 0)  return `${days} day${days !== 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  if (mins > 0)  return `${mins} minute${mins !== 1 ? 's' : ''} ago`
  return 'just now'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileRaw } = await supabase
    .from('users')
    .select('display_name, discord_username, role, has_completed_onboarding, claimed_character_id')
    .eq('id', user?.id ?? '')
    .single()

  const profile = profileRaw as {
    display_name: string | null
    discord_username: string | null
    role: string | null
    has_completed_onboarding: boolean | null
    claimed_character_id: string | null
  } | null

  let mainChar: MainChar | null = null
  let alts: AltChar[] = []

  if (profile?.claimed_character_id) {
    const { data: charData } = await supabase
      .from('characters')
      .select('id, name, class, race, level, rank_name, professions(name, skill_level, is_primary)')
      .eq('id', profile.claimed_character_id)
      .single()
    mainChar = charData as unknown as MainChar

    const { data: altData } = await supabase
      .from('characters')
      .select('id, name, class, level')
      .eq('claimed_by', user?.id ?? '')
      .neq('id', profile.claimed_character_id)
    alts = (altData ?? []) as unknown as AltChar[]
  }

  const { count: yourCharCount } = await supabase
    .from('characters')
    .select('*', { count: 'exact', head: true })
    .eq('claimed_by', user?.id ?? '')

  // Use service-role client to bypass RLS for the cross-user count
  const adminDb = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { count: guildieCount } = await adminDb
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('has_completed_onboarding', true)

  // Feed: service role bypasses RLS for cross-user read
  const { data: feedUsers } = await adminDb
    .from('users')
    .select('id, display_name, updated_at, claimed_character_id')
    .eq('has_completed_onboarding', true)
    .order('updated_at', { ascending: false })
    .limit(8)

  const charIds = ((feedUsers ?? []) as { claimed_character_id: string | null }[])
    .map(u => u.claimed_character_id)
    .filter((id): id is string => id !== null)

  const feedCharMap: Record<string, { class: string; status: string }> = {}
  if (charIds.length > 0) {
    const { data: feedCharData } = await adminDb
      .from('characters')
      .select('id, class, status')
      .in('id', charIds)
    for (const c of (feedCharData ?? []) as { id: string; class: string; status: string }[]) {
      feedCharMap[c.id] = { class: c.class, status: c.status }
    }
  }

  const feedEntries: FeedEntry[] = [
    ...((feedUsers ?? []) as { id: string; display_name: string | null; updated_at: string; claimed_character_id: string | null }[]).map(u => {
      const char = u.claimed_character_id ? feedCharMap[u.claimed_character_id] : null
      const status = char?.status ?? null
      const what = status === 'new'
        ? 'joined as a fresh recruit'
        : status === 'returned'
        ? 'answered the call and returned'
        : 'answered the call · character claimed'
      return { key: u.id, who: u.display_name ?? '???', what, cls: char?.class ?? null, when: u.updated_at }
    }),
    { key: 'guild-founded', who: 'Åvatarødys', what: 'founded Blådes Edge', cls: null, when: null },
  ]

  const charCount = yourCharCount ?? 0
  const displayName = profile?.display_name ?? 'Adventurer'

  return (
    <div className="be-hall-page page-container" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: '1.75rem', paddingBottom: '1.75rem' }}>

      {/* ── Header ── */}
      <div>
        <p style={{ fontFamily: 'var(--be-font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--be-gold)', textTransform: 'uppercase', margin: '0 0 6px' }}>
          Welcome Back
        </p>
        <h1 className="character-name hall-greeting-name" style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: '3rem', color: '#f0e6c8', lineHeight: 1, margin: '0 0 8px' }}>
          {displayName}
        </h1>
        {mainChar && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.8)', fontSize: '1rem', margin: 0 }}>
              {[mainChar.race, mainChar.class, `Level ${mainChar.level}`].filter(Boolean).join(' · ')}
            </p>
            {mainChar.rank_name && (
              <div className="be-rank-pill" style={{ whiteSpace: 'nowrap', marginLeft: 16 }}>
                {mainChar.rank_name}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Row 1: Campaign tile (2fr) + Stat tiles (1fr) ── */}
      <div className="hall-main-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>

        {/* Campaign banner */}
        <CampaignBanner />

        {/* Quick stats column */}
        <div className="hall-stats-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...tile, padding: 22 }}>
            <p style={eyebrow}>Your Characters</p>
            <p className="be-stat" style={{ margin: 0 }}>{charCount}</p>
            <p className="be-stat-label">1 main · {alts.length} alt{alts.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ ...tile, padding: 22 }}>
            <p style={eyebrow}>Guildies on the Site</p>
            <p className="be-stat" style={{ margin: 0 }}>{guildieCount ?? 0}</p>
            <p className="be-stat-label">members registered</p>
          </div>
        </div>
      </div>

      {/* ── Row 2: Full-width LFG (hidden when no posts) ── */}
      <LFGMiniBox title="Active Dungeon Calls" columns={4} maxRows={2} className="hall-lfg-full" />

      {/* ── Row 3: Hall Feed (1fr) + Upcoming (1fr) ── */}
      <div className="hall-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Hall Feed */}
        <div style={tile}>
          <div style={{ padding: '22px 22px 0' }}>
            <p style={eyebrow}>Hall Feed</p>
          </div>
          {feedEntries.map((entry) => {
            const color = entry.cls ? (CLASS_COLORS[entry.cls] ?? 'var(--be-gold)') : 'var(--be-gold)'
            const isPinned = entry.key === 'guild-founded'
            return (
              <div key={entry.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderTop: '1px solid rgba(61,46,21,0.4)', opacity: isPinned ? 0.65 : 1 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}33`, border: `1px solid ${color}99`, fontFamily: 'var(--be-font-display)', fontSize: '0.75rem', color }}>
                  {entry.who.slice(0, 1)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontFamily: "'Spectral', serif", fontSize: '0.9rem', color: '#f0e6c8', lineHeight: 1.3 }}>
                    <span style={{ fontFamily: 'var(--be-font-display)', color }}>{entry.who}</span>
                    <span style={{ color: 'rgba(138,122,90,0.8)', marginLeft: 5 }}>{entry.what}</span>
                  </p>
                </div>
                <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(138,122,90,0.6)', textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {relativeTime(entry.when)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Upcoming */}
        <div style={tile}>
          <div style={{ padding: '22px 22px 0' }}>
            <p style={eyebrow}>Upcoming</p>
          </div>
          {PLACEHOLDER_EVENTS.map((event, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 22px', borderTop: '1px solid rgba(61,46,21,0.4)' }}>
              <div style={{ textAlign: 'center', minWidth: 36, flexShrink: 0 }}>
                <p style={{ margin: 0, fontFamily: 'var(--be-font-display)', fontSize: '0.6rem', letterSpacing: '0.12em', color: 'rgba(138,122,90,0.8)', textTransform: 'uppercase' }}>
                  {event.date}
                </p>
                <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.75rem', color: '#f0e6c8' }}>
                  {event.time}
                </p>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 5px', fontFamily: 'var(--be-font-display)', fontSize: '0.85rem', color: '#f0e6c8' }}>
                  {event.name}
                </p>
                <div style={{ height: 2, backgroundColor: 'rgba(61,46,21,0.6)', borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(event.signups / event.cap) * 100}%`, backgroundColor: 'var(--be-gold)' }} />
                </div>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(138,122,90,0.8)', flexShrink: 0 }}>
                {event.signups}/{event.cap}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Active Dungeon Calls (full detail cards) ── */}
      <ActiveLFGCalls />

      <GMCorner quote="Thanks for coming to the guild website! I am currently working on it so let me know of issues!" />
    </div>
  )
}
