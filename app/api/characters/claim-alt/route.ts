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

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.json() as Record<string, unknown>

  // ── Path A: claim existing roster character as alt ──
  if (body.character_id) {
    const characterId = body.character_id as string

    const { data: char } = await admin
      .from('characters')
      .select('id, name, claimed_by')
      .eq('id', characterId)
      .single()

    if (!char) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }
    if (char.claimed_by && char.claimed_by !== user.id) {
      return NextResponse.json({ error: 'Already claimed by another member' }, { status: 409 })
    }

    const { error: updateError } = await admin
      .from('characters')
      .update({ claimed_by: user.id, claimed_at: new Date().toISOString(), is_main: false, status: 'returned' })
      .eq('id', characterId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to claim alt', detail: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, character: { id: char.id, name: char.name } })
  }

  // ── Path B: create new character as alt ──
  const name = (body.name as string | undefined)?.trim()
  const race = body.race as string | undefined
  const cls  = body.class as string | undefined
  const level = body.level as number | undefined

  if (!name || !race || !cls || !level) {
    return NextResponse.json({ error: 'name, race, class, and level are required' }, { status: 400 })
  }

  const realm = 'Dreamscythe'
  const characterClass = cls.toUpperCase()

  // Check for existing row with this name + realm
  const { data: existing } = await admin
    .from('characters')
    .select('id, claimed_by')
    .eq('name', name)
    .eq('realm', realm)
    .maybeSingle()

  let characterId: string
  let characterName: string = name

  if (existing) {
    if (existing.claimed_by && existing.claimed_by !== user.id) {
      return NextResponse.json({ error: 'That character name is already claimed by another member.' }, { status: 409 })
    }
    const { error: updateError } = await admin
      .from('characters')
      .update({
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
        class: characterClass,
        race,
        level,
        is_main: false,
        status: 'new',
        hide_from_roster: false,
      })
      .eq('id', existing.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update character', detail: updateError.message }, { status: 500 })
    }
    characterId = existing.id
  } else {
    const { data: newChar, error: insertError } = await admin
      .from('characters')
      .insert({
        user_id: user.id,
        name,
        realm,
        class: characterClass,
        race,
        level,
        rank_name: 'Fresh Recruit',
        rank_index: 9,
        status: 'new',
        is_main: false,
        hide_from_roster: false,
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
        imported_from_grm: false,
      })
      .select('id, name')
      .single()

    if (insertError || !newChar) {
      return NextResponse.json({
        error: 'Failed to create alt character',
        detail: insertError?.message ?? 'Unknown error',
        code: insertError?.code ?? null,
      }, { status: 500 })
    }
    characterId = newChar.id
    characterName = newChar.name
  }

  return NextResponse.json({ success: true, character: { id: characterId, name: characterName } })
}
