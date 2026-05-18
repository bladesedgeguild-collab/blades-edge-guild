import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const meta = user.user_metadata ?? {}

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabaseAdmin.from('users').upsert(
    {
      id: user.id,
      discord_id: meta.provider_id ?? meta.sub ?? null,
      discord_username: meta.full_name ?? meta.name ?? null,
      discord_avatar: meta.avatar_url ?? null,
      display_name: meta.global_name ?? meta.full_name ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  // Set role to 'pending' only for new users — never overwrite an existing role
  await supabaseAdmin
    .from('users')
    .update({ role: 'pending' })
    .eq('id', user.id)
    .is('role', null)

  return NextResponse.redirect(`${origin}/dashboard`)
}
