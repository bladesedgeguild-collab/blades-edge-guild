import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isOfficerUser } from '@/lib/officer'
import { GUILD } from '@/lib/guild-config'
import {
  normalizeUploaded,
  planRosterSync,
  ROSTER_SYNC_COLUMNS,
  type SyncDbRow,
  type UploadedChar,
} from '@/lib/roster-sync'

/**
 * Apply a GRM roster upload. Same planner as the preview.
 * - Matches by GUID first, then by exact (NFC, case-folded) full name.
 * - Never deletes a character. Departed GRM rows get left_guild_at instead.
 * - Never writes note, last_zone, claimed_by, claimed_at, user_id, is_main,
 *   realm (on updates) or hide_from_roster. Rank grants no site privileges.
 */
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
  const flagLeft = body?.flagLeft === true

  if (uploaded.length === 0) {
    return NextResponse.json({ error: 'No characters in payload' }, { status: 400 })
  }

  const { data, error: readErr } = await admin.from('characters').select(ROSTER_SYNC_COLUMNS)
  if (readErr) return NextResponse.json({ error: `Could not read the roster: ${readErr.message}` }, { status: 500 })

  const plan = planRosterSync(uploaded, (data ?? []) as unknown as SyncDbRow[], GUILD.ruleset)

  const errors: string[] = plan.conflicts.map((c) => `${c.name}: skipped, ${c.reason}`)
  const warnings: string[] = []
  const upsertedIds = new Map<UploadedChar, string>()
  let added = 0
  let updated = 0
  let flaggedLeft = 0

  for (const ins of plan.inserts) {
    if (ins.warning) warnings.push(`${ins.name}: ${ins.warning}`)
    const { data: inserted, error } = await admin.from('characters').insert(ins.fields).select('id').single()
    if (error) { errors.push(`${ins.name}: ${error.message}`); continue }
    upsertedIds.set(ins.uc, inserted.id)
    added++
  }

  for (const up of plan.updates) {
    if (up.warning) warnings.push(`${up.name}: ${up.warning}`)
    const { error } = await admin.from('characters').update(up.fields).eq('id', up.id)
    if (error) { errors.push(`${up.name}: ${error.message}`); continue }
    upsertedIds.set(up.uc, up.id)
    updated++
  }

  if (flagLeft && !plan.leaveFlagBlocked && plan.leaving.length > 0) {
    const { data: flagged, error } = await admin
      .from('characters')
      .update({ left_guild_at: new Date().toISOString() })
      .in('id', plan.leaving.map((l) => l.id))
      .is('left_guild_at', null)
      .select('id')
    if (error) errors.push(`Marking departed members: ${error.message}`)
    else flaggedLeft = flagged?.length ?? 0
  } else if (plan.leaveFlagBlocked) {
    warnings.push(plan.leaveFlagBlocked)
  }

  // Professions: only replaced for characters whose upload actually lists them.
  const profInserts: Record<string, unknown>[] = []
  const charIdsForProfDelete: string[] = []

  for (const [uc, charId] of upsertedIds) {
    if (!uc.professions?.length) continue
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

  // Log to grm_imports (counts only)
  try {
    await admin.from('grm_imports').insert({
      imported_by: user.id,
      characters_added: added,
      characters_updated: updated,
      imported_at: new Date().toISOString(),
    })
  } catch { /* non-critical */ }

  return NextResponse.json({
    added,
    updated,
    unchanged: plan.unchanged,
    flaggedLeft,
    errors,
    warnings,
    total: uploaded.length,
  })
}
