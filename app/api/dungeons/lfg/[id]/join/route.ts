import { NextResponse } from 'next/server'
import { getDungeon } from '@/data/dungeons/index'
import {
  characterCanPlay,
  groupIsFull,
  hasAccepted,
  loadClaimedCharacter,
  notifyJoin,
  placeInGroup,
  toMember,
} from '@/lib/lfg-actions'
import { levelFit } from '@/lib/level-fit'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { roleLabel, type RoleKey } from '@/lib/roles'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { role?: string; characterId?: string } | null
  if (!body?.role || !body.characterId || !['tank', 'healer', 'dps'].includes(body.role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  const role = body.role as RoleKey

  const admin = createAdminClient()
  const character = await loadClaimedCharacter(admin, user.id, body.characterId)
  if (!character) return NextResponse.json({ error: 'Character not found' }, { status: 404 })
  if (!characterCanPlay(character, roleLabel(role))) {
    return NextResponse.json({ error: 'That character cannot fill this role.' }, { status: 400 })
  }

  const { data: post } = await admin
    .from('dungeon_lfg')
    .select('id, user_id, dungeon_slug, needs, current_group, starts_at, discord_message_id')
    .eq('id', id)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (!post) return NextResponse.json({ error: 'Post not found or expired' }, { status: 404 })
  if (post.user_id === user.id) return NextResponse.json({ error: 'You are already in this call.' }, { status: 400 })
  if (await hasAccepted(admin, id, user.id)) {
    return NextResponse.json({ error: 'You already joined this group.' }, { status: 409 })
  }
  const target = getDungeon(post.dungeon_slug)
  if (!target) return NextResponse.json({ error: 'Unknown dungeon.' }, { status: 400 })
  if (levelFit(target, character.level) !== 'active') {
    return NextResponse.json({ error: 'That character is outside the level range for this call.' }, { status: 400 })
  }

  const member = toMember(character)
  const placed = await placeInGroup(admin, post, role, member)
  if (!placed.ok) return NextResponse.json({ error: placed.error }, { status: placed.status })

  await admin.from('dungeon_lfg_responses').upsert(
    { lfg_id: id, user_id: user.id, response: 'accepted', character_name: member.name },
    { onConflict: 'lfg_id,user_id' },
  )

  const dungeon = getDungeon(post.dungeon_slug)
  if (dungeon) {
    await notifyJoin(admin, {
      posterId: post.user_id,
      joinerId: user.id,
      joinerName: member.name,
      role: roleLabel(role),
      dungeonName: dungeon.name,
      slug: dungeon.id,
      lfgId: id,
      full: groupIsFull(placed.needs, placed.group),
      discordMessageId: post.discord_message_id ?? null,
      startsAt: post.starts_at ?? null,
      levelMin: dungeon.recommendedLevelMin,
      levelMax: dungeon.recommendedLevelMax,
    })
  }

  return NextResponse.json({ current_group: placed.group })
}
