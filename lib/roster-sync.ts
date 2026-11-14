import { allianceComboWarning } from '@/lib/guild-config'
import { splitRosterName, fullName } from '@/lib/names'

/** One member row as uploaded on /officers (from the GRM .lua parser or a JSON file). */
export type UploadedChar = {
  name: string
  last_name?: string | null
  guid?: string | null
  class?: string
  race?: string
  sex?: unknown
  level?: number
  rank_index?: number | null
  rank_name?: string | null
  last_online_days?: number | null
  note?: string | null
  zone?: string | null
  professions?: { name: string; abbr?: string | null; skill_level?: number }[]
}

/** In-game character GUID, for example "Player-6928-004CDB41". */
const GUID_RE = /^Player-\d{1,6}-[0-9A-F]{8}$/i

export function cleanGuid(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const g = raw.trim()
  return GUID_RE.test(g) ? g.toUpperCase().replace(/^PLAYER-/, 'Player-') : null
}

/**
 * Identity key for duplicate checks: Unicode NFC, then a full case fold
 * (upper then lower, so "ß" and "SS" agree), with whitespace collapsed.
 * Accents are kept, so "Æsir" and "Aesir" stay two different characters.
 */
export function identityKey(first: string | null | undefined, last?: string | null): string {
  return fullName(first, last)
    .normalize('NFC')
    .toUpperCase()
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim()
}

/** First name only, folded the same way. The table is unique on (name, realm). */
export function firstNameKey(first: string | null | undefined): string {
  return identityKey(first, null)
}

/** Make sure every uploaded row has a separate first + last name and a clean GUID. */
export function normalizeUploaded(list: UploadedChar[]): UploadedChar[] {
  const out: UploadedChar[] = []
  for (const uc of list) {
    if (!uc?.name || typeof uc.name !== 'string' || !uc.name.trim()) continue
    const guid = cleanGuid(uc.guid)
    if (uc.last_name && uc.last_name.trim()) {
      out.push({ ...uc, guid, name: uc.name.trim().normalize('NFC'), last_name: uc.last_name.trim().normalize('NFC') })
    } else {
      const { name, last_name } = splitRosterName(uc.name.normalize('NFC'))
      if (!name) continue
      out.push({ ...uc, guid, name, last_name })
    }
  }
  return out
}

type Named = { id: string; name: string; last_name: string | null; guid?: string | null }

export type MatchResult<T> =
  | { kind: 'guid'; row: T }
  | { kind: 'name'; row: T }
  | { kind: 'none' }
  | { kind: 'conflict'; reason: string }

/**
 * Index DB characters for matching.
 * 1. GUID first. A GUID match wins even if the name changed.
 * 2. Otherwise an exact identity-key match on first + last name, only against
 *    rows that have no GUID yet, and only when exactly one row has that name.
 *    A row that already carries a different GUID is a different character.
 * 3. Legacy rows stored without a last name match on a unique first name.
 */
export function buildMatcher<T extends Named>(dbChars: T[]) {
  const byGuid = new Map<string, T>()
  const byFull = new Map<string, T[]>()
  const byFirstNoLast = new Map<string, T[]>()
  for (const c of dbChars) {
    const g = cleanGuid(c.guid)
    if (g) byGuid.set(g, c)
    const k = identityKey(c.name, c.last_name)
    byFull.set(k, [...(byFull.get(k) ?? []), c])
    if (!c.last_name) {
      const f = firstNameKey(c.name)
      byFirstNoLast.set(f, [...(byFirstNoLast.get(f) ?? []), c])
    }
  }
  return (uc: UploadedChar): MatchResult<T> => {
    const g = cleanGuid(uc.guid)
    if (g) {
      const hit = byGuid.get(g)
      if (hit) return { kind: 'guid', row: hit }
    }
    const named = byFull.get(identityKey(uc.name, uc.last_name)) ?? []
    if (named.length > 1) return { kind: 'conflict', reason: 'more than one site row has this name' }
    if (named.length === 1) {
      const row = named[0]
      const rowGuid = cleanGuid(row.guid)
      if (rowGuid && g && rowGuid !== g) {
        return { kind: 'conflict', reason: 'a different character with this name is already on the site' }
      }
      return { kind: 'name', row }
    }
    if (uc.last_name) {
      const firsts = (byFirstNoLast.get(firstNameKey(uc.name)) ?? []).filter((c) => !cleanGuid(c.guid))
      if (firsts.length === 1) return { kind: 'name', row: firsts[0] }
    }
    return { kind: 'none' }
  }
}

export function displayUploaded(uc: UploadedChar): string {
  return fullName(uc.name, uc.last_name)
}

/**
 * WoW UnitSex, which is what GRM stores: 1 = unknown, 2 = male, 3 = female.
 * String labels from a hand-edited JSON upload are still accepted.
 */
export function normaliseSex(raw: unknown): string | null {
  if (raw === 2 || raw === '2') return 'Male'
  if (raw === 3 || raw === '3') return 'Female'
  if (typeof raw === 'string') {
    const l = raw.trim().toLowerCase()
    if (l === 'male') return 'Male'
    if (l === 'female') return 'Female'
  }
  return null
}

function validLevel(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 100 ? v : null
}

/** Rank is written only as an exact pair from the upload, never one half alone. */
export function exactRank(uc: UploadedChar): { rank_index: number; rank_name: string } | null {
  const idx = uc.rank_index
  const name = typeof uc.rank_name === 'string' ? uc.rank_name.trim() : ''
  if (typeof idx !== 'number' || !Number.isInteger(idx) || idx < 0 || idx > 9 || !name) return null
  return { rank_index: idx, rank_name: name }
}

/**
 * Fields written for a brand-new roster row. Public note and zone are never
 * included. is_main is left to the table default (the member picks a main when
 * they claim). realm is the site's fixed placeholder, never taken from the
 * upload or worked out from a GUID.
 */
export function rosterInsertFields(uc: UploadedChar, realm: string): Record<string, unknown> {
  const rank = exactRank(uc)
  const fields: Record<string, unknown> = {
    name: uc.name,
    last_name: uc.last_name ?? null,
    realm,
    class: (uc.class ?? 'WARRIOR').toUpperCase(),
    race: uc.race ?? null,
    sex: normaliseSex(uc.sex),
    level: validLevel(uc.level) ?? 1,
    rank_index: rank?.rank_index ?? null,
    rank_name: rank?.rank_name ?? null,
    last_online_days: uc.last_online_days ?? 9999,
    status: 'new',
    imported_from_grm: true,
    hide_from_roster: false,
  }
  const guid = cleanGuid(uc.guid)
  if (guid) fields.guid = guid
  return fields
}

type ExistingRow = {
  last_name: string | null
  guid?: string | null
  left_guild_at?: string | null
}

/**
 * Roster facts updated on a row that already exists. Claim columns stay off
 * this object, and so do is_main, realm, hide_from_roster, the public note
 * and last zone.
 */
export function rosterUpdateFields(uc: UploadedChar, match: ExistingRow): Record<string, unknown> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  const level = validLevel(uc.level)
  if (level != null) updateData.level = level
  const rank = exactRank(uc)
  if (rank) {
    updateData.rank_index = rank.rank_index
    updateData.rank_name = rank.rank_name
  }
  if (uc.last_online_days != null) updateData.last_online_days = uc.last_online_days
  if (uc.last_name && !match.last_name) updateData.last_name = uc.last_name
  if (uc.class) updateData.class = uc.class.toUpperCase()
  if (uc.race) updateData.race = uc.race
  const sex = normaliseSex(uc.sex)
  if (sex) updateData.sex = sex
  const guid = cleanGuid(uc.guid)
  if (guid && !cleanGuid(match.guid)) updateData.guid = guid
  // Back in the guild: clear the departed flag.
  if (match.left_guild_at) updateData.left_guild_at = null
  return updateData
}

export type RosterWritePlan = {
  op: 'insert' | 'update'
  fields: Record<string, unknown>
  warning: string | null
}

/** Build the database write for one uploaded row. Never refuses the row. */
export function rosterWritePlan(
  uc: UploadedChar,
  realm: string,
  existing: ExistingRow | null,
): RosterWritePlan {
  const warning = allianceComboWarning(uc.race, uc.class)
  if (!existing) {
    return { op: 'insert', fields: rosterInsertFields(uc, realm), warning }
  }
  return { op: 'update', fields: rosterUpdateFields(uc, existing), warning }
}

/** Columns the sync planner reads. No note, no last_zone. */
export const ROSTER_SYNC_COLUMNS =
  'id, name, last_name, guid, class, race, sex, level, rank_index, rank_name, last_online_days, imported_from_grm, claimed_by, left_guild_at'

export type SyncDbRow = {
  id: string
  name: string
  last_name: string | null
  guid: string | null
  class: string
  race: string | null
  sex: string | null
  level: number
  rank_index: number | null
  rank_name: string | null
  last_online_days: number | null
  imported_from_grm: boolean | null
  claimed_by: string | null
  left_guild_at: string | null
}

export type SyncPlan = {
  inserts: { name: string; fields: Record<string, unknown>; warning: string | null; uc: UploadedChar }[]
  updates: { id: string; name: string; matchedBy: 'guid' | 'name'; changes: string[]; fields: Record<string, unknown>; warning: string | null; uc: UploadedChar }[]
  unchanged: number
  renames: { id: string; from: string; to: string }[]
  /** GRM rows on the site that are missing from a full upload. Flagged, never deleted. */
  leaving: { id: string; name: string; claimed: boolean }[]
  /** Member-made rows (never imported from GRM) that are not in the upload. Left alone. */
  notInGrm: { id: string; name: string; claimed: boolean }[]
  conflicts: { name: string; reason: string }[]
  duplicates: string[]
  leaveFlagBlocked: string | null
}

/**
 * Pure planner shared by /api/officers/roster-diff and roster-apply, so the
 * preview and the write always agree. It never plans a delete, never touches
 * claims, and only flags departures when the upload looks like a full roster.
 */
export function planRosterSync(uploadedRaw: UploadedChar[], dbChars: SyncDbRow[], realm: string): SyncPlan {
  const plan: SyncPlan = {
    inserts: [], updates: [], unchanged: 0, renames: [], leaving: [], notInGrm: [],
    conflicts: [], duplicates: [], leaveFlagBlocked: null,
  }

  // Drop duplicate rows inside the upload itself (same GUID or same folded name).
  const seenGuid = new Set<string>()
  const seenName = new Set<string>()
  const uploaded: UploadedChar[] = []
  for (const uc of uploadedRaw) {
    const g = cleanGuid(uc.guid)
    const k = identityKey(uc.name, uc.last_name)
    if ((g && seenGuid.has(g)) || seenName.has(k)) {
      plan.duplicates.push(displayUploaded(uc))
      continue
    }
    if (g) seenGuid.add(g)
    seenName.add(k)
    uploaded.push(uc)
  }

  const findMatch = buildMatcher(dbChars)
  const matchedIds = new Set<string>()
  const takenFirst = new Map<string, string>()
  for (const c of dbChars) takenFirst.set(firstNameKey(c.name), c.id)

  for (const uc of uploaded) {
    const m = findMatch(uc)
    const label = displayUploaded(uc)
    if (m.kind === 'conflict') {
      plan.conflicts.push({ name: label, reason: m.reason })
      continue
    }
    if (m.kind === 'none') {
      const fk = firstNameKey(uc.name)
      if (takenFirst.has(fk)) {
        plan.conflicts.push({ name: label, reason: 'first name already used by another site row (the table is unique on first name)' })
        continue
      }
      takenFirst.set(fk, 'new')
      const p = rosterWritePlan(uc, realm, null)
      plan.inserts.push({ name: label, fields: p.fields, warning: p.warning, uc })
      continue
    }
    const row = m.row
    if (matchedIds.has(row.id)) {
      plan.conflicts.push({ name: label, reason: 'matches a site row already matched by another upload row' })
      continue
    }
    matchedIds.add(row.id)
    const current = fullName(row.name, row.last_name)
    if (m.kind === 'guid' && identityKey(row.name, row.last_name) !== identityKey(uc.name, uc.last_name)) {
      plan.renames.push({ id: row.id, from: current, to: label })
    }
    const p = rosterWritePlan(uc, realm, row)
    const changes: string[] = []
    const f = p.fields
    if ('last_name' in f) changes.push(`Last name → ${f.last_name}`)
    if ('level' in f && f.level !== row.level) changes.push(`Level ${row.level} → ${f.level}`)
    if ('rank_index' in f && (f.rank_index !== row.rank_index || f.rank_name !== row.rank_name)) {
      changes.push(`Rank: ${row.rank_name ?? '?'} (${row.rank_index ?? '?'}) → ${f.rank_name} (${f.rank_index})`)
    }
    if ('class' in f && f.class !== row.class) changes.push(`Class ${row.class} → ${f.class}`)
    if ('race' in f && f.race !== row.race) changes.push(`Race ${row.race ?? '?'} → ${f.race}`)
    if ('sex' in f && f.sex !== row.sex) changes.push(`Sex → ${f.sex}`)
    if ('last_online_days' in f && f.last_online_days !== row.last_online_days) changes.push(`last online ${f.last_online_days}d`)
    if ('guid' in f) changes.push('GUID linked')
    if ('left_guild_at' in f) changes.push('Back in the guild')
    if (changes.length === 0) {
      plan.unchanged++
      continue
    }
    // Write only the fields that actually differ.
    const fields: Record<string, unknown> = { updated_at: f.updated_at }
    for (const [k, v] of Object.entries(f)) {
      if (k === 'updated_at') continue
      if ((row as Record<string, unknown>)[k] !== v || k === 'guid' || k === 'left_guild_at' || k === 'last_name') fields[k] = v
    }
    plan.updates.push({ id: row.id, name: label, matchedBy: m.kind, changes, fields, warning: p.warning, uc })
  }

  for (const c of dbChars) {
    if (matchedIds.has(c.id) || c.left_guild_at) continue
    const entry = { id: c.id, name: fullName(c.name, c.last_name), claimed: !!c.claimed_by }
    if (c.imported_from_grm || cleanGuid(c.guid)) plan.leaving.push(entry)
    else plan.notInGrm.push(entry)
  }

  // A partial upload must never mark half the guild as gone.
  const activeGrm = dbChars.filter((c) => !c.left_guild_at && (c.imported_from_grm || cleanGuid(c.guid))).length
  if (activeGrm > 0 && uploaded.length < activeGrm * 0.5) {
    plan.leaveFlagBlocked = `Upload has ${uploaded.length} characters but the site has ${activeGrm} active GRM rows, so nobody is marked as left.`
  }
  return plan
}
