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

  // Only update the timestamp — display_name is owned by onboarding exclusively,
  // and discord fields are not relevant for email users (don't null them out).
  await admin.from('users').upsert(
    {
      id: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  // Set role + onboarding flag only for brand-new users (role IS NULL = first login)
  await admin
    .from('users')
    .update({ role: 'member', has_completed_onboarding: false })
    .eq('id', user.id)
    .is('role', null)

  return NextResponse.json({ success: true })
}
