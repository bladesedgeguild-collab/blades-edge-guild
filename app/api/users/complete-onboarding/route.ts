import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function PATCH() {
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

  // Fetch the character name so we can write display_name in the same update.
  // Backfill for users who completed onboarding before this fix:
  //   UPDATE public.users u SET display_name = c.name
  //   FROM public.characters c
  //   WHERE u.claimed_character_id = c.id
  //     AND u.has_completed_onboarding = true
  //     AND (u.display_name IS NULL OR u.display_name = '');
  const { data: userRow } = await admin
    .from('users')
    .select('claimed_character_id')
    .eq('id', user.id)
    .single()

  let displayName: string | undefined
  if (userRow?.claimed_character_id) {
    const { data: charRow } = await admin
      .from('characters')
      .select('name')
      .eq('id', userRow.claimed_character_id)
      .single()
    if (charRow?.name) displayName = charRow.name
  }

  const { error } = await admin
    .from('users')
    .update({
      has_completed_onboarding: true,
      ...(displayName ? { display_name: displayName } : {}),
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
