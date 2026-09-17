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

  // Every character owned by this user — main and alts alike — is theirs to delete.
  const { data: ownedChars } = await admin
    .from('characters')
    .select('id')
    .eq('claimed_by', user.id)

  const ownedIds = (ownedChars ?? []).map((c) => c.id)

  if (ownedIds.length > 0) {
    await admin.from('professions').delete().in('character_id', ownedIds)
    await admin.from('characters').delete().in('id', ownedIds)
  }

  await admin
    .from('users')
    .update({ claimed_character_id: null, has_completed_onboarding: false, display_name: null })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
