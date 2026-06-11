// Migration required before first use:
// ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS last_online_days integer DEFAULT 9999;
// ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS join_date date;
// Run in Supabase SQL editor.

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function normalizeForSearch(str: string): string {
  return str.toLowerCase()
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

type UploadedChar = {
  name: string
  class?: string
  race?: string
  level?: number
  rank_index?: number | null
  rank_name?: string | null
  last_online_days?: number | null
  professions?: { name: string; abbr?: string | null; skill_level?: number }[]
}

type DbChar = {
  id: string
  name: string
  class: string
  race: string | null
  level: number
  rank_index: number | null
  rank_name: string | null
  status: string
  last_online_days?: number | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isOfficerUser(admin: any, userId: string): Promise<boolean> {
  const { data: profileRaw } = await admin
    .from('users')
    .select('role, claimed_character_id')
    .eq('id', userId)
    .single()
  const profile = profileRaw as { role: string | null; claimed_character_id: string | null } | null

  if (['admin', 'gm', 'officer'].includes(profile?.role ?? '')) return true

  if (profile?.claimed_character_id) {
    const { data: charRaw } = await admin
      .from('characters')
      .select('rank_index')
      .eq('id', profile.claimed_character_id)
      .single()
    const char = charRaw as { rank_index: number | null } | null
    if (char?.rank_index != null && char.rank_index <= 3) return true
  }
  return false
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (!(await isOfficerUser(admin, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const uploaded: UploadedChar[] = body.characters ?? (Array.isArray(body) ? body : [])

  if (uploaded.length === 0) {
    return NextResponse.json({ error: 'No characters in payload' }, { status: 400 })
  }

  // Fetch existing characters — try with last_online_days, fall back without
  let dbChars: DbChar[] = []
  let hasLastOnline = true

  const { data: withCol, error: withColErr } = await admin
    .from('characters')
    .select('id, name, class, race, level, rank_index, rank_name, status, last_online_days')

  if (withColErr) {
    hasLastOnline = false
    const { data: withoutCol } = await admin
      .from('characters')
      .select('id, name, class, race, level, rank_index, rank_name, status')
    dbChars = (withoutCol ?? []).map((c) => ({ ...c, last_online_days: null }))
  } else {
    dbChars = withCol ?? []
  }

  // Build lookup maps: exact lowercase and normalized
  const dbByExact = new Map<string, DbChar>()
  const dbByNorm = new Map<string, DbChar>()
  for (const c of dbChars) {
    dbByExact.set(c.name.toLowerCase(), c)
    const norm = normalizeForSearch(c.name)
    if (!dbByNorm.has(norm)) dbByNorm.set(norm, c)
  }

  const foundDbIds = new Set<string>()

  type NewEntry = { status: 'NEW'; name: string; change: string }
  type UpdatedEntry = { status: 'UPDATED'; dbName: string; uploadedName: string; change: string; dbId: string }

  const newEntries: NewEntry[] = []
  const updatedEntries: UpdatedEntry[] = []
  let unchangedCount = 0

  for (const uc of uploaded) {
    if (!uc.name?.trim()) continue
    const match = dbByExact.get(uc.name.toLowerCase()) ?? dbByNorm.get(normalizeForSearch(uc.name))

    if (!match) {
      newEntries.push({
        status: 'NEW',
        name: uc.name,
        change: [uc.race, uc.class, uc.level != null ? `L${uc.level}` : null, uc.rank_name ?? 'Fresh Recruit']
          .filter(Boolean).join(' '),
      })
    } else {
      foundDbIds.add(match.id)
      const changes: string[] = []

      if (uc.level != null && uc.level !== match.level) {
        changes.push(`Level ${match.level} → ${uc.level}`)
      }
      if (uc.rank_index != null && uc.rank_index !== match.rank_index) {
        changes.push(`Rank: ${match.rank_name ?? '?'} → ${uc.rank_name ?? '?'}`)
      } else if (uc.rank_name != null && uc.rank_name !== match.rank_name && uc.rank_index == null) {
        changes.push(`Rank: ${match.rank_name ?? '?'} → ${uc.rank_name}`)
      }
      if (hasLastOnline && uc.last_online_days != null && uc.last_online_days !== match.last_online_days) {
        changes.push(`last online ${uc.last_online_days}d`)
      }

      if (changes.length > 0) {
        updatedEntries.push({
          status: 'UPDATED',
          dbName: match.name,
          uploadedName: uc.name,
          change: changes.join(', '),
          dbId: match.id,
        })
      } else {
        unchangedCount++
      }
    }
  }

  const missingEntries = dbChars
    .filter((c) => !foundDbIds.has(c.id))
    .map((c) => ({ name: c.name, id: c.id }))

  return NextResponse.json({
    new: newEntries,
    updated: updatedEntries,
    unchanged: unchangedCount,
    missing: missingEntries,
    hasLastOnline,
  })
}
