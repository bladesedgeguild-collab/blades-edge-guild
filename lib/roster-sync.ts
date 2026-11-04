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

export function normaliseSex(raw: unknown): string | null {
  // Same numeric convention the old JSON import used (1 = male, 2 = female)
  if (raw === 1 || raw === '1') return 'Male'
  if (raw === 2 || raw === '2') return 'Female'
  if (typeof raw === 'string') {
    const l = raw.toLowerCase()
    if (l === 'male') return 'Male'
    if (l === 'female') return 'Female'
  }
  return null
}
