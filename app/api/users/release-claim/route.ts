import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: userData } = await admin
    .from('users')
    .select('claimed_character_id')
    .eq('id', user.id)
    .single()

  if (userData?.claimed_character_id) {
    await admin
      .from('characters')
      .update({ claimed_by: null, claimed_at: null })
      .eq('id', userData.claimed_character_id)
  }

  await admin
    .from('users')
    .update({ claimed_character_id: null, has_completed_onboarding: false, display_name: null })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
