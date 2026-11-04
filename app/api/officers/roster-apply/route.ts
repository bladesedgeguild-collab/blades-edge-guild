import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isOfficerUser } from '@/lib/officer'
import { GUILD } from '@/lib/guild-config'
import { buildMatcher, displayUploaded, normaliseSex, normalizeUploaded, type UploadedChar } from '@/lib/roster-sync'

type DbChar = {
  id: string
  name: string
  last_name: string | null
  claimed_by: string | null
  status: string
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

  const REALM = GUILD.ruleset

  const { data: existingRaw } = await admin
    .from('characters')
    .select('id, name, last_name, claimed_by, status')

  const dbChars: DbChar[] = existingRaw ?? []
  const findMatch = buildMatcher(dbChars)

  const errors: string[] = []
  const upsertedIds = new Map<UploadedChar, string>()
  let added = 0
  let updated = 0

  // Never deletes anything: characters missing from the upload are left alone.
  for (const uc of uploaded) {
    const match = findMatch(uc)
    try {
      if (!match) {
        const insertData: Record<string, unknown> = {
          name: uc.name,
          last_name: uc.last_name ?? null,
          realm: REALM,
          class: (uc.class ?? 'WARRIOR').toUpperCase(),
          race: uc.race ?? null,
          sex: normaliseSex(uc.sex),
          level: uc.level ?? 1,
          rank_index: uc.rank_index ?? null,
          rank_name: uc.rank_name ?? null,
          note: uc.note ?? null,
          last_zone: uc.zone ?? null,
          last_online_days: uc.last_online_days ?? 9999,
          status: 'new',
          // Marks the row as coming from the guild roster so members can find & claim it
          imported_from_grm: true,
          hide_from_roster: false,
          is_main: true,
        }
        const { data: inserted, error } = await admin
          .from('characters')
          .insert(insertData)
          .select('id')
          .single()
        if (error) throw error
        upsertedIds.set(uc, inserted.id)
        added++
      } else {
        // Update roster facts only. Never touch claimed_by / user_id / is_main / hide_from_roster.
        const updateData: Record<string, unknown> = {
          level: uc.level ?? 1,
          rank_index: uc.rank_index ?? null,
          rank_name: uc.rank_name ?? null,
          updated_at: new Date().toISOString(),
        }
        if (uc.last_online_days != null) updateData.last_online_days = uc.last_online_days
        if (uc.last_name && !match.last_name) updateData.last_name = uc.last_name
        if (uc.class) updateData.class = uc.class.toUpperCase()
        if (uc.race) updateData.race = uc.race
        if (uc.zone) updateData.last_zone = uc.zone
        const { error } = await admin.from('characters').update(updateData).eq('id', match.id)
        if (error) throw error
        upsertedIds.set(uc, match.id)
        updated++
      }
    } catch (err) {
      errors.push(`${displayUploaded(uc)}: ${(err as Error).message ?? String(err)}`)
    }
  }

  // Update professions for chars that have them
  const profInserts: Record<string, unknown>[] = []
  const charIdsForProfDelete: string[] = []

  for (const uc of uploaded) {
    if (!uc.professions?.length) continue
    const charId = upsertedIds.get(uc)
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
