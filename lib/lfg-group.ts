import { LEVEL_FIT_MARGIN } from '@/lib/level-fit';
import type { RoleKey } from '@/lib/roles';

export type Needs = Record<RoleKey, number>;

export type GroupMember = {
  name: string;
  level?: number;
  characterId?: string;
};

export type Group = Record<RoleKey, Array<GroupMember | string>>;

export function memberName(member: GroupMember | string): string {
  return typeof member === 'string' ? member : member.name;
}

export function memberLevel(member: GroupMember | string): number | null {
  if (typeof member === 'string' || typeof member.level !== 'number') return null;
  return member.level;
}

export function normalizeGroup(raw: unknown): Group {
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const list = (key: RoleKey): Array<GroupMember | string> => {
    const value = source[key];
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is GroupMember | string => {
      if (typeof item === 'string') return item.length > 0;
      return !!item && typeof item === 'object' && typeof (item as { name?: unknown }).name === 'string';
    });
  };
  return { tank: list('tank'), healer: list('healer'), dps: list('dps') };
}

export function resolveNeeds(raw: unknown, fallback: Needs): Needs {
  if (!raw || typeof raw !== 'object') return { ...fallback };
  const source = raw as Record<string, unknown>;
  const num = (key: RoleKey) => {
    const value = Number(source[key]);
    if (!Number.isInteger(value) || value < 0 || value > 40) return fallback[key];
    return value;
  };
  return { tank: num('tank'), healer: num('healer'), dps: num('dps') };
}

/** Keep the poster's role filled and the total inside the instance size. */
export function clampNeeds(needs: Needs, maxPlayers: number, takenRole: RoleKey): Needs {
  const next: Needs = { ...needs };
  next[takenRole] = Math.max(1, next[takenRole]);
  let sum = next.tank + next.healer + next.dps;
  const order: RoleKey[] = ['dps', 'healer', 'tank'];
  for (const key of order) {
    while (sum > maxPlayers && next[key] > (key === takenRole ? 1 : 0)) {
      next[key] -= 1;
      sum -= 1;
    }
  }
  return next;
}

export function openCounts(needs: Needs, group: Group): Needs {
  return {
    tank: Math.max(0, needs.tank - group.tank.length),
    healer: Math.max(0, needs.healer - group.healer.length),
    dps: Math.max(0, needs.dps - group.dps.length),
  };
}

export function isGroupFull(needs: Needs, group: Group): boolean {
  const open = openCounts(needs, group);
  return open.tank + open.healer + open.dps === 0;
}

export function needsSummary(needs: Needs, group: Group): string {
  const open = openCounts(needs, group);
  const parts: string[] = [];
  if (open.tank) parts.push(open.tank === 1 ? 'a Tank' : `${open.tank} Tanks`);
  if (open.healer) parts.push(open.healer === 1 ? 'a Healer' : `${open.healer} Healers`);
  if (open.dps) parts.push(open.dps === 1 ? 'a DPS' : `${open.dps} DPS`);
  if (parts.length === 0) return 'Group is full.';
  if (parts.length === 1) return `Needs ${parts[0]}.`;
  return `Needs ${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}.`;
}

function sameMember(member: GroupMember | string, incoming: GroupMember): boolean {
  if (typeof member === 'string') return member === incoming.name;
  if (incoming.characterId && member.characterId && member.characterId === incoming.characterId) return true;
  return member.name === incoming.name;
}

export function claimSlot(
  group: Group,
  needs: Needs,
  role: RoleKey,
  member: GroupMember,
): { ok: true; group: Group } | { ok: false; reason: 'full' } {
  const next: Group = {
    tank: [...group.tank],
    healer: [...group.healer],
    dps: [...group.dps],
  };
  const already = (['tank', 'healer', 'dps'] as RoleKey[]).some(key => next[key].some(existing => sameMember(existing, member)));
  if (already) return { ok: true, group };
  if (next[role].length >= needs[role]) return { ok: false, reason: 'full' };
  next[role] = [...next[role], member];
  return { ok: true, group: next };
}

/**
 * Forever's party rule: one member far above the dungeon removes kill XP for everyone.
 * The threshold matches the finder's outleveled margin.
 */
export function partyXpWarning(levels: Array<number | null | undefined>, recommendedLevelMax: number): string | null {
  const known = levels.filter((level): level is number => typeof level === 'number');
  if (!known.some(level => level > recommendedLevelMax + LEVEL_FIT_MARGIN)) return null;
  return 'A high-level member is far above this dungeon. In Forever, their kills give no experience to anyone in the group.';
}
