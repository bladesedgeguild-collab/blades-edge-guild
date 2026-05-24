import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  // Create the redirect response FIRST so cookies can be written onto it
  const response = NextResponse.redirect(new URL('/dashboard', request.url))

  // Supabase client whose setAll writes session cookies directly onto the response
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

    const meta = user.user_metadata ?? {}

    // Upsert core Discord fields — display_name is intentionally excluded so onboarding
    // character name is never overwritten on subsequent logins.
    await adminClient.from('users').upsert(
      {
        id: user.id,
        discord_id: meta.provider_id ?? meta.sub ?? null,
        discord_username: meta.full_name ?? meta.name ?? null,
        discord_avatar: meta.avatar_url ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    // Seed display_name from Discord only for brand-new users (when still null).
    // Once a character name is written during onboarding we must never overwrite it.
    const seedName = meta.global_name ?? meta.full_name ?? null
    if (seedName) {
      await adminClient.from('users')
        .update({ display_name: seedName })
        .eq('id', user.id)
        .is('display_name', null)
    }

    // Set role + onboarding flag only for new users — never overwrite existing values
    await adminClient
      .from('users')
      .update({ role: 'member', has_completed_onboarding: false })
      .eq('id', user.id)
      .is('role', null)
  }

  // Return the response WITH the session cookies already set on it
  return response
}
