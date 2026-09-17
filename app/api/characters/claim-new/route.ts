import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { GUILD } from '@/lib/guild-config'

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
    last_name?: string
    race: string
    class: string
    level: number
  }

  if (!body.name?.trim() || !body.last_name?.trim() || !body.race || !body.class || !body.level) {
    return NextResponse.json({ error: 'first name, last name, race, class, and level are required' }, { status: 400 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Guard: user must not already have a claimed character
  const { data: existingUser } = await admin
    .from('users')
    .select('claimed_character_id')
    .eq('id', user.id)
    .single()

  if (existingUser?.claimed_character_id) {
    return NextResponse.json({ error: 'You already have a claimed character' }, { status: 409 })
  }

  const characterName = body.name.trim()
  const characterLastName = body.last_name.trim()
  const characterClass = body.class.toUpperCase()
  const characterRace = body.race
  const characterLevel = body.level
  const realm = GUILD.ruleset

  // Check for a name collision (case-insensitive first + last)
  const { data: existingChar } = await admin
    .from('characters')
    .select('id, claimed_by')
    .ilike('name', characterName)
    .ilike('last_name', characterLastName)
    .maybeSingle()

  if (existingChar) {
    return NextResponse.json(
      { error: 'That name is already taken. Choose a different first or last name.' },
      { status: 409 }
    )
  }

  const { data: newChar, error: insertError } = await admin
    .from('characters')
    .insert({
      user_id: user.id,
      name: characterName,
      last_name: characterLastName,
      realm,
      class: characterClass,
      race: characterRace,
      level: characterLevel,
      rank_name: 'Fresh Recruit',
      rank_index: 9,
      status: 'new',
      is_main: true,
      hide_from_roster: false,
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
      imported_from_grm: false,
    })
    .select('id, name, last_name, class, race, level')
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
    .update({ claimed_character_id: newChar.id, display_name: `${newChar.name} ${newChar.last_name}` })
    .eq('id', user.id)

  if (userError) {
    return NextResponse.json({ error: 'Failed to update user record', detail: userError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, character: newChar })
}
