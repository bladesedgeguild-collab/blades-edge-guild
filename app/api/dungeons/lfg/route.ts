import { NextResponse } from 'next/server'
import { getDungeon } from '@/data/dungeons/index'
import {
  announceNewPost,
  characterCanPlay,
  dungeonNeeds,
  legacySchedule,
  loadClaimedCharacter,
  signupRole,
  toMember,
} from '@/lib/lfg-actions'
import { clampNeeds, normalizeGroup } from '@/lib/lfg-group'
import { resolveSchedule } from '@/lib/lfg-time'
import { roleKeyOf } from '@/lib/roles'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    dungeonSlug?: string
    role?: string
    characterId?: string
    notes?: string
    date?: string
    start?: string
    end?: string | null
    timeZone?: string
    needs?: { tank?: number; healer?: number; dps?: number }
  } | null

  if (!body?.dungeonSlug || !body.role || !body.characterId || !body.date || !body.start || !body.timeZone) {
    return NextResponse.json({ error: 'Choose a character, role, date, and start time.' }, { status: 400 })
  }

  const dungeon = getDungeon(body.dungeonSlug)
  if (!dungeon) return NextResponse.json({ error: 'Unknown dungeon.' }, { status: 400 })

  const role = signupRole(body.role)
  if (!role) return NextResponse.json({ error: 'Pick Tank, Healer, or DPS.' }, { status: 400 })

  const schedule = resolveSchedule({
    date: body.date,
    start: body.start,
    end: body.end,
    timeZone: body.timeZone,
  })
  if (!schedule.ok) return NextResponse.json({ error: schedule.error }, { status: 400 })

  const admin = createAdminClient()
  const character = await loadClaimedCharacter(admin, user.id, body.characterId)
  if (!character) return NextResponse.json({ error: 'That character is not on your roster.' }, { status: 403 })
  if (!characterCanPlay(character, role)) {
    return NextResponse.json({ error: 'That character cannot fill this role.' }, { status: 400 })
  }

  const needs = clampNeeds(
    {
      tank: Number(body.needs?.tank ?? dungeon.groupComp.tank),
      healer: Number(body.needs?.healer ?? dungeon.groupComp.healer),
      dps: Number(body.needs?.dps ?? dungeon.groupComp.dps),
    },
    dungeon.maxPlayers,
    roleKeyOf(role),
  )
  const member = toMember(character)
  const group = normalizeGroup(null)
  group[roleKeyOf(role)] = [member]
  const legacy = legacySchedule(schedule.startsAt, schedule.endsAt)

  const { data: post, error } = await admin
    .from('dungeon_lfg')
    .insert({
      dungeon_slug: dungeon.id,
      user_id: user.id,
      character_name: member.name,
      role,
      notes: body.notes?.trim() || null,
      current_group: group,
      needs,
      starts_at: schedule.startsAt.toISOString(),
      ends_at: schedule.endsAt.toISOString(),
      expires_at: schedule.endsAt.toISOString(),
      ...legacy,
    })
    .select('id, dungeon_slug, character_name, role, notes, starts_at, ends_at, needs, current_group, available_window, user_id')
    .single()

  if (error || !post) {
    console.error('LFG insert error:', error)
    return NextResponse.json({ error: 'Failed to create LFG post' }, { status: 500 })
  }

  try {
    await announceNewPost(admin, {
      id: post.id,
      user_id: post.user_id,
      dungeon_slug: post.dungeon_slug,
      character_name: post.character_name,
      role: post.role,
      notes: post.notes,
      starts_at: post.starts_at,
      needs: post.needs ?? dungeonNeeds(dungeon.id),
      current_group: normalizeGroup(post.current_group),
    })
  } catch (announceError) {
    console.error('LFG announce error:', announceError)
  }

  const publicPost = { ...post }
  delete publicPost.user_id
  return NextResponse.json(publicPost)
}
