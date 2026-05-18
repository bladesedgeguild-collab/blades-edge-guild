import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function NavBar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('display_name, discord_avatar, discord_username')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const displayName =
    profile?.display_name ?? profile?.discord_username ?? user?.email ?? null

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b"
      style={{
        backgroundColor: '#060b18',
        borderColor: '#1e2a45',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-wide" style={{ color: '#c9a84c' }}>
          Blådes Edge
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm transition-colors hover:text-white"
            style={{ color: '#8fa3c8' }}
          >
            Home
          </Link>
          <Link
            href="/roster"
            className="text-sm transition-colors hover:text-white"
            style={{ color: '#8fa3c8' }}
          >
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
              {profile?.discord_avatar && (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.user_metadata?.provider_id}/${profile.discord_avatar}.png?size=32`}
                  alt={displayName ?? ''}
                  className="w-7 h-7 rounded-full"
                />
              )}
              <span className="text-sm" style={{ color: '#c9a84c' }}>
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
