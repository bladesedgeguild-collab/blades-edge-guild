import { allianceComboWarning } from '@/lib/guild-config'
import { nameKey, normalizeForSearch, splitRosterName, fullName } from '@/lib/names'

/** One member row as uploaded on /officers (from the GRM .lua parser or a JSON file). */
export type UploadedChar = {
  name: string
  last_name?: string | null
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

/** Make sure every uploaded row has a separate first + last name. */
export function normalizeUploaded(list: UploadedChar[]): UploadedChar[] {
  const out: UploadedChar[] = []
  for (const uc of list) {
    if (!uc?.name || typeof uc.name !== 'string' || !uc.name.trim()) continue
    if (uc.last_name && uc.last_name.trim()) {
      out.push({ ...uc, name: uc.name.trim(), last_name: uc.last_name.trim() })
    } else {
      const { name, last_name } = splitRosterName(uc.name)
      if (!name) continue
      out.push({ ...uc, name, last_name })
    }
  }
  return out
}

type Named = { id: string; name: string; last_name: string | null }

/**
 * Index DB characters for matching. Primary key is the full first+last name.
 * Legacy rows without a last name (or uploads without one) fall back to a
 * first-name match, but only when that first name is unique, so we never
 * merge two different people.
 */
export function buildMatcher<T extends Named>(dbChars: T[]) {
  const byFull = new Map<string, T>()
  const byFirst = new Map<string, T[]>()
  for (const c of dbChars) {
    if (c.last_name) byFull.set(nameKey(c.name, c.last_name), c)
    const f = normalizeForSearch(c.name)
    byFirst.set(f, [...(byFirst.get(f) ?? []), c])
  }
  return (uc: UploadedChar): T | undefined => {
    if (uc.last_name) {
      const hit = byFull.get(nameKey(uc.name, uc.last_name))
      if (hit) return hit
      // Legacy DB row stored without a last name
      const firsts = (byFirst.get(normalizeForSearch(uc.name)) ?? []).filter((c) => !c.last_name)
      return firsts.length === 1 ? firsts[0] : undefined
    }
    const firsts = byFirst.get(normalizeForSearch(uc.name)) ?? []
    return firsts.length === 1 ? firsts[0] : undefined
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

/** Fields written for a brand-new roster row. Public note and zone are never included. */
export function rosterInsertFields(uc: UploadedChar, realm: string): Record<string, unknown> {
  return {
    name: uc.name,
    last_name: uc.last_name ?? null,
    realm,
    class: (uc.class ?? 'WARRIOR').toUpperCase(),
    race: uc.race ?? null,
    sex: normaliseSex(uc.sex),
    level: uc.level ?? 1,
    rank_index: uc.rank_index ?? null,
    rank_name: uc.rank_name ?? null,
    last_online_days: uc.last_online_days ?? 9999,
    status: 'new',
    imported_from_grm: true,
    hide_from_roster: false,
    is_main: true,
  }
}

/**
 * Roster facts updated on a row that already exists. Claim columns stay off
 * this object, and so do the public note and last zone.
 */
export function rosterUpdateFields(
  uc: UploadedChar,
  match: { last_name: string | null },
): Record<string, unknown> {
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
  const sex = normaliseSex(uc.sex)
  if (sex) updateData.sex = sex
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
  existing: { last_name: string | null } | null,
): RosterWritePlan {
  const warning = allianceComboWarning(uc.race, uc.class)
  if (!existing) {
    return { op: 'insert', fields: rosterInsertFields(uc, realm), warning }
  }
  return { op: 'update', fields: rosterUpdateFields(uc, existing), warning }
}
