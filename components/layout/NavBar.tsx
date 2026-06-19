import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CLASS_COLORS, CharacterClass } from '@/types'
import { NavScrollGlow } from './NavScrollGlow'
import { NavUserMenu } from './NavUserMenu'
import { NavMobileMenu } from './NavMobileMenu'
import { NavLinks } from './NavLinks'

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
          <NavLinks isLoggedIn={!!user} isOfficer={isOfficer} />
          {user && (
            <NavUserMenu
              displayName={displayName ?? ''}
              charColor={charColor}
              avatarUrl={avatarUrl}
            />
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

      {/* Discord — position:fixed to right edge, outside nav flow */}
      <a
        href="https://discord.gg/B9fEz7AC6T"
        target="_blank"
        rel="noopener noreferrer"
        className="nav-discord-btn"
        title="Join the Blådes Edge guild Discord"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
        </svg>
        <span className="nav-discord-text">Join the Guild Discord</span>
      </a>
    </nav>
  )
}
