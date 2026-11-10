import { NextResponse } from 'next/server'
import { getDungeon } from '@/data/dungeons/index'
import { legacySchedule } from '@/lib/lfg-actions'
import { clampNeeds } from '@/lib/lfg-group'
import { resolveSchedule } from '@/lib/lfg-time'
import { isOfficerUser } from '@/lib/officer'
import { roleKeyOf } from '@/lib/roles'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ id: string }>
}

async function authorize(id: string, userId: string) {
  const admin = createAdminClient()
  const { data: post } = await admin.from('dungeon_lfg').select('user_id, role, dungeon_slug').eq('id', id).maybeSingle()
  const isOwner = post?.user_id === userId
  const isOfficer = await isOfficerUser(admin, userId)
  return { admin, post, allowed: isOwner || isOfficer }
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { admin, post, allowed } = await authorize(id, user.id)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null) as {
    notes?: string | null
    date?: string
    start?: string
    end?: string | null
    timeZone?: string
    needs?: { tank?: number; healer?: number; dps?: number }
  } | null
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if ('notes' in body) updates.notes = body.notes?.trim() || null

  if (body.date && body.start && body.timeZone) {
    const schedule = resolveSchedule({
      date: body.date,
      start: body.start,
      end: body.end,
      timeZone: body.timeZone,
    })
    if (!schedule.ok) return NextResponse.json({ error: schedule.error }, { status: 400 })
    const legacy = legacySchedule(schedule.startsAt, schedule.endsAt)
    updates.starts_at = schedule.startsAt.toISOString()
    updates.ends_at = schedule.endsAt.toISOString()
    updates.expires_at = schedule.endsAt.toISOString()
    Object.assign(updates, legacy)
  }

  if (body.needs) {
    const dungeon = getDungeon(post.dungeon_slug)
    const maxPlayers = dungeon?.maxPlayers ?? 40
    updates.needs = clampNeeds(
      {
        tank: Number(body.needs.tank ?? 1),
        healer: Number(body.needs.healer ?? 1),
        dps: Number(body.needs.dps ?? 3),
      },
      maxPlayers,
      roleKeyOf(post.role),
    )
  }

  const { error } = await admin.from('dungeon_lfg').update(updates).eq('id', id)
  if (error) {
    console.error('LFG update error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
  return NextResponse.json({ success: true, ...updates })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { admin, post, allowed } = await authorize(id, user.id)
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await admin.from('dungeon_lfg').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  return NextResponse.json({ success: true })
}
