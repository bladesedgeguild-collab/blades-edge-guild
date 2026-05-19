import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CLASS_COLORS, CharacterClass } from '@/types'

type ProfileData = {
  display_name: string | null
  discord_avatar: string | null
  discord_username: string | null
  claimed_character_id?: string | null
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
      .select('display_name, discord_avatar, discord_username, claimed_character_id')
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

  const charColor = claimedChar ? (CLASS_COLORS[claimedChar.class] ?? '#c9a84c') : '#c9a84c'
  const displayName = claimedChar?.name ?? profile?.display_name ?? profile?.discord_username ?? user?.email ?? null

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b"
      style={{ backgroundColor: '#060b18', borderColor: '#1e2a45' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-wide" style={{ color: '#c9a84c' }}>
          Blådes Edge
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm transition-colors hover:text-white" style={{ color: '#8fa3c8' }}>
            Home
          </Link>
          <Link href="/roster" className="text-sm transition-colors hover:text-white" style={{ color: '#8fa3c8' }}>
            Roster
          </Link>
          <span
            className="text-sm cursor-not-allowed relative group"
            style={{ color: '#3d4f6e' }}
            title="Coming soon"
          >
            Dungeons
            <span
              className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
              style={{ backgroundColor: '#1e2a45', color: '#8fa3c8' }}
            >
              Coming soon
            </span>
          </span>

          {user ? (
            <div className="flex items-center gap-2">
              {claimedChar ? (
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: charColor }}
                />
              ) : profile?.discord_avatar ? (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.user_metadata?.provider_id}/${profile.discord_avatar}.png?size=32`}
                  alt={displayName ?? ''}
                  className="w-7 h-7 rounded-full"
                />
              ) : null}
              <span className="text-sm" style={{ color: charColor }}>
                {displayName}
              </span>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium transition-colors hover:text-white"
              style={{ color: '#c9a84c' }}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
