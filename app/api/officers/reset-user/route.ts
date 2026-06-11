import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isOfficerUser(admin: any, userId: string): Promise<boolean> {
  const { data: profileRaw } = await admin
    .from('users')
    .select('role, claimed_character_id')
    .eq('id', userId)
    .single()
  const profile = profileRaw as { role: string | null; claimed_character_id: string | null } | null

  if (['admin', 'gm', 'officer'].includes(profile?.role ?? '')) return true

  if (profile?.claimed_character_id) {
    const { data: charRaw } = await admin
      .from('characters')
      .select('rank_index')
      .eq('id', profile.claimed_character_id)
      .single()
    const char = charRaw as { rank_index: number | null } | null
    if (char?.rank_index != null && char.rank_index <= 3) return true
  }
  return false
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (!(await isOfficerUser(admin, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { user_id } = await request.json() as { user_id: string }
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  // Get target user's claimed character
  const { data: targetRaw } = await admin
    .from('users')
    .select('claimed_character_id')
    .eq('id', user_id)
    .single()
  const target = targetRaw as { claimed_character_id: string | null } | null

  // Release all characters claimed by this user
  await admin
    .from('characters')
    .update({ claimed_by: null, claimed_at: null, status: 'mia' })
    .eq('claimed_by', user_id)

  // If they had a main, make sure it's released too
  if (target?.claimed_character_id) {
    await admin
      .from('characters')
      .update({ claimed_by: null, claimed_at: null, status: 'mia' })
      .eq('id', target.claimed_character_id)
  }

  // Reset user's onboarding state
  await admin
    .from('users')
    .update({
      has_completed_onboarding: false,
      claimed_character_id: null,
      display_name: null,
    })
    .eq('id', user_id)

  return NextResponse.json({ success: true })
}
