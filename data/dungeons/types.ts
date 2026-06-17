export type DungeonContinent = 'Eastern Kingdoms' | 'Kalimdor' | 'Outland';
export type DungeonDifficulty = 'normal' | 'heroic' | 'both';
export type QuestImportance = 'must-grab' | 'nice-to-have' | 'chain-unlock' | 'skip' | 'heroic-attunement';
export type LootRating = 'bis' | 'prebis' | 'excellent' | 'good' | 'usable' | 'offspec' | 'skip';
export type WoWClass = 'Warrior' | 'Paladin' | 'Hunter' | 'Rogue' | 'Priest' | 'Mage' | 'Warlock' | 'Druid' | 'Shaman';

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
  heroicRequiresLevel?: number;
  difficulty: DungeonDifficulty;
  maxPlayers: 5 | 10 | 40;
  estimatedTimeMinutes: number;
  summary: string;
  specialMechanic?: string;
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
  sourceStatus: 'placeholder' | 'draft' | 'source-checked' | 'verified';
}
