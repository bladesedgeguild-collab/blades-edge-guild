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
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { altId } = await request.json()
  if (!altId) return NextResponse.json({ error: 'Missing altId' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify the alt belongs to this user and is not their main
  const { data: character } = await admin
    .from('characters')
    .select('id, claimed_by, is_main')
    .eq('id', altId)
    .single()

  if (!character || character.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (character.is_main) {
    return NextResponse.json({ error: 'Cannot remove main character as alt' }, { status: 400 })
  }

  await admin
    .from('characters')
    .update({ claimed_by: null, claimed_at: null, is_main: false })
    .eq('id', altId)

  return NextResponse.json({ success: true })
}
