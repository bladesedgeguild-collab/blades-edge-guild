// Run supabase/migrations/003_hide_from_roster.sql in Supabase SQL editor before using this route
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

type RosterChar = {
  name: string
  realm?: string
  class: string
  level?: number
  rank_name?: string | null
  rank_index?: number | null
  note?: string | null
  status?: 'returned' | 'mia' | 'new'
  alt_of?: string | null
  hide_from_roster?: boolean
  imported_from_grm?: boolean
  race?: string | null
  sex?: unknown
  professions?: { name: string; abbr?: string | null; skill_level?: number }[]
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

  const { data: profile } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'gm'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const characters: RosterChar[] = body.characters ?? (Array.isArray(body) ? body : [])

  if (characters.length === 0) {
    return NextResponse.json({ error: 'No characters found in payload' }, { status: 400 })
  }

  const REALM = 'Dreamscythe'
  const errors: string[] = []

  // Fetch all existing characters to determine claimed status
  const { data: existingChars } = await admin
    .from('characters')
    .select('id, name, claimed_by')
    .eq('realm', REALM)

  const existingByName = new Map<string, { id: string; claimed_by: string | null }>(
    (existingChars ?? []).map((c) => [c.name.toLowerCase(), { id: c.id, claimed_by: c.claimed_by }])
  )

  let imported = 0
  const upsertedIds = new Map<string, string>() // name.lower → id

  // Process in batches of 50
  for (let i = 0; i < characters.length; i += 50) {
    const batch = characters.slice(i, i + 50)

    for (const char of batch) {
      if (!char.name?.trim()) continue
      const nameLower = char.name.toLowerCase()
      const existing = existingByName.get(nameLower)

      const fields: Record<string, unknown> = {
        name: char.name,
        realm: char.realm ?? REALM,
        class: char.class,
        level: char.level ?? 1,
        rank_name: char.rank_name ?? null,
        rank_index: char.rank_index != null ? Number(char.rank_index) : null,
        note: char.note ?? null,
        race: char.race ?? null,
        sex: normaliseSex(char.sex),
        hide_from_roster: char.hide_from_roster ?? false,
        imported_from_grm: true,
        updated_at: new Date().toISOString(),
      }

      // Preserve status for claimed characters (they've registered their return)
      const status = (!existing?.claimed_by) ? (char.status ?? 'mia') : undefined

      try {
        if (existing) {
          const updateData = status !== undefined ? { ...fields, status } : fields
          const { error } = await admin
            .from('characters')
            .update(updateData)
            .eq('id', existing.id)
          if (error) throw error
          upsertedIds.set(nameLower, existing.id)
        } else {
          const { data: inserted, error } = await admin
            .from('characters')
            .insert({ ...fields, status: char.status ?? 'mia', is_main: !char.alt_of })
            .select('id')
            .single()
          if (error) throw error
          upsertedIds.set(nameLower, inserted.id)
        }
        imported++
      } catch (err) {
        errors.push(`${char.name}: ${(err as Error).message ?? String(err)}`)
      }
    }
  }

  // Process professions
  const profInserts: Record<string, unknown>[] = []
  const charIdsForProfDelete: string[] = []

  for (const char of characters) {
    if (!char.name?.trim()) continue
    const charId = upsertedIds.get(char.name.toLowerCase())
    if (!charId) continue

    const profs = char.professions ?? []
    if (profs.length > 0) {
      charIdsForProfDelete.push(charId)
      profs.forEach((p, idx) => {
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
  }

  if (charIdsForProfDelete.length > 0) {
    const { error } = await admin
      .from('professions')
      .delete()
      .in('character_id', charIdsForProfDelete)
    if (error) errors.push(`Profession delete error: ${error.message}`)
  }

  for (let i = 0; i < profInserts.length; i += 100) {
    const { error } = await admin
      .from('professions')
      .insert(profInserts.slice(i, i + 100))
    if (error) errors.push(`Profession insert error: ${error.message}`)
  }

  // Record the import
  await admin.from('grm_imports').insert({
    imported_by: user.id,
    characters_added: [...existingByName].length === 0 ? imported : 0,
    characters_updated: imported,
    notes: errors.length > 0 ? errors.slice(0, 5).join('; ') : null,
    imported_at: new Date().toISOString(),
  })

  return NextResponse.json({ imported, errors, total: characters.length })
}
