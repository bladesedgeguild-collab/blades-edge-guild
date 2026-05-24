import { createClient as createServiceClient } from '@supabase/supabase-js'
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

  const body = await request.json() as {
    name: string
    race: string
    class: string
    level: number
    is_new_member: boolean
  }

  if (!body.name?.trim() || !body.race || !body.class || !body.level) {
    return NextResponse.json({ error: 'name, race, class, and level are required' }, { status: 400 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check user doesn't already have a claimed character
  const { data: existingUser } = await admin
    .from('users')
    .select('claimed_character_id')
    .eq('id', user.id)
    .single()

  if (existingUser?.claimed_character_id) {
    return NextResponse.json({ error: 'You already have a claimed character' }, { status: 409 })
  }

  const characterName = body.name.trim()

  // Remove any orphaned new-member rows with the same name+realm from a previous
  // failed attempt. Without this, a unique constraint on (name, realm) will block the insert.
  await admin
    .from('characters')
    .delete()
    .eq('name', characterName)
    .eq('realm', 'Dreamscythe')
    .eq('status', 'new')
    .eq('imported_from_grm', false)

  // Create new character
  const { data: newChar, error: insertError } = await admin
    .from('characters')
    .insert({
      user_id: user.id,
      name: characterName,
      realm: 'Dreamscythe',
      class: body.class.toUpperCase(),
      race: body.race,
      level: body.level,
      rank_name: 'Fresh Recruit',
      rank_index: 9,
      status: 'new',
      is_main: true,
      hide_from_roster: false,
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
      imported_from_grm: false,
    })
    .select('id, name, class, race, level')
    .single()

  if (insertError || !newChar) {
    console.error('Character creation error:', insertError)
    return NextResponse.json({
      error: 'Failed to create character',
      detail: insertError?.message ?? 'Unknown error',
      code: insertError?.code ?? null,
    }, { status: 500 })
  }

  // Link character to user and write display_name
  const { error: userError } = await admin
    .from('users')
    .update({ claimed_character_id: newChar.id, display_name: body.name.trim() })
    .eq('id', user.id)

  if (userError) {
    return NextResponse.json({ error: 'Failed to update user record' }, { status: 500 })
  }

  return NextResponse.json({ success: true, character: newChar })
}
