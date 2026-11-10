export type DungeonContinent = 'Eastern Kingdoms' | 'Kalimdor';
export type DungeonDifficulty = 'normal' | 'both';
export type QuestImportance = 'must-grab' | 'nice-to-have' | 'chain-unlock' | 'skip';
export type LootRating = 'bis' | 'prebis' | 'excellent' | 'good' | 'usable' | 'offspec' | 'skip';
export type WoWClass = 'Warrior' | 'Paladin' | 'Hunter' | 'Rogue' | 'Priest' | 'Mage' | 'Warlock' | 'Druid' | 'Shaman';
export type InstanceType = 'dungeon' | 'raid';
export type SourceStatus = 'placeholder' | 'draft' | 'source-checked' | 'verified';

export interface DungeonQuest {
  name: string;
  faction: 'Alliance' | 'Horde' | 'Both';
  requiredLevel: number;
  startsAt: string;
  importance: QuestImportance;
  prereqSummary?: string;
  rewardNote?: string;
  shareable?: boolean;
}

export interface DungeonBoss {
  name: string;
  order: number;
  quickTips: string[];
  tankTip?: string;
  healerTip?: string;
  dpsTip?: string;
  wipeRisk?: 'low' | 'medium' | 'high';
  /** Name came from a low-confidence source. Shown without invented tips. */
  unconfirmed?: boolean;
}

export interface LootItem {
  itemId?: number;
  name: string;
  boss: string;
  slot: string;
  difficulty: DungeonDifficulty;
  relevance: Partial<Record<WoWClass, { rating: LootRating; reason: string; specs?: string[] }>>;
}

export interface Dungeon {
  id: string;
  name: string;
  shortName: string;
  continent: DungeonContinent;
  zone: string;
  hub?: string;
  factionFocus: 'Alliance' | 'Horde' | 'Both';
  minLevel: number;
  recommendedLevelMin: number;
  recommendedLevelMax: number;
  /** In-game Group Finder range when it differs from the recommended range. */
  groupFinderRange?: [number, number] | null;
  difficulty: DungeonDifficulty;
  maxPlayers: 5 | 10 | 20 | 40;
  instanceType: InstanceType;
  isNewInForever: boolean;
  availableNow: boolean;
  /** YYYY-MM-DD. Set for raids that are not open yet. */
  availableFrom?: string;
  estimatedTimeMinutes: number | null;
  summary: string;
  specialMechanic?: string;
  /** Sourced door requirement (Dalaran attunement, Drakefire Amulet). */
  requirement?: string;
  tips: string[];
  uncertain: string[];
  sources: string[];
  /** Horde-only instances stay in the data and off the Alliance finder. */
  hiddenForAlliance: boolean;
  groupComp: {
    tank: number;
    healer: number;
    dps: number;
    notes?: string;
    usefulClasses?: WoWClass[];
  };
  quests: DungeonQuest[];
  bosses: DungeonBoss[];
  loot: LootItem[];
  tags: string[];
  wowheadUrl?: string;
  sourceStatus: SourceStatus;
}
