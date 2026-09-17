export const dynamic = 'force-dynamic'

import { CinematicRoster, type RosterChar } from '@/components/landing/CinematicRoster'
import { CtaLoginPanel } from '@/components/landing/CtaLoginPanel'
import { LaunchCountdown } from '@/components/landing/LaunchCountdown'
import { FoundersMeter } from '@/components/roster/FoundersMeter'
import { createClient } from '@supabase/supabase-js'
import GMCorner from '@/components/GMCorner'
import { GUILD } from '@/lib/guild-config'

function SectionDivider() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="flex items-center w-[200px]">
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #c9961a)' }} />
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mx-1">
          <polygon points="7,1 13,7 7,13 1,7" fill="#c9961a" opacity="0.6" />
        </svg>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, #c9961a)' }} />
      </div>
    </div>
  )
}

export default async function LandingPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [swornResult, charsResult] = await Promise.all([
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('has_completed_onboarding', true),
    supabase
      .from('characters')
      .select('name, last_name, class, race, level, rank_name, rank_index, professions(name, skill_level, is_primary)')
      .eq('hide_from_roster', false)
      .order('rank_index', { ascending: true, nullsFirst: false })
      .order('level', { ascending: false })
      .limit(60),
  ])

  const swornCount = swornResult.count ?? 0

  type LiveChar = {
    name: string
    last_name: string | null
    class: string
    race?: string | null
    level: number
    rank_name: string | null
    professions?: { name: string; skill_level: number; is_primary: boolean }[]
  }
  const liveChars: LiveChar[] = (charsResult.data ?? []) as LiveChar[]

  const rosterEntries: RosterChar[] = liveChars.map((c) => ({
    name: c.name,
    last_name: c.last_name,
    class: c.class,
    level: c.level,
    rank_name: c.rank_name,
    status: 'new',
    race: c.race ?? null,
    professions: c.professions ?? [],
  }))

  return (
    <div style={{ backgroundColor: '#1a1208' }}>

      {/* ── Hero ── */}
      <section
        className="relative min-h-screen"
        style={{
          backgroundImage: "url('/images/hero-portal.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(26,18,8,0.2) 0%, transparent 30%, rgba(26,18,8,0.75) 70%, #1a1208 100%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(13,11,7,0.7) 0%, transparent 20%, transparent 80%, rgba(13,11,7,0.7) 100%)',
          }}
        />

        <div
          className="absolute z-10 w-full"
          style={{
            bottom: -55,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 680,
            backgroundColor: 'rgba(13,11,7,0.82)',
            backdropFilter: 'blur(6px)',
            borderTop: '1px solid rgba(201,150,26,0.3)',
            borderRadius: 0,
            padding: '20px 32px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <LaunchCountdown />
          <FoundersMeter swornCount={swornCount} />
        </div>

        {/* Mobile hero text — right-aligned, pinned to bottom */}
        <div
          className="hero-title-wrapper block sm:hidden absolute inset-0 z-20 flex flex-col"
          style={{ alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: 8, paddingRight: 16, gap: 8 }}
        >
          <p
            className="hero-guild-name"
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              color: '#c9961a',
              textShadow: '0 2px 24px rgba(0,0,0,0.9)',
              margin: 0,
            }}
          >
            Blades Edge
          </p>
          <p
            className="hero-guild-subtitle"
            style={{
              fontFamily: "'Cinzel', serif",
              color: 'rgba(240,230,200,0.75)',
              textShadow: '0 2px 24px rgba(0,0,0,0.9)',
              margin: 0,
            }}
          >
            Est. {GUILD.established} · {GUILD.game} · {GUILD.faction}
          </p>
          <a href="/recruit" className="hero-recruit-btn" style={{ marginTop: 0 }}>
            ✦ New? Start Here
          </a>
        </div>

        {/* Desktop hero text — right-aligned */}
        <div
          className="absolute z-20 text-right hidden sm:block"
          style={{ bottom: 180, right: 0, paddingRight: 32 }}
        >
          <p
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: '3.5rem',
              color: '#c9961a',
              textShadow: '0 2px 24px rgba(0,0,0,0.9)',
              lineHeight: 1.15,
            }}
          >
            Blades Edge
          </p>
          <p
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '0.95rem',
              letterSpacing: '0.22em',
              color: 'rgba(240,230,200,0.75)',
              textShadow: '0 2px 24px rgba(0,0,0,0.9)',
              marginTop: 8,
            }}
          >
            Est. {GUILD.established} · {GUILD.game} · {GUILD.faction}
          </p>
          <a href="/recruit" className="hero-recruit-btn">
            ✦ New to Blades Edge? Start Here
          </a>
        </div>
      </section>

      {/* ── Guildies ── */}
      <section className="pt-24 pb-20 px-4" style={{ backgroundColor: '#1a1208' }}>
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-10">
            <h2
              className="text-4xl sm:text-5xl font-bold mb-3"
              style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
            >
              A New Age. A New Charter.
            </h2>
            <p
              className="text-lg italic"
              style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
            >
              Blades Edge is forming for {GUILD.game}. Sign the charter and be a founding member.
            </p>
          </div>

          {/* Roster scroll sections */}
          <div className="mt-4 flex flex-col gap-14">
            {rosterEntries.length >= 8 ? (
              <CinematicRoster chars={rosterEntries} rowCount={3} variant="active" />
            ) : (
              <p
                className="text-center text-lg italic"
                style={{ fontFamily: "'Spectral', serif", color: '#8a7a5a' }}
              >
                The charter awaits its first signatures.
              </p>
            )}
          </div>

        </div>
      </section>

      <SectionDivider />

      {/* ── CTA ── */}
      <section
        className="py-20 px-4 text-center"
        style={{ background: 'linear-gradient(to bottom, #1a1208, #0d0b07)' }}
      >
        <div className="max-w-xl mx-auto flex flex-col items-center gap-6">
          <div>
            <h2
              className="font-bold whitespace-nowrap mb-3"
              style={{
                fontFamily: "'Cinzel Decorative', serif",
                fontSize: 'clamp(1.6rem, 4.5vw, 3.5rem)',
                color: '#c9961a',
              }}
            >
              SIGN THE CHARTER.
            </h2>
            <p
              className="text-base italic"
              style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
            >
              Be among the first to carry the Blades Edge banner into {GUILD.game}.
            </p>
          </div>

          <CtaLoginPanel />

          <p
            style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a', fontSize: '0.85rem' }}
          >
            New to Blades Edge? Create an account and sign the charter.
          </p>
        </div>
      </section>

      <GMCorner quote="Thanks for coming to the guild website! I am currently working on it so let me know of issues!" scrollActivate />
    </div>
  )
}
