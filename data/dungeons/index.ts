import type { Dungeon, DungeonBoss, DungeonContinent, DungeonDifficulty, InstanceType, SourceStatus } from './types';
import catalog from './forever-dungeons.json' with { type: 'json' };

type RawDungeon = {
  id: string;
  name: string;
  shortName: string;
  continent: DungeonContinent;
  zone: string;
  hub?: string | null;
  factionFocus: Dungeon['factionFocus'];
  minLevel: number;
  recommendedLevelMin: number;
  recommendedLevelMax: number;
  groupFinderRange?: [number, number] | null;
  difficulty: string;
  maxPlayers: 5 | 10 | 20 | 40;
  instanceType: InstanceType;
  isNewInForever: boolean;
  availableNow: boolean;
  availableFrom?: string;
  estimatedTimeMinutes: number | null;
  summary: string;
  specialMechanic?: string | null;
  tips?: string[];
  bosses?: string[];
  uncertain?: string[];
  sources?: string[];
  tags?: string[];
  groupComp: { tank: number; healer: number; dps: number; notes?: string };
  quests?: Dungeon['quests'];
  loot?: Dungeon['loot'];
  sourceStatus?: SourceStatus;
};

function sourcedRequirement(raw: RawDungeon): string | undefined {
  const text = raw.specialMechanic ?? '';
  if (/drakefire amulet/i.test(text)) return text;
  if (/attunement required/i.test(text)) return text;
  return undefined;
}

function mapBosses(raw: RawDungeon): DungeonBoss[] {
  const names = raw.bosses ?? [];
  if (names.length === 0) return [];
  const unconfirmed = (raw.uncertain ?? []).some(note => /boss/i.test(note));
  return names.map((name, index) => ({
    name,
    order: index + 1,
    quickTips: [],
    unconfirmed,
  }));
}

function mapOne(raw: RawDungeon): Dungeon {
  const groupComp = raw.id === 'upper-blackrock-spire'
    ? {
        tank: 2,
        healer: 3,
        dps: 5,
        notes: 'Suggested 10-player group. The client lists this wing at 10 players.',
      }
    : { ...raw.groupComp };

  const difficulty: DungeonDifficulty = raw.difficulty === 'both' ? 'both' : 'normal';

  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.shortName,
    continent: raw.continent,
    zone: raw.zone,
    hub: raw.hub ?? undefined,
    factionFocus: raw.factionFocus,
    minLevel: raw.minLevel,
    recommendedLevelMin: raw.recommendedLevelMin,
    recommendedLevelMax: raw.recommendedLevelMax,
    groupFinderRange: raw.groupFinderRange ?? null,
    difficulty,
    maxPlayers: raw.maxPlayers,
    instanceType: raw.instanceType,
    isNewInForever: raw.isNewInForever,
    availableNow: raw.availableNow,
    availableFrom: raw.availableFrom,
    estimatedTimeMinutes: raw.estimatedTimeMinutes,
    summary: raw.summary,
    specialMechanic: raw.specialMechanic ?? undefined,
    requirement: sourcedRequirement(raw),
    tips: raw.tips ?? [],
    uncertain: raw.uncertain ?? [],
    sources: raw.sources ?? [],
    hiddenForAlliance: raw.id === 'ragefire-chasm',
    groupComp,
    quests: raw.quests ?? [],
    bosses: mapBosses(raw),
    loot: raw.loot ?? [],
    tags: raw.tags ?? [],
    sourceStatus: raw.sourceStatus ?? 'source-checked',
  };
}

/** Every Forever instance, including Horde-only Ragefire Chasm. */
export const ALL_DUNGEONS: Dungeon[] = (catalog.dungeons as RawDungeon[]).map(mapOne);

/** Alliance finder list. Ragefire Chasm stays in ALL_DUNGEONS and is omitted here. */
export const DUNGEONS: Dungeon[] = ALL_DUNGEONS.filter(dungeon => !dungeon.hiddenForAlliance);

export function getDungeon(id: string): Dungeon | undefined {
  return ALL_DUNGEONS.find(dungeon => dungeon.id === id);
}

export function getDungeonsByContinent(continent: string): Dungeon[] {
  if (continent === 'All') return DUNGEONS;
  return DUNGEONS.filter(dungeon => dungeon.continent === continent);
}

export function opensOnLabel(dungeon: Pick<Dungeon, 'availableNow' | 'availableFrom'>): string | null {
  if (dungeon.availableNow || !dungeon.availableFrom) return null;
  const [year, month, day] = dungeon.availableFrom.split('-').map(Number);
  if (!year || !month || !day) return null;
  const label = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `Opens ${label}`;
}
