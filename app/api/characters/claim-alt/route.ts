import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { GUILD } from '@/lib/guild-config'
import { claimExistingCharacter } from '@/lib/claim'

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

  const name = (body.name as string | undefined)?.trim()
  const lastName = (body.last_name as string | undefined)?.trim()
  const race = body.race as string | undefined
  const cls  = body.class as string | undefined
  const level = body.level as number | undefined

  if (!name || !lastName || !race || !cls || !level) {
    return NextResponse.json({ error: 'first name, last name, race, class, and level are required' }, { status: 400 })
  }

  const realm = GUILD.ruleset
  const characterClass = cls.toUpperCase()

  const { data: existing } = await admin
    .from('characters')
    .select('id, claimed_by')
    .ilike('name', name)
    .ilike('last_name', lastName)
    .maybeSingle()

  if (existing) {
    if (!existing.claimed_by) {
      const result = await claimExistingCharacter(admin, user.id, existing.id, false, { race, class: characterClass })
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
      return NextResponse.json({ success: true, character: result.character, claimedFromRoster: true })
    }
    return NextResponse.json({ error: 'That name is already claimed by another member. If it is yours, ask an officer to release it.' }, { status: 409 })
  }

  const { data: newChar, error: insertError } = await admin
    .from('characters')
    .insert({
      user_id: user.id,
      name,
      last_name: lastName,
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
    .select('id, name, last_name')
    .single()

  if (insertError || !newChar) {
    return NextResponse.json({
      error: 'Failed to create alt character',
      detail: insertError?.message ?? 'Unknown error',
      code: insertError?.code ?? null,
    }, { status: 500 })
  }

  return NextResponse.json({ success: true, character: { id: newChar.id, name: newChar.name, last_name: newChar.last_name } })
}
