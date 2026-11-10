import { levelFit, type LevelBand } from '@/lib/level-fit';
import { openCounts, type Needs } from '@/lib/lfg-group';
import { displayClassName, effectiveRoles, roleKeyOf, type LfgRole } from '@/lib/roles';

export type BannerChar = {
  id: string;
  name: string;
  className: string;
  level: number;
  isMain: boolean;
  savedRoles: string[] | null;
};

export type BannerMatch = BannerChar & {
  role: LfgRole;
  openRoles: LfgRole[];
};

/** Characters in the green level window who can fill a slot that is still open. */
export function bannerMatches(chars: BannerChar[], dungeon: LevelBand, open: Needs): BannerMatch[] {
  const rows: BannerMatch[] = [];
  for (const character of chars) {
    if (levelFit(dungeon, character.level) !== 'active') continue;
    const roles = effectiveRoles(character.className, character.savedRoles);
    const openRoles = roles.filter(role => open[roleKeyOf(role)] > 0);
    if (openRoles.length === 0) continue;
    rows.push({
      ...character,
      className: displayClassName(character.className),
      role: openRoles[0],
      openRoles,
    });
  }
  rows.sort((a, b) => Number(b.isMain) - Number(a.isMain) || b.level - a.level);
  return rows;
}

export const DISCORD_DAILY_CAP = 8;

export type MentionChar = BannerChar & {
  userId: string;
  discordId: string | null;
};

export type DiscordMention = {
  userId: string;
  discordId: string;
  characterId: string;
  name: string;
  role: LfgRole;
  level: number;
  className: string;
};

const SNOWFLAKE = /^\d{5,22}$/;

/**
 * One Discord ping per opted-in member, never the poster, never twice for the same post.
 * `matchIdsByUser` null means every claimed character; an array limits the set.
 */
export function discordMentions(input: {
  posterId: string;
  chars: MentionChar[];
  allowedUserIds: Set<string>;
  matchIdsByUser: Map<string, string[] | null>;
  dungeon: LevelBand;
  needs: Needs;
  groupCounts: Needs;
  already: Set<string>;
  recentCounts: Map<string, number>;
  cap?: number;
}): DiscordMention[] {
  const cap = input.cap ?? DISCORD_DAILY_CAP;
  const open = openCounts(input.needs, {
    tank: Array.from({ length: input.groupCounts.tank }, () => 'filled'),
    healer: Array.from({ length: input.groupCounts.healer }, () => 'filled'),
    dps: Array.from({ length: input.groupCounts.dps }, () => 'filled'),
  });
  const byUser = new Map<string, MentionChar[]>();
  for (const character of input.chars) {
    if (character.userId === input.posterId) continue;
    if (!input.allowedUserIds.has(character.userId)) continue;
    if (!character.discordId || !SNOWFLAKE.test(character.discordId)) continue;
    if (input.already.has(character.userId)) continue;
    if ((input.recentCounts.get(character.userId) ?? 0) >= cap) continue;
    const allowList = input.matchIdsByUser.get(character.userId);
    if (allowList && !allowList.includes(character.id)) continue;
    const list = byUser.get(character.userId) ?? [];
    list.push(character);
    byUser.set(character.userId, list);
  }

  const mentions: DiscordMention[] = [];
  for (const [userId, chars] of byUser) {
    const matches = bannerMatches(chars, input.dungeon, open);
    const best = matches[0];
    if (!best) continue;
    const discordId = chars.find(character => character.id === best.id)?.discordId;
    if (!discordId) continue;
    mentions.push({
      userId,
      discordId,
      characterId: best.id,
      name: best.name,
      role: best.role,
      level: best.level,
      className: best.className,
    });
  }
  return mentions;
}
