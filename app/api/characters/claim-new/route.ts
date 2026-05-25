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
  const characterClass = body.class.toUpperCase()
  const characterRace = body.race
  const characterLevel = body.level
  const realm = 'Dreamscythe'

  // Check for any existing row with this name + realm (handles post-reset re-onboarding)
  const { data: existingChar } = await admin
    .from('characters')
    .select('id, claimed_by, status')
    .eq('name', characterName)
    .eq('realm', realm)
    .maybeSingle()

  let characterId: string
  let returnedChar: { id: string; name: string; class: string; race: string; level: number }

  if (existingChar) {
    if (existingChar.claimed_by && existingChar.claimed_by !== user.id) {
      return NextResponse.json(
        { error: 'That character name is already claimed by another member.' },
        { status: 409 }
      )
    }
    // Unclaimed or previously belonged to this user — update and reuse
    const { error: updateError } = await admin
      .from('characters')
      .update({
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
        class: characterClass,
        race: characterRace,
        level: characterLevel,
        status: 'new',
        hide_from_roster: false,
      })
      .eq('id', existingChar.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to claim character', detail: updateError.message },
        { status: 500 }
      )
    }
    characterId = existingChar.id
    returnedChar = { id: existingChar.id, name: characterName, class: characterClass, race: characterRace, level: characterLevel }
  } else {
    // No existing row — insert fresh
    const { data: newChar, error: insertError } = await admin
      .from('characters')
      .insert({
        user_id: user.id,
        name: characterName,
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
    characterId = newChar.id
    returnedChar = newChar
  }

  // Link character to user and write display_name
  const { error: userError } = await admin
    .from('users')
    .update({ claimed_character_id: characterId, display_name: characterName })
    .eq('id', user.id)

  if (userError) {
    return NextResponse.json({ error: 'Failed to update user record', detail: userError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, character: returnedChar })
}
