// Run supabase/migrations/003_hide_from_roster.sql before deploying (adds hide_from_roster + note columns)
import { ReturnMeter } from '@/components/roster/ReturnMeter'
import { CtaLoginPanel } from '@/components/landing/CtaLoginPanel'
import { CinematicRoster, type RosterChar } from '@/components/landing/CinematicRoster'
import { CLASS_COLORS, CharacterClass, CharacterStatus } from '@/types'
import { createClient } from '@supabase/supabase-js'

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

  const [
    totalResult,
    returnedOriginalResult,
    newCountResult,
    miaCountResult,
    allCharsResult,
    previewResult,
  ] = await Promise.all([
    supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .eq('realm', 'Dreamscythe')
      .eq('hide_from_roster', false),
    supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'returned')
      .eq('imported_from_grm', true)
      .eq('realm', 'Dreamscythe')
      .eq('hide_from_roster', false),
    supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new')
      .eq('realm', 'Dreamscythe')
      .eq('hide_from_roster', false),
    supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'mia')
      .eq('realm', 'Dreamscythe')
      .eq('hide_from_roster', false),
    supabase
      .from('characters')
      .select('name, class, level, rank_name, status')
      .eq('realm', 'Dreamscythe')
      .neq('hide_from_roster', true)
      .order('name'),
    supabase
      .from('characters')
      .select('name, class, level, rank_name, rank_index, status, professions(name, is_primary)')
      .eq('realm', 'Dreamscythe')
      .eq('hide_from_roster', false)
      .order('rank_index', { ascending: true })
      .order('level', { ascending: false })
      .limit(10),
  ])

  const totalRoster = totalResult.count ?? 0
  const total = totalRoster
  const returnedOriginal = returnedOriginalResult.count ?? 0
  const newCount = newCountResult.count ?? 0
  const miaCount = miaCountResult.count ?? 0

  const allChars: RosterChar[] = (allCharsResult.data ?? []).map((c) => ({
    name: c.name as string,
    class: c.class as string,
    level: c.level as number,
    rank_name: (c.rank_name as string | null) ?? null,
    status: c.status as string,
  }))

  type PreviewMember = {
    name: string
    class: CharacterClass
    level: number
    rank: string
    status: CharacterStatus
    professions: string[]
  }

  const previewMembers: PreviewMember[] = (previewResult.data ?? []).map((c) => ({
    name: c.name as string,
    class: c.class as CharacterClass,
    level: c.level as number,
    rank: (c.rank_name as string | null) ?? '',
    status: c.status as CharacterStatus,
    professions: ((c.professions as { name: string; is_primary: boolean }[] | null) ?? [])
      .filter((p) => p.is_primary)
      .map((p) => p.name),
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
        {/* Bottom-fade overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(26,18,8,0.2) 0%, transparent 30%, rgba(26,18,8,0.75) 70%, #1a1208 100%)',
          }}
        />
        {/* Left/right vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(13,11,7,0.7) 0%, transparent 20%, transparent 80%, rgba(13,11,7,0.7) 100%)',
          }}
        />

        {/* Stats panel — overlaps bottom edge of hero */}
        <div
          className="absolute z-10 w-full"
          style={{
            bottom: -80,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 680,
            backgroundColor: 'rgba(13,11,7,0.82)',
            backdropFilter: 'blur(6px)',
            borderTop: '1px solid rgba(201,150,26,0.3)',
            borderRadius: 0,
            padding: '20px 32px 24px',
          }}
        >
          <ReturnMeter totalRoster={totalRoster} returnedOriginal={returnedOriginal} newCount={newCount} />
        </div>

        {/* Floating guild title — lower-right quadrant, no card */}
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
            Blådes Edge
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
            Est. 2023 · Burning Crusade Classic · Dreamscythe Alliance
          </p>
        </div>
      </section>

      {/* ── Guildies ── */}
      <section className="pb-20 px-4" style={{ backgroundColor: '#1a1208', paddingTop: 120 }}>
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-10">
            <h2
              className="text-4xl sm:text-5xl font-bold mb-3"
              style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
            >
              The Guildies
            </h2>
            <p
              className="text-lg italic"
              style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
            >
              {total} adventurers strong. The call has gone out.
            </p>
          </div>

          {/* Cinematic scrolling roster rows */}
          <div className="mb-12">
            <CinematicRoster chars={allChars} />
          </div>

          {/* Roster preview — two-tier layout */}
          <div className="mt-12">
            <div className="text-center mb-6">
              <h3
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
              >
                Roster Preview
              </h3>
              <p
                className="text-sm italic"
                style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
              >
                Log in to see the full roster and claim your character.
              </p>
            </div>

            {/* Tier 1 — Featured (top 3 by rank) */}
            {previewMembers.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                {previewMembers.slice(0, 3).map((m) => {
                  const classColor = CLASS_COLORS[m.class] ?? '#888'
                  const isReturned = m.status === 'returned'
                  return (
                    <div
                      key={m.name}
                      className="member-card relative overflow-hidden flex flex-col justify-between"
                      style={{
                        minHeight: 120,
                        border: '1px solid #3d2e15',
                        borderLeft: `4px solid ${classColor}`,
                        background: `linear-gradient(135deg, ${classColor}14 0%, #1a1208 60%)`,
                        borderRadius: 4,
                      }}
                    >
                      <div className="p-4 flex flex-col gap-2 h-full">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className="font-semibold leading-tight"
                            style={{ fontFamily: "'Cinzel', serif", fontSize: '1.2rem', color: '#f0e6c8' }}
                          >
                            {m.name}
                          </span>
                          <span
                            className="flex-shrink-0 text-xs mt-0.5"
                            style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
                          >
                            Lvl {m.level}
                          </span>
                        </div>
                        {m.rank && (
                          <span
                            className="inline-block self-start px-2 py-0.5 text-xs"
                            style={{
                              fontFamily: "'Cinzel', serif",
                              color: classColor,
                              border: `1px solid ${classColor}55`,
                              borderRadius: 2,
                            }}
                          >
                            {m.rank}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 mt-auto">
                          <span
                            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: classColor }}
                          />
                          <span
                            className="text-sm"
                            style={{ fontFamily: "'Crimson Pro', serif", color: classColor }}
                          >
                            {m.class.charAt(0) + m.class.slice(1).toLowerCase()}
                          </span>
                          {m.professions.length > 0 && (
                            <span className="text-xs ml-auto" style={{ color: '#8a7a5a', fontFamily: "'Crimson Pro', serif" }}>
                              {m.professions.join(' / ')}
                            </span>
                          )}
                          {isReturned && (
                            <span className="flex items-center gap-1 flex-shrink-0 ml-auto">
                              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#1aff6e' }} />
                              <span className="text-xs" style={{ fontFamily: "'Cinzel', serif", color: '#1aff6e' }}>Returned</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tier 2 — Regular grid (remaining 7) */}
            {previewMembers.length > 3 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {previewMembers.slice(3).map((m) => {
                  const classColor = CLASS_COLORS[m.class] ?? '#888'
                  const isReturned = m.status === 'returned'
                  return (
                    <div
                      key={m.name}
                      className="member-card relative overflow-hidden rounded-sm"
                      style={{
                        backgroundColor: '#1a1208',
                        border: '1px solid #3d2e15',
                        borderLeft: `3px solid ${classColor}`,
                      }}
                    >
                      <div className="p-3 flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className="font-semibold truncate"
                            style={{ fontFamily: "'Cinzel', serif", fontSize: '0.95rem', color: '#f0e6c8' }}
                          >
                            {m.name}
                          </span>
                          <span
                            className="flex-shrink-0 text-xs"
                            style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
                          >
                            {m.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: classColor }}
                          />
                          <span
                            className="text-xs"
                            style={{ fontFamily: "'Crimson Pro', serif", color: classColor }}
                          >
                            {m.class.charAt(0) + m.class.slice(1).toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="text-xs truncate"
                            style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
                          >
                            {m.rank}
                          </span>
                          {isReturned ? (
                            <span className="flex items-center gap-0.5 flex-shrink-0">
                              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#1aff6e' }} />
                              <span className="text-xs" style={{ fontFamily: "'Cinzel', serif", color: '#1aff6e' }}>Returned</span>
                            </span>
                          ) : (
                            <span className="text-xs flex-shrink-0" style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}>· MIA</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
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
              YOUR GUILD NEEDS YOU.
            </h2>
            <p
              className="text-base italic"
              style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
            >
              We&apos;ve been holding your spot. Log in to reclaim your place in the roster.
            </p>
          </div>

          <CtaLoginPanel />

          <p
            style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a', fontSize: '0.85rem' }}
          >
            New to Blådes Edge? Create an account and introduce yourself to the guild.
          </p>
        </div>
      </section>
    </div>
  )
}

