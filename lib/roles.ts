import { canonicalClass } from '@/lib/guild-config';

export type LfgRole = 'Tank' | 'Healer' | 'DPS';
export type RoleKey = 'tank' | 'healer' | 'dps';

const BY_CLASS: Record<string, LfgRole[]> = {
  Warrior: ['Tank', 'DPS'],
  Paladin: ['Tank', 'Healer', 'DPS'],
  Druid: ['Tank', 'Healer', 'DPS'],
  Priest: ['Healer', 'DPS'],
  Shaman: ['Healer', 'DPS'],
  Hunter: ['DPS'],
  Rogue: ['DPS'],
  Mage: ['DPS'],
  Warlock: ['DPS'],
};

/** Roles a class can cover when the member has not chosen any. */
export function classRoles(cls: string | null | undefined): LfgRole[] {
  const name = canonicalClass(cls);
  if (!name) return ['DPS'];
  return BY_CLASS[name] ?? ['DPS'];
}

export function displayClassName(cls: string | null | undefined): string {
  return canonicalClass(cls) ?? (cls?.trim() || 'Adventurer');
}

export function parseRole(raw: string | null | undefined): LfgRole | null {
  if (!raw) return null;
  const name = raw.trim().toLowerCase();
  if (name === 'tank') return 'Tank';
  if (name === 'healer' || name === 'heals') return 'Healer';
  if (name === 'dps') return 'DPS';
  return null;
}

/** Flex and unknown signup roles take a DPS slot, matching the old form. */
export function roleKeyOf(role: string | null | undefined): RoleKey {
  const parsed = parseRole(role);
  if (parsed === 'Tank') return 'tank';
  if (parsed === 'Healer') return 'healer';
  return 'dps';
}

export function roleLabel(key: RoleKey): LfgRole {
  if (key === 'tank') return 'Tank';
  if (key === 'healer') return 'Healer';
  return 'DPS';
}

/**
 * Saved roles win when they are legal for the class.
 * An empty or all-illegal list falls back to the class default.
 */
export function effectiveRoles(cls: string | null | undefined, saved: string[] | null | undefined): LfgRole[] {
  const allowed = classRoles(cls);
  if (!saved?.length) return allowed;
  const picked = saved
    .map(parseRole)
    .filter((role): role is LfgRole => role != null && allowed.includes(role));
  return picked.length > 0 ? picked : allowed;
}
