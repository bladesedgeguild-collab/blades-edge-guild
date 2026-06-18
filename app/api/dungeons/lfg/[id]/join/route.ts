import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { role, characterId } = body as { role: string; characterId: string }

  if (!['tank', 'healer', 'dps'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const adminDb = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: char } = await adminDb
    .from('characters')
    .select('name')
    .eq('id', characterId)
    .eq('claimed_by', user.id)
    .single()

  if (!char) return NextResponse.json({ error: 'Character not found' }, { status: 404 })

  const { data: post } = await adminDb
    .from('dungeon_lfg')
    .select('current_group')
    .eq('id', id)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!post) return NextResponse.json({ error: 'Post not found or expired' }, { status: 404 })

  const raw = post.current_group ?? {}
  const tank: string[] = Array.isArray(raw.tank) ? raw.tank : []
  const healer: string[] = Array.isArray(raw.healer) ? raw.healer : []
  const dps: string[] = Array.isArray(raw.dps) ? raw.dps : []

  if (role === 'tank' && tank.length >= 1) {
    return NextResponse.json({ error: 'Tank slot is full' }, { status: 409 })
  }
  if (role === 'healer' && healer.length >= 1) {
    return NextResponse.json({ error: 'Healer slot is full' }, { status: 409 })
  }
  if (role === 'dps' && dps.length >= 3) {
    return NextResponse.json({ error: 'DPS slots are full' }, { status: 409 })
  }

  const newGroup = {
    tank: role === 'tank' ? [...tank, char.name] : tank,
    healer: role === 'healer' ? [...healer, char.name] : healer,
    dps: role === 'dps' ? [...dps, char.name] : dps,
  }

  const { error } = await adminDb
    .from('dungeon_lfg')
    .update({ current_group: newGroup })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  return NextResponse.json({ current_group: newGroup })
}
