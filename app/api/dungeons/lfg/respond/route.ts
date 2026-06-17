import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lfgId, response, acceptorRole, acceptorCharName } = await req.json()

  if (!lfgId || !['accepted', 'declined'].includes(response)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: insertErr } = await service
    .from('dungeon_lfg_responses')
    .upsert(
      { lfg_id: lfgId, user_id: user.id, response },
      { onConflict: 'lfg_id,user_id' }
    )

  if (insertErr) {
    console.error('LFG response insert error:', insertErr)
    return NextResponse.json({ error: 'Failed to record response' }, { status: 500 })
  }

  if (response === 'accepted' && acceptorCharName && acceptorRole) {
    const { data: post, error: fetchErr } = await service
      .from('dungeon_lfg')
      .select('current_group')
      .eq('id', lfgId)
      .single()

    if (!fetchErr && post) {
      const existing = (post.current_group ?? { tank: [], healer: [], dps: [] }) as Record<string, string[]>
      const roleKey = acceptorRole === 'Tank' ? 'tank'
        : acceptorRole === 'Healer' ? 'healer' : 'dps'
      const newGroup = {
        tank: Array.isArray(existing.tank) ? existing.tank : [],
        healer: Array.isArray(existing.healer) ? existing.healer : [],
        dps: Array.isArray(existing.dps) ? existing.dps : [],
      }
      if (!newGroup[roleKey].includes(acceptorCharName)) {
        newGroup[roleKey] = [...newGroup[roleKey], acceptorCharName]
      }
      await service
        .from('dungeon_lfg')
        .update({ current_group: newGroup })
        .eq('id', lfgId)
    }
  }

  return NextResponse.json({ ok: true })
}
