import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .replace(/[åàáâãäæ]/g, 'a')
    .replace(/[ðď]/g, 'd')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[øòóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ß]/g, 'b')
    .replace(/[þ]/g, 't')
    .replace(/[ñ]/g, 'n')
    .replace(/[çć]/g, 'c')
    .replace(/[žźż]/g, 'z')
    .replace(/[šś]/g, 's')
    .replace(/[łĺ]/g, 'l')
    .replace(/[ř]/g, 'r')
}

type CachedChar = {
  id: string
  name: string
  class: string
  race: string | null
  level: number
  rank_name: string | null
  rank_index: number | null
  last_zone: string | null
  claimed_by: string | null
  joined_guild_at: string | null
  professions: { name: string; skill_level: number; is_primary: boolean }[]
  _n: string // normalized name
}

let charCache: CachedChar[] | null = null
let cacheExpiry = 0

async function getCharCache(): Promise<CachedChar[]> {
  if (charCache && Date.now() < cacheExpiry) return charCache

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('characters')
    .select('id, name, class, race, level, rank_name, rank_index, last_zone, claimed_by, joined_guild_at, professions(name, skill_level, is_primary)')
    .order('rank_index', { ascending: true, nullsFirst: false })
    .order('level', { ascending: false })

  charCache = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    class: c.class,
    race: c.race ?? null,
    level: c.level,
    rank_name: c.rank_name,
    rank_index: c.rank_index,
    last_zone: c.last_zone,
    claimed_by: c.claimed_by,
    joined_guild_at: c.joined_guild_at,
    professions: c.professions ?? [],
    _n: normalizeForSearch(c.name),
  }))
  cacheExpiry = Date.now() + 5 * 60 * 1000
  return charCache
}

function stripInternal(chars: CachedChar[]) {
  return chars.map(({ _n: _ignored, ...rest }) => rest)
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  const count = request.nextUrl.searchParams.get('count')
  const isDefault = request.nextUrl.searchParams.get('default')

  if (count === 'true') {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const [{ count: total }, { count: unclaimed }] = await Promise.all([
      supabase.from('characters').select('*', { count: 'exact', head: true }),
      supabase.from('characters').select('*', { count: 'exact', head: true }).is('claimed_by', null),
    ])
    return NextResponse.json({ total: total ?? 0, unclaimed: unclaimed ?? 0 })
  }

  const chars = await getCharCache()

  if (isDefault === 'true') {
    return NextResponse.json({ characters: stripInternal(chars.slice(0, 12)) })
  }

  if (q.length < 1) {
    return NextResponse.json({ characters: [] })
  }

  const normalizedQ = normalizeForSearch(q)
  const limit = q.length === 1 ? 15 : 20
  const results = chars
    .filter((c) => c._n.includes(normalizedQ))
    .slice(0, limit)

  return NextResponse.json({ characters: stripInternal(results) })
}
