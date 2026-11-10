import { NextResponse } from 'next/server'
import { getDungeon } from '@/data/dungeons/index'
import {
  characterCanPlay,
  groupIsFull,
  hasAccepted,
  loadClaimedCharacter,
  notifyJoin,
  placeInGroup,
  signupRole,
  toMember,
} from '@/lib/lfg-actions'
import { levelFit } from '@/lib/level-fit'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { roleKeyOf } from '@/lib/roles'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    lfgId?: string
    response?: string
    characterId?: string
    role?: string
  } | null

  if (!body?.lfgId || !body.response || !['accepted', 'declined', 'dismissed'].includes(body.response)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: post } = await admin
    .from('dungeon_lfg')
    .select('id, user_id, dungeon_slug, character_name, needs, current_group, starts_at, ends_at, discord_message_id, expires_at')
    .eq('id', body.lfgId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!post) return NextResponse.json({ error: 'That call has expired.' }, { status: 404 })
  if (post.user_id === user.id) return NextResponse.json({ error: 'This is your call.' }, { status: 400 })

  if (body.response !== 'accepted') {
    const saved = await admin.from('dungeon_lfg_responses').upsert(
      { lfg_id: body.lfgId, user_id: user.id, response: body.response },
      { onConflict: 'lfg_id,user_id' },
    )
    if (saved.error) return NextResponse.json({ error: 'Failed to record response' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (await hasAccepted(admin, body.lfgId, user.id)) {
    return NextResponse.json({ error: 'You already joined this group.' }, { status: 409 })
  }

  if (!body.characterId || !body.role) {
    return NextResponse.json({ error: 'Choose a character and role.' }, { status: 400 })
  }
  const role = signupRole(body.role)
  if (!role) return NextResponse.json({ error: 'Pick Tank, Healer, or DPS.' }, { status: 400 })

  const character = await loadClaimedCharacter(admin, user.id, body.characterId)
  if (!character) return NextResponse.json({ error: 'That character is not on your roster.' }, { status: 403 })
  const dungeon = getDungeon(post.dungeon_slug)
  if (!dungeon) return NextResponse.json({ error: 'Unknown dungeon.' }, { status: 400 })
  if (levelFit(dungeon, character.level) !== 'active') {
    return NextResponse.json({ error: 'That character is outside the level range for this call.' }, { status: 400 })
  }
  if (!characterCanPlay(character, role)) {
    return NextResponse.json({ error: 'That character cannot fill this role.' }, { status: 400 })
  }

  const placed = await placeInGroup(admin, post, roleKeyOf(role), toMember(character))
  if (!placed.ok) return NextResponse.json({ error: placed.error }, { status: placed.status })

  const saved = await admin.from('dungeon_lfg_responses').upsert(
    {
      lfg_id: body.lfgId,
      user_id: user.id,
      response: 'accepted',
      character_name: toMember(character).name,
    },
    { onConflict: 'lfg_id,user_id' },
  )
  if (saved.error) return NextResponse.json({ error: 'Joined, but the response was not saved.' }, { status: 500 })

  const member = toMember(character)
  await notifyJoin(admin, {
    posterId: post.user_id,
    joinerId: user.id,
    joinerName: member.name,
    role,
    dungeonName: dungeon.name,
    slug: dungeon.id,
    lfgId: post.id,
    full: groupIsFull(placed.needs, placed.group),
    discordMessageId: post.discord_message_id ?? null,
    startsAt: post.starts_at ?? null,
    levelMin: dungeon.recommendedLevelMin,
    levelMax: dungeon.recommendedLevelMax,
  })

  return NextResponse.json({ ok: true, current_group: placed.group })
}
