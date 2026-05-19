import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Valid WoW class names normalised to our DB format
const CLASS_MAP: Record<string, string> = {
  warrior: 'WARRIOR', paladin: 'PALADIN', hunter: 'HUNTER', rogue: 'ROGUE',
  priest: 'PRIEST', shaman: 'SHAMAN', mage: 'MAGE', warlock: 'WARLOCK', druid: 'DRUID',
}

function normaliseClass(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  return CLASS_MAP[raw.toLowerCase().trim()] ?? null
}

function normaliseSex(raw: unknown): string | null {
  if (raw === 1 || raw === '1' || String(raw).toLowerCase() === 'male') return 'Male'
  if (raw === 2 || raw === '2' || String(raw).toLowerCase() === 'female') return 'Female'
  if (typeof raw === 'string' && raw.length > 0) return raw
  return null
}

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
      return obj[k] as T
    }
  }
  return undefined
}

export type RosterMember = {
  name: string
  class: string
  race?: string
  sex?: string | number
  level?: number
  rankName?: string
  rank_name?: string
  rank?: string
  rankIndex?: number
  rank_index?: number
  lastZone?: string
  last_zone?: string
  zone?: string
  joinedGuildAt?: string
  joined_guild_at?: string
  joinDate?: string
  joined?: string
  hairColor?: string
  hair_color?: string
  skinTone?: string
  skin_tone?: string
  hairStyle?: string
  hair_style?: string
  professions?: ProfessionEntry[]
  profs?: ProfessionEntry[]
  [key: string]: unknown
}

type ProfessionEntry = {
  name: string
  abbr?: string
  abbreviation?: string
  skillLevel?: number
  skill_level?: number
  level?: number
  rank?: number
  isPrimary?: boolean
  is_primary?: boolean
  primary?: boolean
  [key: string]: unknown
}

function extractMembers(raw: unknown): RosterMember[] {
  if (Array.isArray(raw)) return raw as RosterMember[]
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    for (const key of ['members', 'roster', 'characters', 'data', 'guild']) {
      if (Array.isArray(obj[key])) return obj[key] as RosterMember[]
    }
  }
  return []
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

  // Verify admin/gm role
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'gm'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const members = extractMembers(body.data)

  if (members.length === 0) {
    return NextResponse.json({ error: 'No characters found in the provided data' }, { status: 400 })
  }

  const REALM = 'Dreamscythe'
  const errors: string[] = []
  let added = 0
  let updated = 0

  // Fetch all existing characters in this realm for de-duplication
  const { data: existing } = await admin
    .from('characters')
    .select('id, name, status, claimed_by')
    .eq('realm', REALM)

  const existingByName = new Map<string, { id: string; status: string; claimed_by: string | null }>(
    (existing ?? []).map((c) => [c.name.toLowerCase(), c])
  )

  const toInsert: Record<string, unknown>[] = []
  const toUpdate: { id: string; data: Record<string, unknown> }[] = []

  for (const m of members) {
    const o = m as Record<string, unknown>
    const name = String(pick(o, 'name') ?? '').trim()
    if (!name) { errors.push('Skipped entry with no name'); continue }

    const charClass = normaliseClass(pick(o, 'class', 'className', 'classname'))
    if (!charClass) { errors.push(`Skipped ${name}: unknown class "${pick(o, 'class', 'className')}"`) ; continue }

    const fields: Record<string, unknown> = {
      name,
      realm: REALM,
      class: charClass,
      race: pick(o, 'race') ?? null,
      sex: normaliseSex(pick(o, 'sex', 'gender')),
      level: Number(pick(o, 'level') ?? 1),
      rank_name: pick(o, 'rankName', 'rank_name', 'rank') ?? null,
      rank_index: pick(o, 'rankIndex', 'rank_index') != null ? Number(pick(o, 'rankIndex', 'rank_index')) : null,
      last_zone: pick(o, 'lastZone', 'last_zone', 'zone') ?? null,
      joined_guild_at: pick(o, 'joinedGuildAt', 'joined_guild_at', 'joinDate', 'joined') ?? null,
      hair_color: pick(o, 'hairColor', 'hair_color') ?? null,
      skin_tone: pick(o, 'skinTone', 'skin_tone') ?? null,
      hair_style: pick(o, 'hairStyle', 'hair_style') ?? null,
      imported_from_grm: true,
      updated_at: new Date().toISOString(),
    }

    const existingChar = existingByName.get(name.toLowerCase())
    if (existingChar) {
      // Update everything except status/claimed fields to preserve returning member data
      toUpdate.push({ id: existingChar.id, data: fields })
    } else {
      toInsert.push({ ...fields, status: 'mia', is_main: true })
    }
  }

  // Batch insert new characters (chunks of 50)
  const insertedIds = new Map<string, string>() // name.lower → id

  for (let i = 0; i < toInsert.length; i += 50) {
    const chunk = toInsert.slice(i, i + 50)
    const { data: inserted, error } = await admin
      .from('characters')
      .insert(chunk)
      .select('id, name')
    if (error) {
      errors.push(`Batch insert error: ${error.message}`)
    } else {
      added += inserted?.length ?? 0
      for (const c of inserted ?? []) insertedIds.set(c.name.toLowerCase(), c.id)
    }
  }

  // Update existing characters one by one (to avoid partial conflicts)
  for (const { id, data } of toUpdate) {
    const { error } = await admin.from('characters').update(data).eq('id', id)
    if (error) {
      errors.push(`Update error for ID ${id}: ${error.message}`)
    } else {
      updated++
    }
  }

  // Build full id map for profession handling
  const existingByLower = new Map<string, string>(
    (existing ?? []).map((c) => [c.name.toLowerCase(), c.id])
  )

  // Process professions for all characters
  const profInserts: Record<string, unknown>[] = []
  const charIdsToDeleteProfs: string[] = []

  for (const m of members) {
    const o = m as Record<string, unknown>
    const name = String(pick(o, 'name') ?? '').trim()
    if (!name) continue

    const charId =
      insertedIds.get(name.toLowerCase()) ??
      existingByLower.get(name.toLowerCase())

    if (!charId) continue

    const rawProfs = (pick<ProfessionEntry[]>(o, 'professions', 'profs') ?? []) as ProfessionEntry[]
    if (rawProfs.length > 0) {
      charIdsToDeleteProfs.push(charId)
      for (const p of rawProfs) {
        const po = p as Record<string, unknown>
        const profName = String(pick(po, 'name') ?? '').trim()
        if (!profName) continue
        const skillLevel = Number(pick(po, 'skillLevel', 'skill_level', 'level', 'rank') ?? 0)
        const isPrimary = Boolean(pick(po, 'isPrimary', 'is_primary', 'primary') ?? true)
        profInserts.push({
          character_id: charId,
          name: profName,
          abbr: pick(po, 'abbr', 'abbreviation') ?? null,
          skill_level: skillLevel,
          is_primary: isPrimary,
          updated_at: new Date().toISOString(),
        })
      }
    }
  }

  // Delete old professions in bulk, then re-insert
  if (charIdsToDeleteProfs.length > 0) {
    await admin.from('professions').delete().in('character_id', charIdsToDeleteProfs)
  }
  if (profInserts.length > 0) {
    for (let i = 0; i < profInserts.length; i += 100) {
      await admin.from('professions').insert(profInserts.slice(i, i + 100))
    }
  }

  // Record the import
  await admin.from('grm_imports').insert({
    imported_by: user.id,
    characters_added: added,
    characters_updated: updated,
    notes: errors.length > 0 ? errors.slice(0, 10).join('; ') : null,
    imported_at: new Date().toISOString(),
  })

  return NextResponse.json({ added, updated, professions: profInserts.length, errors, total: members.length })
}
