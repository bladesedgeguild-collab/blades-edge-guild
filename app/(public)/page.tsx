// Run supabase/migrations/003_hide_from_roster.sql before deploying (adds hide_from_roster + note columns)
export const dynamic = 'force-dynamic'

import { ReturnMeter } from '@/components/roster/ReturnMeter'
import { ScrollingNames, type NameEntry } from '@/components/landing/ScrollingNames'
import { CtaLoginPanel } from '@/components/landing/CtaLoginPanel'
import { CinematicRoster, type RosterChar } from '@/components/landing/CinematicRoster'
import { CLASS_COLORS, CharacterClass } from '@/types'
import { createClient } from '@supabase/supabase-js'

const AARON_CHARS = new Set([
  'Åvatarødys', 'Guildßank', 'Sumkalimdor', 'Sumwinter', 'Sumzulgurub',
  'Tøph', 'Zmite', 'Æminåmi', 'Ðeerføx', 'Ðjenna', 'Ðråcårys',
  'Ghrumuhlorr', 'Tourisßlaðes', 'Bootyßayah', 'Irøhh', 'Pukanacua',
  'Raghop', 'Sumdeadmines', 'Sumfelwood', 'Summaraudon', 'Sumscarlet',
  'Sumsouthshor', 'Sumstormwind', 'Sumtanaris', 'Sumßlastlnds', 'Sumßlaðes',
  'Sumßootybay', 'Sumßrð', 'Sumåzshara', 'Sumðiremaul', 'Ðjøç',
])

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
    returnedCountResult,
    newCountResult,
    miaCountResult,
    miaCharsResult,
    activeCharsResult,
    originalsResult,
  ] = await Promise.all([
    // Total roster size
    supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .eq('realm', 'Dreamscythe')
      .eq('hide_from_roster', false),
    // Returned original members
    supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'returned'),
    // New adventurers
    supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new')
      .eq('realm', 'Dreamscythe')
      .eq('hide_from_roster', false),
    // MIA count
    supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'mia')
      .eq('realm', 'Dreamscythe')
      .eq('hide_from_roster', false),
    // MIA chars for right scroll column
    supabase
      .from('characters')
      .select('name, class')
      .eq('realm', 'Dreamscythe')
      .eq('status', 'mia')
      .neq('hide_from_roster', true)
      .order('name')
      .limit(60),
    // Active this week (last_online_days <= 7)
    supabase
      .from('characters')
      .select('name, class, level, rank_name, status, last_online_days')
      .lte('last_online_days', 7)
      .eq('hide_from_roster', false)
      .order('last_online_days', { ascending: true })
      .limit(30),
    // All returned chars — for left scroll column + Original Blådes Edge Members rows
    supabase
      .from('characters')
      .select('name, class, level, rank_name, status')
      .eq('status', 'returned')
      .eq('hide_from_roster', false)
      .order('rank_index', { ascending: true }),
  ])

  const totalRoster = totalResult.count ?? 0
  const total = totalRoster
  const returnedOriginal = returnedCountResult.count ?? 0
  const newCount = newCountResult.count ?? 0
  const mia = miaCountResult.count ?? 0

  // Left column — Answered the Call
  const seenReturnedNames = new Set<string>()
  const returnedEntries: NameEntry[] = (originalsResult.data ?? [])
    .filter((c) => { if (seenReturnedNames.has(c.name)) return false; seenReturnedNames.add(c.name); return true })
    .map((c) => ({ name: c.name, color: CLASS_COLORS[(c.class as CharacterClass)] ?? '#1aff6e' }))

  // Right column — Still MIA
  const miaEntries: NameEntry[] = (miaCharsResult.data ?? [])
    .map((c) => ({ name: c.name, color: '#8a7a5a' }))

  // Active This Week — exclude Aaron's alts
  const activeThisWeek: RosterChar[] = (activeCharsResult.data ?? [])
    .filter((c) => !AARON_CHARS.has(c.name))
    .map((c) => ({
      name: c.name as string,
      class: c.class as string,
      level: c.level as number,
      rank_name: (c.rank_name as string | null) ?? null,
      status: c.status as string,
    }))

  // Original Blådes Edge Members — 3× non-Aaron loop, then Aaron's chars
  const originalsAll: RosterChar[] = (originalsResult.data ?? []).map((c) => ({
    name: c.name as string,
    class: c.class as string,
    level: c.level as number,
    rank_name: (c.rank_name as string | null) ?? null,
    status: c.status as string,
  }))
  const nonAaron = originalsAll.filter((c) => !AARON_CHARS.has(c.name))
  const aaronChars = originalsAll.filter((c) => AARON_CHARS.has(c.name))
  const originalsScrollArray: RosterChar[] = [
    ...nonAaron, ...nonAaron, ...nonAaron,
    ...aaronChars,
  ]

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

        {/* Stats panel — slightly overlaps bottom of hero */}
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
      <section className="pt-24 pb-20 px-4" style={{ backgroundColor: '#1a1208' }}>
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

          {/* Three-column layout: left | image | right */}
          <div className="flex flex-wrap md:flex-nowrap items-stretch">

            {/* Left column — Answered the Call */}
            <div
              className="w-full md:w-1/5 order-2 md:order-1 flex flex-col py-4 px-3"
              style={{
                background: 'linear-gradient(to right, rgba(26,18,8,0.95) 50%, rgba(26,18,8,0.4) 100%)',
                borderRight: '1px solid #3d2e15',
                zIndex: 10,
                position: 'relative',
                textAlign: 'right',
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ fontFamily: "'Cinzel', serif", color: '#1aff6e', fontVariant: 'small-caps' }}
              >
                Answered the Call
              </p>
              <p
                className="text-xs mb-3"
                style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
              >
                {returnedOriginal} {returnedOriginal === 1 ? 'has' : 'have'} returned
              </p>
              <ScrollingNames
                entries={returnedEntries}
                speed={20}
                emptyMessage="Be the first to answer."
              />
            </div>

            {/* Center — Guild photo */}
            <div className="w-full md:flex-1 order-1 md:order-2" style={{ zIndex: 1 }}>
              <div
                style={{
                  boxShadow: '0 0 0 2px #3d2e15, 0 0 40px rgba(201,150,26,0.25)',
                  lineHeight: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/guild-photo.png"
                  alt="Blådes Edge guild portrait — EST. 2023"
                  className="w-full block"
                />
              </div>
            </div>

            {/* Right column — Still MIA */}
            <div
              className="w-full md:w-1/5 order-3 flex flex-col py-4 px-3"
              style={{
                background: 'linear-gradient(to left, rgba(26,18,8,0.95) 50%, rgba(26,18,8,0.4) 100%)',
                borderLeft: '1px solid #3d2e15',
                zIndex: 10,
                position: 'relative',
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ fontFamily: "'Cinzel', serif", color: '#c9961a', fontVariant: 'small-caps' }}
              >
                Still MIA
              </p>
              <p
                className="text-xs mb-3"
                style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
              >
                {mia} still awaiting the call
              </p>
              <ScrollingNames
                entries={miaEntries}
                speed={35}
                emptyMessage="The roster awaits."
              />
            </div>
          </div>

          {/* Active This Week + Original Blådes Edge Members */}
          <div className="mt-16 flex flex-col gap-14">

            {/* Active This Week */}
            {activeThisWeek.length > 0 && (
              <div>
                <div className="text-center mb-6">
                  <h3
                    className="text-2xl font-bold mb-2"
                    style={{ fontFamily: "'Cinzel', serif", color: '#1aff6e' }}
                  >
                    Active This Week
                  </h3>
                  <p
                    className="text-sm italic"
                    style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
                  >
                    Guildies spotted online in the last 7 days.
                  </p>
                </div>
                <CinematicRoster chars={activeThisWeek} />
              </div>
            )}

            {/* Original Blådes Edge Members */}
            <div>
              <div className="text-center mb-6">
                <h3
                  className="text-2xl font-bold mb-2"
                  style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
                >
                  Original Blådes Edge Members
                </h3>
                <p
                  className="text-sm italic"
                  style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
                >
                  Log in to see the full roster and claim your character.
                </p>
              </div>
              <CinematicRoster chars={originalsScrollArray} />
            </div>

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
