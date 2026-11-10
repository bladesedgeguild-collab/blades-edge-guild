import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isOfficerUser } from '@/lib/officer'
import { GUILD } from '@/lib/guild-config'
import { buildMatcher, displayUploaded, normalizeUploaded, rosterWritePlan, type UploadedChar } from '@/lib/roster-sync'

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
  const warnings: string[] = []
  const upsertedIds = new Map<UploadedChar, string>()
  let added = 0
  let updated = 0

  // Never deletes anything: characters missing from the upload are left alone.
  // Rows outside the Alliance matrix are still written; they are only noted.
  for (const uc of uploaded) {
    const match = findMatch(uc)
    const plan = rosterWritePlan(uc, REALM, match ? { last_name: match.last_name } : null)
    if (plan.warning) warnings.push(`${displayUploaded(uc)}: ${plan.warning}`)
    try {
      if (!match) {
        const { data: inserted, error } = await admin
          .from('characters')
          .insert(plan.fields)
          .select('id')
          .single()
        if (error) throw error
        upsertedIds.set(uc, inserted.id)
        added++
      } else {
        // Update roster facts only. Never touch claimed_by / user_id / is_main / hide_from_roster.
        const { error } = await admin.from('characters').update(plan.fields).eq('id', match.id)
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

  return NextResponse.json({ added, updated, errors, warnings, total: uploaded.length })
}
