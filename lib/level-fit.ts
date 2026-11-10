import { GUILD } from '@/lib/guild-config';

export type LevelFit = 'locked' | 'underleveled' | 'active' | 'outleveled' | 'no-xp';

/** Levels past the recommended max still count as in-range, then fall off. */
export const LEVEL_FIT_MARGIN = 5;

export type LevelBand = {
  minLevel: number;
  recommendedLevelMin: number;
  recommendedLevelMax: number;
};

/**
 * One level rule for the finder cards and the site banner.
 * Locked means the door will not open. Green (`active`) is the recommended
 * window. At the level cap, outleveled runs stay listed for loot and quests.
 */
export function levelFit(dungeon: LevelBand, level: number, cap = GUILD.maxLevel): LevelFit {
  const lvl = Number.isFinite(level) ? level : 1;
  if (lvl < dungeon.minLevel) return 'locked';
  if (lvl < dungeon.recommendedLevelMin) return 'underleveled';
  if (lvl <= dungeon.recommendedLevelMax + LEVEL_FIT_MARGIN) return 'active';
  if (lvl >= cap) return 'no-xp';
  return 'outleveled';
}

export function levelFitLabel(status: LevelFit, dungeon: LevelBand): string | null {
  if (status === 'locked') return `Requires Level ${dungeon.minLevel}`;
  if (status === 'underleveled') return `Below recommended · door opens at ${dungeon.minLevel}`;
  if (status === 'no-xp') return 'No XP (loot, quests or attunement only)';
  return null;
}

/** Banner matching uses the same green window as the finder. */
export function isGreenFit(status: LevelFit): boolean {
  return status === 'active';
}
