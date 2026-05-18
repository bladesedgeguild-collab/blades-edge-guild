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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const { user } = data
  const meta = user.user_metadata ?? {}

  await supabase.from('users').upsert(
    {
      id: user.id,
      discord_id: meta.provider_id ?? meta.sub ?? null,
      discord_username: meta.full_name ?? meta.name ?? null,
      discord_avatar: meta.avatar_hash ?? null,
      display_name: meta.full_name ?? meta.name ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  return NextResponse.redirect(`${origin}/dashboard`)
}
