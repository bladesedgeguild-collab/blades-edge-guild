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

function normaliseSex(raw: unknown): string | null {
  if (raw === 1 || raw === '1') return 'Male'
  if (raw === 2 || raw === '2') return 'Female'
  if (typeof raw === 'string') {
    const l = raw.toLowerCase()
    if (l === 'male') return 'Male'
    if (l === 'female') return 'Female'
  }
  return null
}

type UploadedChar = {
  name: string
  class?: string
  race?: string
  sex?: unknown
  level?: number
  rank_index?: number | null
  rank_name?: string | null
  last_online_days?: number | null
  note?: string | null
  professions?: { name: string; abbr?: string | null; skill_level?: number }[]
}

type DbChar = {
  id: string
  name: string
  claimed_by: string | null
  status: string
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

  const REALM = 'Dreamscythe'

  // Fetch existing characters
  const { data: existingRaw } = await admin
    .from('characters')
    .select('id, name, claimed_by, status')

  const dbChars: DbChar[] = existingRaw ?? []
  const dbByExact = new Map<string, DbChar>()
  const dbByNorm = new Map<string, DbChar>()
  for (const c of dbChars) {
    dbByExact.set(c.name.toLowerCase(), c)
    const norm = normalizeForSearch(c.name)
    if (!dbByNorm.has(norm)) dbByNorm.set(norm, c)
  }

  const errors: string[] = []
  const upsertedIds = new Map<string, string>() // uploadedName.lower → charId
  let added = 0
  let updated = 0

  for (const uc of uploaded) {
    if (!uc.name?.trim()) continue

    const match = dbByExact.get(uc.name.toLowerCase()) ?? dbByNorm.get(normalizeForSearch(uc.name))

    try {
      if (!match) {
        // INSERT new character, status = 'mia'
        const insertData: Record<string, unknown> = {
          name: uc.name,
          realm: REALM,
          class: uc.class ?? 'WARRIOR',
          race: uc.race ?? null,
          sex: normaliseSex(uc.sex),
          level: uc.level ?? 1,
          rank_index: uc.rank_index ?? null,
          rank_name: uc.rank_name ?? null,
          note: uc.note ?? null,
          status: 'mia',
          imported_from_grm: true,
          hide_from_roster: false,
          is_main: true,
        }

        // Add last_online_days if provided — column may not exist yet
        if (uc.last_online_days != null) {
          insertData.last_online_days = uc.last_online_days
        } else {
          insertData.last_online_days = 9999
        }

        const { data: inserted, error } = await admin
          .from('characters')
          .insert(insertData)
          .select('id')
          .single()

        if (error) {
          // If last_online_days column doesn't exist, retry without it
          if (error.message?.includes('last_online_days')) {
            const { data: inserted2, error: err2 } = await admin
              .from('characters')
              .insert({ ...insertData, last_online_days: undefined })
              .select('id')
              .single()
            if (err2) throw err2
            upsertedIds.set(uc.name.toLowerCase(), inserted2.id)
          } else {
            throw error
          }
        } else {
          upsertedIds.set(uc.name.toLowerCase(), inserted.id)
        }
        added++
      } else {
        // UPDATE existing — only update safe fields; never touch claimed_by/user_id/is_main/hide_from_roster
        const updateData: Record<string, unknown> = {
          level: uc.level ?? 1,
          rank_index: uc.rank_index ?? null,
          rank_name: uc.rank_name ?? null,
          updated_at: new Date().toISOString(),
        }

        // Only update status for unclaimed characters
        if (!match.claimed_by) {
          // Keep status as-is from DB for MIA/new chars that aren't claimed
        }

        // Try with last_online_days first
        const updateWithOnline = {
          ...updateData,
          last_online_days: uc.last_online_days ?? 9999,
        }

        const { error } = await admin
          .from('characters')
          .update(updateWithOnline)
          .eq('id', match.id)

        if (error?.message?.includes('last_online_days')) {
          // Column doesn't exist yet — update without it
          await admin.from('characters').update(updateData).eq('id', match.id)
        } else if (error) {
          throw error
        }

        upsertedIds.set(uc.name.toLowerCase(), match.id)
        updated++
      }
    } catch (err) {
      errors.push(`${uc.name}: ${(err as Error).message ?? String(err)}`)
    }
  }

  // Update professions for chars that have them
  const profInserts: Record<string, unknown>[] = []
  const charIdsForProfDelete: string[] = []

  for (const uc of uploaded) {
    if (!uc.name?.trim() || !uc.professions?.length) continue
    const charId = upsertedIds.get(uc.name.toLowerCase())
    if (!charId) continue

    charIdsForProfDelete.push(charId)
    uc.professions.forEach((p, idx) => {
      profInserts.push({
        character_id: charId,
        name: p.name,
        abbr: p.abbr ?? null,
        skill_level: p.skill_level ?? 0,
        is_primary: idx < 2,
        updated_at: new Date().toISOString(),
      })
    })
  }

  if (charIdsForProfDelete.length > 0) {
    const { error } = await admin
      .from('professions')
      .delete()
      .in('character_id', charIdsForProfDelete)
    if (error) errors.push(`Profession delete: ${error.message}`)
  }

  for (let i = 0; i < profInserts.length; i += 100) {
    const { error } = await admin
      .from('professions')
      .insert(profInserts.slice(i, i + 100))
    if (error) errors.push(`Profession insert: ${error.message}`)
  }

  // Log to grm_imports
  try {
    await admin.from('grm_imports').insert({
      imported_by: user.id,
      characters_added: added,
      characters_updated: updated,
      notes: errors.length > 0 ? errors.slice(0, 5).join('; ') : null,
      imported_at: new Date().toISOString(),
    })
  } catch { /* non-critical */ }

  return NextResponse.json({ added, updated, errors, total: uploaded.length })
}
