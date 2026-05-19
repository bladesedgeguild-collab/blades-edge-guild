import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { CharacterClass } from '@/types'

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
  const { name, class: charClass, level, is_alt } = body as {
    name: string
    class: CharacterClass
    level: number
    is_alt: boolean
  }

  if (!name || !charClass) {
    return NextResponse.json({ error: 'name and class are required' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: character, error: createError } = await admin
    .from('characters')
    .insert({
      user_id: user.id,
      name,
      class: charClass,
      level: level ?? 1,
      realm: 'Dreamscythe',
      status: 'new',
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
      is_main: !is_alt,
      imported_from_grm: false,
    })
    .select('id, name, class, level, rank_name, last_zone')
    .single()

  if (createError) {
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 })
  }

  if (!is_alt) {
    await admin
      .from('users')
      .update({ claimed_character_id: character.id })
      .eq('id', user.id)
  }

  return NextResponse.json({ success: true, character })
}
