import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const mode = searchParams.get('mode')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  const redirectUrl = mode === 'link' ? '/settings' : '/dashboard'
  const response = NextResponse.redirect(new URL(redirectUrl, request.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error.message)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Extract Discord identity fields if this is a Discord OAuth login
    const discordIdentity = user.identities?.find(i => i.provider === 'discord')
    const discordId = discordIdentity?.id ?? null
    const discordUsername = (discordIdentity?.identity_data?.full_name as string | undefined)
      ?? (discordIdentity?.identity_data?.name as string | undefined)
      ?? null
    const discordAvatarHash = discordIdentity?.identity_data?.avatar_hash as string | undefined ?? null
    const discordAvatarUrl = discordId && discordAvatarHash
      ? `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatarHash}.png?size=40`
      : (discordIdentity?.identity_data?.avatar_url as string | undefined) ?? null

    if (mode === 'link') {
      // Link-only mode: update discord fields on the existing user row.
      // Never reset onboarding or display_name.
      await adminClient
        .from('users')
        .update({
          discord_id: discordId,
          discord_username: discordUsername,
          discord_avatar: discordAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    } else {
      // Normal login flow
      const { data: existingUser } = await adminClient
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (existingUser) {
        // Existing user — update discord fields if this is a Discord login, touch updated_at
        const updates: Record<string, string | null> = { updated_at: new Date().toISOString() }
        if (discordId) {
          updates.discord_id = discordId
          updates.discord_username = discordUsername
          updates.discord_avatar = discordAvatarUrl
        }
        await adminClient.from('users').update(updates).eq('id', user.id)
      } else {
        // Brand-new user — bare row only; onboarding owns display_name exclusively
        await adminClient
          .from('users')
          .insert({
            id: user.id,
            discord_id: discordId,
            discord_username: discordUsername,
            discord_avatar: discordAvatarUrl,
            role: 'member',
            has_completed_onboarding: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
      }
    }
  }

  return response
}
