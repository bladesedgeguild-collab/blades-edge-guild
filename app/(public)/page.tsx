// Run supabase/migrations/003_hide_from_roster.sql before deploying (adds hide_from_roster + note columns)
import Link from 'next/link'
import { MemberCard } from '@/components/roster/MemberCard'
import { ReturnMeter } from '@/components/roster/ReturnMeter'
import { ScrollingNames, type NameEntry } from '@/components/landing/ScrollingNames'
import { CtaLoginPanel } from '@/components/landing/CtaLoginPanel'
import { CLASS_COLORS, CharacterClass, CharacterStatus } from '@/types'
import { createClient } from '@/lib/supabase/server'

const PREVIEW_MEMBERS: {
  name: string
  class: CharacterClass
  level: number
  rank: string
  status: CharacterStatus
}[] = [
  { name: 'Åvatarødys', class: 'MAGE', level: 60, rank: 'Guild Master', status: 'mia' },
  { name: 'Sozinn', class: 'DRUID', level: 60, rank: 'Grand Marshal', status: 'mia' },
  { name: 'Cradh', class: 'HUNTER', level: 60, rank: 'Grand Marshal', status: 'mia' },
  { name: 'Themrdiddley', class: 'PRIEST', level: 60, rank: 'Ally Emissary', status: 'mia' },
  { name: 'Vranx', class: 'DRUID', level: 60, rank: 'Ally Emissary', status: 'mia' },
  { name: 'Burbun', class: 'PALADIN', level: 41, rank: 'Ally Emissary', status: 'mia' },
  { name: 'Zarlon', class: 'MAGE', level: 56, rank: 'Vanguard Elite', status: 'mia' },
  { name: 'Barragninn', class: 'ROGUE', level: 49, rank: 'Exalted Hero', status: 'mia' },
  { name: 'Kælin', class: 'PALADIN', level: 36, rank: 'Honored Veteran', status: 'mia' },
  { name: 'Tralest', class: 'PRIEST', level: 29, rank: 'Exalted Hero', status: 'mia' },
]

const GuildCrest = ({ size = 48 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    className="flex-shrink-0"
  >
    <path d="M32 4L8 16V36C8 48.15 18.4 59.45 32 62C45.6 59.45 56 48.15 56 36V16L32 4Z" fill="#1a1208" stroke="#c9961a" strokeWidth="2" />
    <path d="M32 12V52" stroke="#c9961a" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 22H42" stroke="#c9961a" strokeWidth="2" strokeLinecap="round" />
    <path d="M26 32L32 20L38 32" stroke="#c9961a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 42H40" stroke="#c9961a" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

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
  const supabase = await createClient()

  // All four queries in parallel; hide_from_roster filter degrades gracefully if column missing
  // (if column doesn't exist, Supabase returns error and data=null — nullish coalescing handles it)
  const [returnedCharsResult, miaCharsResult, totalResult, returnedCountResult] = await Promise.all([
    supabase
      .from('characters')
      .select('name, class')
      .eq('status', 'returned')
      .eq('realm', 'Dreamscythe')
      .eq('hide_from_roster', false)
      .order('name'),
    supabase
      .from('characters')
      .select('name, class')
      .eq('status', 'mia')
      .eq('realm', 'Dreamscythe')
      .eq('hide_from_roster', false)
      .order('level', { ascending: false })
      .limit(50),
    supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .eq('realm', 'Dreamscythe')
      .eq('hide_from_roster', false),
    supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'returned')
      .eq('realm', 'Dreamscythe')
      .eq('hide_from_roster', false),
  ])

  const returned = returnedCountResult.count ?? 0
  const total = totalResult.count ?? 187
  const mia = miaCharsResult.count ?? 0

  const returnedChars = returnedCharsResult.data ?? []
  const miaChars = miaCharsResult.data ?? []

  const returnedEntries: NameEntry[] = returnedChars.map((c) => ({
    name: c.name,
    color: CLASS_COLORS[(c.class as CharacterClass)] ?? '#1aff6e',
  }))

  const miaEntries: NameEntry[] = miaChars.map((c) => ({
    name: c.name,
    color: '#8a7a5a',
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

        {/* Return meter — center bottom */}
        <div
          className="absolute z-10 inset-x-0 flex justify-center px-4"
          style={{ bottom: '10rem' }}
        >
          <div className="w-full max-w-xl">
            <ReturnMeter total={total} returned={returned} />
          </div>
        </div>

        {/* Nameplate + login link — bottom right */}
        <div
          className="absolute z-20 flex flex-col items-end gap-2"
          style={{ bottom: '2rem', right: '2rem' }}
        >
          <Link
            href="/login"
            className="text-sm hover:underline transition-all"
            style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
          >
            Register your return →
          </Link>

          <div
            style={{
              background: 'rgba(13,11,7,0.75)',
              border: '1px solid #3d2e15',
              padding: '1rem 1.25rem',
              borderRadius: '4px',
              backdropFilter: 'blur(4px)',
              minWidth: '220px',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <GuildCrest size={40} />
              <span
                style={{
                  fontFamily: "'Cinzel Decorative', serif",
                  fontSize: '1.5rem',
                  color: '#c9961a',
                  lineHeight: 1.2,
                }}
              >
                Blådes Edge
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '0.7rem',
                color: '#f0e6c8',
                letterSpacing: '0.12em',
                marginBottom: '0.25rem',
              }}
            >
              Burning Crusade Classic · Dreamscythe
            </p>
            <p
              style={{
                fontFamily: "'Crimson Pro', serif",
                fontStyle: 'italic',
                fontSize: '0.7rem',
                color: '#8a7a5a',
              }}
            >
              Est. 2023
            </p>
          </div>
        </div>
      </section>

      {/* ── Brotherhood ── */}
      <section className="pt-16 pb-20 px-4" style={{ backgroundColor: '#1a1208' }}>
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-10">
            <h2
              className="text-4xl sm:text-5xl font-bold mb-3"
              style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
            >
              The Brotherhood
            </h2>
            <p
              className="text-lg italic"
              style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
            >
              {total} adventurers. One guild. The call has gone out.
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
                {returned} {returned === 1 ? 'has' : 'have'} returned
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
                {mia} awaiting the call
              </p>
              <ScrollingNames
                entries={miaEntries}
                speed={35}
                emptyMessage="The roster awaits."
              />
            </div>
          </div>

          {/* Roster preview cards */}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {PREVIEW_MEMBERS.map((m) => (
                <MemberCard key={m.name} {...m} />
              ))}
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
