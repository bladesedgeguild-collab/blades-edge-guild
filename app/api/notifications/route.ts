import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notifications')
    .select('id, type, title, body, link, read, created_at')
    .eq('user_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(12)
  if (error) return NextResponse.json([])
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { ids?: string[] } | null
  const ids = (body?.ids ?? []).filter(id => typeof id === 'string')
  if (ids.length === 0) return NextResponse.json({ ok: true })

  const admin = createAdminClient()
  const { error } = await admin
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .in('id', ids)
  if (error) return NextResponse.json({ error: 'Could not update notifications' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
