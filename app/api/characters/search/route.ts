import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  const count = request.nextUrl.searchParams.get('count')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (count === 'true') {
    const [{ count: total }, { count: unclaimed }] = await Promise.all([
      supabase.from('characters').select('*', { count: 'exact', head: true }),
      supabase.from('characters').select('*', { count: 'exact', head: true }).is('claimed_by', null),
    ])
    return NextResponse.json({ total: total ?? 0, unclaimed: unclaimed ?? 0 })
  }

  if (q.length < 2) {
    return NextResponse.json({ characters: [] })
  }

  const { data, error } = await supabase
    .from('characters')
    .select('id, name, class, level, rank_name, rank_index, last_zone, claimed_by, joined_guild_at, professions(name, skill_level, is_primary)')
    .ilike('name', `%${q}%`)
    .order('name', { ascending: true })
    .limit(20)

  if (error) {
    return NextResponse.json({ characters: [] })
  }

  return NextResponse.json({ characters: data ?? [] })
}
