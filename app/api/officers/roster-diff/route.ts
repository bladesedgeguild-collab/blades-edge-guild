// Migration required before first use:
// ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS last_online_days integer DEFAULT 9999;
// ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS join_date date;
// Run in Supabase SQL editor.

import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isOfficerUser } from '@/lib/officer'
import { buildMatcher, displayUploaded, normalizeUploaded, type UploadedChar } from '@/lib/roster-sync'
import { fullName } from '@/lib/names'

type DbChar = {
  id: string
  name: string
  last_name: string | null
  claimed_by?: string | null
  class: string
  race: string | null
  level: number
  rank_index: number | null
  rank_name: string | null
  status: string
  last_online_days?: number | null
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
  const uploaded: UploadedChar[] = normalizeUploaded(body.characters ?? (Array.isArray(body) ? body : []))

  if (uploaded.length === 0) {
    return NextResponse.json({ error: 'No characters in payload' }, { status: 400 })
  }

  // Fetch existing characters — try with last_online_days, fall back without
  let dbChars: DbChar[] = []
  let hasLastOnline = true

  const { data: withCol, error: withColErr } = await admin
    .from('characters')
    .select('id, name, last_name, claimed_by, class, race, level, rank_index, rank_name, status, last_online_days')

  if (withColErr) {
    hasLastOnline = false
    const { data: withoutCol } = await admin
      .from('characters')
      .select('id, name, last_name, claimed_by, class, race, level, rank_index, rank_name, status')
    dbChars = (withoutCol ?? []).map((c) => ({ ...c, last_online_days: null }))
  } else {
    dbChars = withCol ?? []
  }

  // Match on first + last name (accent-insensitive)
  const findMatch = buildMatcher(dbChars)

  const foundDbIds = new Set<string>()

  type NewEntry = { status: 'NEW'; name: string; change: string }
  type UpdatedEntry = { status: 'UPDATED'; dbName: string; uploadedName: string; change: string; dbId: string }

  const newEntries: NewEntry[] = []
  const updatedEntries: UpdatedEntry[] = []
  let unchangedCount = 0

  for (const uc of uploaded) {
    const match = findMatch(uc)

    if (!match) {
      newEntries.push({
        status: 'NEW',
        name: displayUploaded(uc),
        change: [uc.race, uc.class, uc.level != null ? `L${uc.level}` : null, uc.rank_name ?? 'Fresh Recruit']
          .filter(Boolean).join(' '),
      })
    } else {
      foundDbIds.add(match.id)
      const changes: string[] = []

      if (uc.last_name && !match.last_name) {
        changes.push(`Last name → ${uc.last_name}`)
      }
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
          dbName: fullName(match.name, match.last_name),
          uploadedName: displayUploaded(uc),
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
    .map((c) => ({ name: fullName(c.name, c.last_name), id: c.id, claimed: !!c.claimed_by }))

  return NextResponse.json({
    new: newEntries,
    updated: updatedEntries,
    unchanged: unchangedCount,
    missing: missingEntries,
    hasLastOnline,
  })
}
