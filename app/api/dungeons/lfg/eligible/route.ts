import { NextResponse } from 'next/server'
import { getDungeon } from '@/data/dungeons/index'
import { levelFit } from '@/lib/level-fit'
import { needsSummary, normalizeGroup, openCounts, resolveNeeds } from '@/lib/lfg-group'
import { bannerMatches, type BannerChar } from '@/lib/lfg-match'
import { fullName } from '@/lib/names'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([])

  const admin = createAdminClient()
  const prefs = await admin
    .from('notification_prefs')
    .select('site_banner, match_character_ids')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!prefs.error && prefs.data?.site_banner === false) return NextResponse.json([])

  const charQuery = await admin
    .from('characters')
    .select('id, name, last_name, class, level, is_main, roles')
    .eq('claimed_by', user.id)
  const charFallback = charQuery.error && /roles/i.test(charQuery.error.message ?? '')
    ? await admin
      .from('characters')
      .select('id, name, last_name, class, level, is_main')
      .eq('claimed_by', user.id)
    : null
  const myChars = ((charFallback?.data ?? charQuery.data ?? []) as Array<{
    id: string
    name: string
    last_name: string | null
    class: string
    level: number
    is_main: boolean
    roles?: string[] | null
  }>)
  if (myChars.length === 0) return NextResponse.json([])

  const allowList = !prefs.error ? prefs.data?.match_character_ids as string[] | null | undefined : undefined
  const considered = allowList ? myChars.filter(character => allowList.includes(character.id)) : myChars
  if (considered.length === 0) return NextResponse.json([])

  const postsQuery = await admin
    .from('dungeon_lfg')
    .select('id, dungeon_slug, character_name, role, notes, current_group, needs, starts_at, ends_at, user_id, available_window')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  const postsFallback = postsQuery.error
    ? await admin
      .from('dungeon_lfg')
      .select('id, dungeon_slug, character_name, role, notes, current_group, user_id, available_window')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    : null
  const postRows = postsFallback?.data ?? postsQuery.data
  if ((postsFallback?.error ?? postsQuery.error) || !postRows) return NextResponse.json([])

  const responseQuery = await admin
    .from('dungeon_lfg_responses')
    .select('lfg_id')
    .eq('user_id', user.id)
  const answered = new Set(((responseQuery.data ?? []) as { lfg_id: string }[]).map(row => row.lfg_id))

  const bannerChars: BannerChar[] = considered.map(character => ({
    id: character.id,
    name: fullName(character.name, character.last_name),
    className: character.class,
    level: character.level,
    isMain: character.is_main,
    savedRoles: character.roles ?? null,
  }))

  const eligible = (postRows as Array<{
    id: string
    dungeon_slug: string
    character_name: string
    role: string
    notes: string | null
    current_group: unknown
    needs?: unknown
    starts_at?: string | null
    ends_at?: string | null
    user_id: string
    available_window: string | null
  }>)
    .filter(post => post.user_id !== user.id && !answered.has(post.id))
    .flatMap(post => {
      const dungeon = getDungeon(post.dungeon_slug)
      if (!dungeon) return []
      const needs = resolveNeeds(post.needs, {
        tank: dungeon.groupComp.tank,
        healer: dungeon.groupComp.healer,
        dps: dungeon.groupComp.dps,
      })
      const group = normalizeGroup(post.current_group)
      const open = openCounts(needs, group)
      const matches = bannerMatches(bannerChars, dungeon, open)
        .filter(match => levelFit(dungeon, match.level) === 'active')
      if (matches.length === 0) return []
      return [{
        id: post.id,
        dungeon_slug: post.dungeon_slug,
        dungeon_name: dungeon.name,
        poster_name: post.character_name,
        poster_role: post.role,
        notes: post.notes,
        starts_at: post.starts_at ?? null,
        ends_at: post.ends_at ?? null,
        available_window: post.available_window,
        needs_summary: needsSummary(needs, group),
        matches: matches.map(match => ({
          characterId: match.id,
          name: match.name,
          className: match.className,
          level: match.level,
          isMain: match.isMain,
          role: match.role,
          openRoles: match.openRoles,
        })),
      }]
    })

  return NextResponse.json(eligible)
}
