import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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

  // Verify requesting user is admin or gm
  const { data: profile } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'gm')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { character_id } = body as { character_id: string }

  if (!character_id) {
    return NextResponse.json({ error: 'character_id is required' }, { status: 400 })
  }

  const { data: character } = await admin
    .from('characters')
    .select('id, claimed_by')
    .eq('id', character_id)
    .single()

  if (!character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }

  // Clear the claim from the character
  await admin
    .from('characters')
    .update({ claimed_by: null, claimed_at: null, status: 'mia' })
    .eq('id', character_id)

  // Clear claimed_character_id from the user if this was their main
  if (character.claimed_by) {
    await admin
      .from('users')
      .update({ claimed_character_id: null })
      .eq('id', character.claimed_by)
      .eq('claimed_character_id', character_id)
  }

  return NextResponse.json({ success: true })
}
