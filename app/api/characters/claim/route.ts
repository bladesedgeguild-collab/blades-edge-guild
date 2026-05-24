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

  const body = await request.json()
  const { character_id, is_alt } = body as { character_id: string; is_alt: boolean }

  if (!character_id) {
    return NextResponse.json({ error: 'character_id is required' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify character is not already claimed
  const { data: existing } = await admin
    .from('characters')
    .select('id, name, claimed_by')
    .eq('id', character_id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  }
  if (existing.claimed_by) {
    return NextResponse.json({ error: 'Character is already claimed' }, { status: 409 })
  }

  // Claim the character
  const { error: charError } = await admin
    .from('characters')
    .update({ claimed_by: user.id, claimed_at: new Date().toISOString(), status: 'returned' })
    .eq('id', character_id)

  if (charError) {
    return NextResponse.json({ error: 'Failed to claim character' }, { status: 500 })
  }

  // If this is the main character, set it on the user record and write display_name
  if (!is_alt) {
    await admin
      .from('users')
      .update({ claimed_character_id: character_id, display_name: existing.name })
      .eq('id', user.id)
  }

  return NextResponse.json({ success: true })
}
