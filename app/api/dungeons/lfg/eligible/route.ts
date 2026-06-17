import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { DUNGEONS } from '@/data/dungeons/index'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json([])

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all user's characters
  const { data: myChars } = await service
    .from('characters')
    .select('id, name, level')
    .eq('claimed_by', user.id)

  if (!myChars || myChars.length === 0) return NextResponse.json([])

  // Get active LFG posts (not the user's own)
  const { data: posts, error: postsErr } = await service
    .from('dungeon_lfg')
    .select('id, dungeon_slug, character_name, role, available_window, notes, current_group, user_id')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (postsErr || !posts) return NextResponse.json([])

  // Get user's existing responses (graceful — table may not exist yet)
  let myResponseIds: string[] = []
  try {
    const { data: myResponses } = await service
      .from('dungeon_lfg_responses')
      .select('lfg_id')
      .eq('user_id', user.id)
    myResponseIds = (myResponses ?? []).map((r: { lfg_id: string }) => r.lfg_id)
  } catch {
    // table not yet created — that's OK, show all
  }

  const eligible = posts
    .filter((post: { user_id: string }) => post.user_id !== user.id)
    .filter((post: { id: string }) => !myResponseIds.includes(post.id))
    .flatMap((post: {
      id: string; dungeon_slug: string; character_name: string; role: string
      available_window: string | null; notes: string | null
      current_group: Record<string, number> | null
    }) => {
      const dungeon = DUNGEONS.find(d => d.id === post.dungeon_slug)
      if (!dungeon) return []

      const matchingChars = (myChars as { name: string; level: number }[]).filter(c =>
        c.level >= dungeon.recommendedLevelMin - 5 &&
        c.level <= dungeon.recommendedLevelMax + 5
      )
      if (matchingChars.length === 0) return []

      return [{
        id: post.id,
        dungeon_slug: post.dungeon_slug,
        dungeon_name: dungeon.name,
        dungeon_level_min: dungeon.recommendedLevelMin,
        dungeon_level_max: dungeon.recommendedLevelMax,
        character_name: post.character_name,
        role: post.role,
        available_window: post.available_window,
        notes: post.notes,
        current_group: post.current_group ?? { tank: 0, healer: 0, dps: 0 },
        matching_chars: matchingChars.map(c => ({ name: c.name, level: c.level })),
      }]
    })

  return NextResponse.json(eligible)
}
