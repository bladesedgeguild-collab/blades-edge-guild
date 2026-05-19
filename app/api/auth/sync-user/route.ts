import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Called after email sign-in/sign-up to ensure a public.users row exists.
export async function POST() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const displayName = user.email?.split('@')[0] ?? null

  await admin.from('users').upsert(
    {
      id: user.id,
      discord_id: null,
      discord_username: null,
      discord_avatar: null,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  // Set role to 'pending' only for brand-new users
  await admin
    .from('users')
    .update({ role: 'pending' })
    .eq('id', user.id)
    .is('role', null)

  return NextResponse.json({ success: true })
}
