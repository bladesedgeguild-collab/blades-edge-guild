import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CLASS_COLORS, CharacterClass } from '@/types'
import { NavScrollGlow } from './NavScrollGlow'
import { NavUserMenu } from './NavUserMenu'
import { NavMobileMenu } from './NavMobileMenu'

type ProfileData = {
  display_name: string | null
  discord_avatar: string | null
  discord_username: string | null
  claimed_character_id?: string | null
  role?: string | null
}

type ClaimedChar = { name: string; class: CharacterClass; rank_index: number | null }

export async function NavBar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: ProfileData | null = null
  let claimedChar: ClaimedChar | null = null

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('display_name, discord_avatar, discord_username, claimed_character_id, role')
      .eq('id', user.id)
      .single()
    profile = data as unknown as ProfileData

    const claimedCharId = profile?.claimed_character_id
    if (claimedCharId) {
      const { data: charData } = await supabase
        .from('characters')
        .select('name, class, rank_index')
        .eq('id', claimedCharId)
        .single()
      claimedChar = charData as unknown as ClaimedChar
    }
  }

  const charColor = claimedChar ? (CLASS_COLORS[claimedChar.class] ?? '#c9961a') : '#c9961a'
  const displayName = profile?.display_name ?? 'Adventurer'
  const avatarUrl = !claimedChar && profile?.discord_avatar
    ? `https://cdn.discordapp.com/avatars/${user?.user_metadata?.provider_id}/${profile.discord_avatar}.png?size=32`
    : null
  const isOfficer = ['admin', 'gm', 'officer'].includes(profile?.role ?? '') ||
    (claimedChar?.rank_index != null && claimedChar.rank_index <= 3)

  return (
    <nav
      id="site-nav"
      className="sticky top-0 z-50 w-full border-b transition-shadow duration-300"
      style={{ backgroundColor: '#0d0b07', borderColor: '#3d2e15' }}
    >
      <NavScrollGlow />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-xl tracking-wide"
          style={{ fontFamily: "'Cinzel Decorative', serif", color: '#c9961a' }}
        >
          Blådes Edge
        </Link>

        {/* Desktop nav — hidden on mobile via .nav-desktop-links */}
        <div className="nav-desktop-links">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm transition-colors hover:text-[#c9961a]"
                style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
              >
                Hall
              </Link>
              <Link
                href="/my-roster"
                className="text-sm transition-colors hover:text-[#c9961a]"
                style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
              >
                My Roster
              </Link>
              <Link
                href="/guildies"
                className="text-sm transition-colors hover:text-[#c9961a]"
                style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
              >
                Guildies
              </Link>
              <Link
                href="/dungeons"
                className="text-sm transition-colors hover:text-[#c9961a]"
                style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
              >
                Dungeons
              </Link>
              {isOfficer && (
                <Link
                  href="/officers"
                  className="text-sm transition-colors hover:text-[#c9961a]"
                  style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
                >
                  Officers
                </Link>
              )}
              <NavUserMenu
                displayName={displayName ?? ''}
                charColor={charColor}
                avatarUrl={avatarUrl}
              />
            </>
          ) : (
            <>
              <Link
                href="/"
                className="text-sm transition-colors hover:text-[#c9961a]"
                style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
              >
                Home
              </Link>
              <Link
                href="/roster"
                className="text-sm transition-colors hover:text-[#c9961a]"
                style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
              >
                Roster
              </Link>
              <Link
                href="/recruit"
                className="text-sm transition-colors hover:text-[#c9961a]"
                style={{ fontFamily: "'Cinzel', serif", color: '#1aff6e' }}
              >
                Join
              </Link>
              <Link
                href="/dungeons"
                className="text-sm transition-colors hover:text-[#c9961a]"
                style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
              >
                Dungeons
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium transition-colors hover:text-white"
                style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
              >
                Login
              </Link>
            </>
          )}
        </div>

        {/* Mobile nav — hidden on desktop via .nav-mobile-wrapper */}
        <NavMobileMenu
          isLoggedIn={!!user}
          isOfficer={isOfficer}
          displayName={displayName ?? ''}
          charColor={charColor}
          avatarUrl={avatarUrl}
        />
      </div>
    </nav>
  )
}
