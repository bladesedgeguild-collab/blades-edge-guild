import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) {
    return NextResponse.json({ characters: [] })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('characters')
    .select('id, name, class, level, rank_name, last_zone, claimed_by, professions(name, skill_level, is_primary)')
    .ilike('name', `%${q}%`)
    .is('claimed_by', null)
    .order('name', { ascending: true })
    .limit(20)

  if (error) {
    return NextResponse.json({ characters: [] })
  }

  return NextResponse.json({ characters: data ?? [] })
}
