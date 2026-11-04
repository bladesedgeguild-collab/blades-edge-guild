/** Shared helpers for WoW: Forever first + last character names. */

export function fullName(first: string | null | undefined, last?: string | null): string {
  return [first?.trim(), last?.trim()].filter(Boolean).join(' ')
}

/** Lowercase + fold accented letters so "Ðeerføx" matches "deerfox". */
export function normalizeForSearch(str: string): string {
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
    .replace(/\s+/g, ' ')
    .trim()
}

/** Matching key for a first + last name pair. */
export function nameKey(first: string | null | undefined, last?: string | null): string {
  return normalizeForSearch(fullName(first, last))
}

const KNOWN_REALM_SUFFIXES = ['forever']

/**
 * Split a roster name into first / last.
 * Handles "First Last", "First Last-forever", "First-Last" and "First".
 */
export function splitRosterName(raw: string): { name: string; last_name: string | null } {
  let s = raw.trim()
  // Strip a trailing realm suffix like "-forever" or "-Forever"
  const dash = s.lastIndexOf('-')
  if (dash > 0) {
    const suffix = s.slice(dash + 1)
    if (s.includes(' ') || KNOWN_REALM_SUFFIXES.includes(suffix.toLowerCase())) {
      // "First Last-Realm" → drop realm
      s = s.slice(0, dash).trim()
    } else {
      // "First-Last" → treat the dash as the separator
      s = `${s.slice(0, dash)} ${suffix}`.trim()
    }
  }
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { name: '', last_name: null }
  if (parts.length === 1) return { name: parts[0], last_name: null }
  return { name: parts[0], last_name: parts.slice(1).join(' ') }
}
