import type { CSSProperties } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CharacterClass } from '@/types'

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

type NotifRow = {
  id: string
  title: string
  body: string | null
  created_at: string
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
  color: 'rgba(138,122,90,0.8)',
  marginBottom: 12,
  margin: '0 0 12px',
}

const PLACEHOLDER_FEED = [
  { who: 'Åvatarødys', what: 'founded',          detail: 'Blådes Edge',      when: 'guild created' },
  { who: 'Darliouse',  what: 'answered the call', detail: 'character claimed', when: 'recently'      },
  { who: 'Dsix',       what: 'answered the call', detail: 'character claimed', when: 'recently'      },
  { who: 'Inthetrees', what: 'answered the call', detail: 'character claimed', when: 'recently'      },
]

const PLACEHOLDER_EVENTS = [
  { date: 'TUE', time: '20:00', name: 'Karazhan — Progression', signups: 0, cap: 25 },
  { date: 'THU', time: '20:00', name: 'Dungeon Night',           signups: 0, cap: 10 },
  { date: 'SAT', time: '14:00', name: 'Guild Meeting',           signups: 0, cap: 50 },
  { date: 'SUN', time: '20:00', name: 'Heroic Runs',             signups: 0, cap: 5  },
]

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'recently'
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

  const { count: claimedCount } = await supabase
    .from('characters')
    .select('id', { count: 'exact', head: true })
    .not('claimed_by', 'is', null)

  const { data: notifData } = await supabase
    .from('notifications')
    .select('id, title, body, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  const notifications: NotifRow[] = (notifData ?? []) as NotifRow[]
  const charCount = mainChar ? 1 + alts.length : 0
  const displayName = mainChar?.name ?? profile?.display_name ?? profile?.discord_username ?? 'Adventurer'

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p style={{ fontFamily: 'var(--be-font-display)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--be-gold)', textTransform: 'uppercase', margin: '0 0 6px' }}>
            Welcome Back
          </p>
          <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: '3rem', color: '#f0e6c8', lineHeight: 1, margin: '0 0 8px' }}>
            {displayName}
          </h1>
          {mainChar && (
            <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', color: 'rgba(138,122,90,0.8)', fontSize: '1rem', margin: 0 }}>
              {[mainChar.race, mainChar.class, `Level ${mainChar.level}`].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        {mainChar?.rank_name && (
          <div className="be-rank-pill" style={{ marginTop: 8, whiteSpace: 'nowrap' }}>
            {mainChar.rank_name}
          </div>
        )}
      </div>

      {/* ── Main grid: 2fr 1fr ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>

        {/* Campaign banner */}
        <div style={{
          ...tile,
          minHeight: 260,
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: `
            linear-gradient(95deg, rgba(10,8,5,0.95) 0%, rgba(10,8,5,0.78) 38%, rgba(10,8,5,0.35) 70%, rgba(10,8,5,0.15) 100%),
            url('/images/guild-photo.png')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          {/* ONLINE pill */}
          <div style={{
            position: 'absolute', top: 16, right: 16,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px',
            backgroundColor: 'rgba(10,8,5,0.75)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(61,46,21,0.5)',
            borderRadius: 2,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--be-font-display)', fontSize: '0.6rem', letterSpacing: '0.15em', color: '#4ade80' }}>ONLINE</span>
          </div>

          {/* Bottom-left content */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: '30%', padding: 24 }}>
            <p style={{ ...eyebrow, color: 'var(--be-portal)' }}>Current Campaign</p>
            <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: '1.5rem', color: '#f0e6c8', margin: '0 0 10px', lineHeight: 1.2 }}>
              The Dark Portal Holds
            </h2>
            <p style={{ fontFamily: "'Spectral', serif", fontSize: '0.9rem', color: 'rgba(138,122,90,0.8)', margin: '0 0 18px', lineHeight: 1.5 }}>
              Burning Crusade Classic is open. Karazhan progression underway. Dungeons run daily. Sign-ups open in the Hall.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/dungeons" style={{
                padding: '9px 20px',
                backgroundColor: 'var(--be-gold)',
                color: '#0d0b07',
                borderRadius: 'var(--be-radius)',
                fontFamily: 'var(--be-font-display)',
                fontSize: '0.72rem',
                letterSpacing: '0.08em',
                textDecoration: 'none',
                display: 'inline-block',
              }}>
                Sign up for raid
              </Link>
              <Link href="/roster" style={{
                padding: '9px 20px',
                backgroundColor: 'transparent',
                color: '#f0e6c8',
                border: '1px solid rgba(201,150,26,0.4)',
                borderRadius: 'var(--be-radius)',
                fontFamily: 'var(--be-font-display)',
                fontSize: '0.72rem',
                letterSpacing: '0.08em',
                textDecoration: 'none',
                display: 'inline-block',
              }}>
                View roster
              </Link>
            </div>
          </div>
        </div>

        {/* Quick stats column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...tile, padding: 22 }}>
            <p style={eyebrow}>Your Characters</p>
            <p className="be-stat" style={{ margin: 0 }}>{charCount}</p>
            <p className="be-stat-label">1 main · {alts.length} alt{alts.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ ...tile, padding: 22 }}>
            <p style={eyebrow}>Guildies on the Site</p>
            <p className="be-stat" style={{ margin: 0 }}>{claimedCount ?? 0}</p>
            <p className="be-stat-label">members registered</p>
          </div>
        </div>
      </div>

      {/* ── Bottom grid: 1fr 1fr ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Hall Feed */}
        <div style={tile}>
          <div style={{ padding: '22px 22px 0' }}>
            <p style={eyebrow}>Hall Feed</p>
          </div>
          {notifications.length > 0
            ? notifications.map((n) => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderTop: '1px solid rgba(61,46,21,0.4)' }}>
                  <div className="be-mini-avatar">{n.title.slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontFamily: "'Spectral', serif", fontSize: '0.9rem', color: '#f0e6c8', lineHeight: 1.3 }}>
                      <span style={{ fontFamily: 'var(--be-font-display)' }}>{n.title}</span>
                      {n.body && <span style={{ color: 'var(--be-gold)', marginLeft: 5 }}>{n.body}</span>}
                    </p>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(138,122,90,0.6)', textTransform: 'uppercase', flexShrink: 0 }}>
                    {relativeTime(n.created_at)}
                  </span>
                </div>
              ))
            : PLACEHOLDER_FEED.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderTop: '1px solid rgba(61,46,21,0.4)' }}>
                  <div className="be-mini-avatar">{item.who.slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontFamily: "'Spectral', serif", fontSize: '0.9rem', color: '#f0e6c8', lineHeight: 1.3 }}>
                      <span style={{ fontFamily: 'var(--be-font-display)' }}>{item.who}</span>
                      <span style={{ color: 'rgba(138,122,90,0.8)', margin: '0 5px' }}>{item.what}</span>
                      <span style={{ color: 'var(--be-gold)' }}>{item.detail}</span>
                    </p>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(138,122,90,0.6)', textTransform: 'uppercase', flexShrink: 0 }}>
                    {item.when}
                  </span>
                </div>
              ))
          }
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
          <p style={{ padding: '12px 22px', fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: '0.8rem', color: 'rgba(138,122,90,0.5)', margin: 0, borderTop: '1px solid rgba(61,46,21,0.4)' }}>
            Dungeon sign-ups coming soon
          </p>
        </div>
      </div>
    </div>
  )
}
