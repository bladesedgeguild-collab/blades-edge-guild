import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CLASS_COLORS, CharacterClass } from '@/types'
import { NavScrollGlow } from './NavScrollGlow'
import { NavUserMenu } from './NavUserMenu'

type ProfileData = {
  display_name: string | null
  discord_avatar: string | null
  discord_username: string | null
  claimed_character_id?: string | null
  role?: string | null
}

type ClaimedChar = { name: string; class: CharacterClass }

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
        .select('name, class')
        .eq('id', claimedCharId)
        .single()
      claimedChar = charData as unknown as ClaimedChar
    }
  }

  const charColor = claimedChar ? (CLASS_COLORS[claimedChar.class] ?? '#c9961a') : '#c9961a'
  const displayName = profile?.display_name ?? 'Adventurer'

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

        <div className="flex items-center gap-6">
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
                href="/dashboard"
                className="text-sm transition-colors hover:text-[#c9961a]"
                style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
              >
                My Roster
              </Link>
              <span
                className="text-sm cursor-not-allowed relative group"
                style={{ fontFamily: "'Cinzel', serif", color: '#3d2e15' }}
                title="Coming soon"
              >
                Dungeons
                <span
                  className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                  style={{ backgroundColor: '#241a0e', color: '#8a7a5a', fontFamily: "'Crimson Pro', serif" }}
                >
                  Coming soon
                </span>
              </span>
              {['admin', 'gm', 'officer'].includes(profile?.role ?? '') && (
                <Link
                  href="/approvals"
                  className="text-sm transition-colors hover:text-[#c9961a]"
                  style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
                >
                  Officers
                </Link>
              )}
              <NavUserMenu
                displayName={displayName ?? ''}
                charColor={charColor}
                avatarUrl={
                  !claimedChar && profile?.discord_avatar
                    ? `https://cdn.discordapp.com/avatars/${user.user_metadata?.provider_id}/${profile.discord_avatar}.png?size=32`
                    : null
                }
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
              <span
                className="text-sm cursor-not-allowed relative group"
                style={{ fontFamily: "'Cinzel', serif", color: '#3d2e15' }}
                title="Coming soon"
              >
                Dungeons
                <span
                  className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                  style={{ backgroundColor: '#241a0e', color: '#8a7a5a', fontFamily: "'Crimson Pro', serif" }}
                >
                  Coming soon
                </span>
              </span>
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
      </div>
    </nav>
  )
}
