import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { claimExistingCharacter } from '@/lib/claim'

/** Claim a character that is already on the guild roster (found via search). */
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

  const body = await request.json() as { character_id?: string; as?: 'main' | 'alt' }
  if (!body.character_id) return NextResponse.json({ error: 'character_id is required' }, { status: 400 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let asMain = body.as === 'main'
  if (!body.as) {
    const { data: u } = await admin.from('users').select('claimed_character_id').eq('id', user.id).single()
    asMain = !u?.claimed_character_id
  }

  const result = await claimExistingCharacter(admin, user.id, body.character_id, asMain)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ success: true, character: result.character, as: asMain ? 'main' : 'alt' })
}
