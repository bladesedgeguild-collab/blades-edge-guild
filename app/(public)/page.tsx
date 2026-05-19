import Link from 'next/link'
import { MemberCard } from '@/components/roster/MemberCard'
import { ReturnMeter } from '@/components/roster/ReturnMeter'
import { CharacterClass, CharacterStatus } from '@/types'
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

const DiscordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.44077 45.4204 0.52529C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.52529C25.5141 0.44359 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978Z"
      fill="white"
    />
  </svg>
)

function HeroDivider() {
  return (
    <div className="flex items-center justify-center gap-4">
      <div
        className="h-px w-32 sm:w-48"
        style={{ background: 'linear-gradient(to right, transparent, #c9961a)' }}
      />
      <svg width="16" height="32" viewBox="0 0 16 32" fill="none" className="flex-shrink-0">
        <line x1="8" y1="1" x2="8" y2="26" stroke="#c9961a" strokeWidth="2" strokeLinecap="round" />
        <line x1="2" y1="10" x2="14" y2="10" stroke="#c9961a" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="28" r="2.5" fill="#c9961a" />
      </svg>
      <div
        className="h-px w-32 sm:w-48"
        style={{ background: 'linear-gradient(to left, transparent, #c9961a)' }}
      />
    </div>
  )
}

function SectionDivider() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="flex items-center w-[200px]">
        <div
          className="flex-1 h-px"
          style={{ background: 'linear-gradient(to right, transparent, #c9961a)' }}
        />
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 mx-1">
          <polygon points="7,1 13,7 7,13 1,7" fill="#c9961a" opacity="0.6" />
        </svg>
        <div
          className="flex-1 h-px"
          style={{ background: 'linear-gradient(to left, transparent, #c9961a)' }}
        />
      </div>
    </div>
  )
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { count: returnedCount } = await supabase
    .from('characters')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'returned')

  const returned = returnedCount ?? 0

  return (
    <div style={{ backgroundColor: '#1a1208' }}>

      {/* ── Hero ── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pb-24"
        style={{
          backgroundImage: "url('/images/hero-portal.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Bottom fade + dark tint overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(26,18,8,0.25) 0%, transparent 25%, rgba(26,18,8,0.8) 75%, #1a1208 100%)',
          }}
        />
        {/* Left/right vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(13,11,7,0.75) 0%, transparent 20%, transparent 80%, rgba(13,11,7,0.75) 100%)',
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl mx-auto">
          <h1
            className="font-bold leading-tight"
            style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 'clamp(3.5rem, 8vw, 7rem)',
              color: '#c9961a',
              textShadow:
                '0 0 30px rgba(26,255,110,0.25), 0 0 60px rgba(201,150,26,0.4), 0 4px 12px rgba(0,0,0,0.9)',
            }}
          >
            Blådes Edge
          </h1>

          <p
            className="text-sm sm:text-base tracking-[0.25em] uppercase"
            style={{
              fontFamily: "'Cinzel', serif",
              color: '#f0e6c8',
              textShadow: '0 2px 8px rgba(0,0,0,0.9)',
            }}
          >
            EST. 2023 · Burning Crusade Classic · Dreamscythe Alliance
          </p>

          {/* Return Meter */}
          <div className="w-full max-w-2xl mt-4">
            <ReturnMeter total={187} returned={returned} />
          </div>
        </div>

        {/* Bottom ornamental divider */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
          <HeroDivider />
        </div>
      </section>

      {/* ── Guild Photo / Roster Preview ── */}
      <section className="py-20 px-4" style={{ backgroundColor: '#1a1208' }}>
        <div className="max-w-5xl mx-auto">

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
              187 adventurers. One guild. The call has gone out.
            </p>
          </div>

          {/* Guild photo */}
          <div
            className="w-full mx-auto mb-12 rounded-lg overflow-hidden"
            style={{
              maxWidth: '1200px',
              boxShadow: '0 0 0 2px #3d2e15, 0 0 40px rgba(201,150,26,0.3)',
            }}
          >
            <img
              src="/images/guild-photo.png"
              alt="Blådes Edge guild portrait — EST. 2023"
              className="w-full block"
            />
          </div>

          {/* Roster preview cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {PREVIEW_MEMBERS.map((m) => (
              <MemberCard key={m.name} {...m} />
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── Call to Action ── */}
      <section
        className="py-24 px-4 text-center"
        style={{ background: 'linear-gradient(to bottom, #1a1208, #0d0b07)' }}
      >
        <div className="max-w-xl mx-auto flex flex-col items-center gap-6">
          <h2
            className="text-4xl sm:text-5xl font-bold"
            style={{ fontFamily: "'Cinzel Decorative', serif", color: '#c9961a' }}
          >
            Your guild needs you.
          </h2>
          <p
            className="text-lg"
            style={{ fontFamily: "'Crimson Pro', serif", color: '#8a7a5a' }}
          >
            Log in to claim your character and register your return.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-md text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 600,
              fontSize: '0.9rem',
              backgroundColor: '#5865F2',
              boxShadow: '0 0 24px rgba(88,101,242,0.35)',
            }}
          >
            <DiscordIcon />
            Login with Discord
          </Link>
        </div>
      </section>
    </div>
  )
}
