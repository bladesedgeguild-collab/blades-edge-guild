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

  const { character_id } = await request.json() as { character_id: string }
  if (!character_id) return NextResponse.json({ error: 'character_id required' }, { status: 400 })

  // Get current claim info
  const { data: charRaw } = await admin
    .from('characters')
    .select('id, claimed_by')
    .eq('id', character_id)
    .single()
  const char = charRaw as { id: string; claimed_by: string | null } | null
  if (!char) return NextResponse.json({ error: 'Character not found' }, { status: 404 })

  // Release the character claim
  await admin
    .from('characters')
    .update({ claimed_by: null, claimed_at: null, status: 'mia' })
    .eq('id', character_id)

  // If this was the user's main, clear claimed_character_id
  if (char.claimed_by) {
    await admin
      .from('users')
      .update({ claimed_character_id: null })
      .eq('id', char.claimed_by)
      .eq('claimed_character_id', character_id)
  }

  return NextResponse.json({ success: true })
}
