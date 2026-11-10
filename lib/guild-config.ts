export const GUILD = {
  name: 'Blades Edge',
  established: 2023,
  game: 'WoW: Forever',
  faction: 'Alliance',
  ruleset: 'Roleplaying',       // Normal | PvP | Roleplaying | Hardcore
  launchAt: '2026-11-04T15:00:00-08:00', // WoW: Forever global launch, 3:00 PM PST
  maxLevel: 60,                 // adjust if Blizzard confirms otherwise
  foundersGoal: 50,
  guildMaster: 'Avatar Odys',  // GM's WoW: Forever character (first Avatar, last Odys)
}

// Alliance race -> class rules for WoW: Forever. Keep this the ONLY place these rules live.
// Skyborne here is the Alliance High Order (Mage, not Shaman).
// Sources: Blizzard, "Create the Hero You Want to Be" (24 Sep 2026) and
// "Meet the New Skyborne" (the race name and High Order class list).
export const RACE_CLASSES: Record<string, string[]> = {
  Human:       ['Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest', 'Mage', 'Warlock'],
  Dwarf:       ['Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest', 'Shaman'],
  'Night Elf': ['Warrior', 'Hunter', 'Rogue', 'Priest', 'Druid'],
  Gnome:       ['Warrior', 'Rogue', 'Priest', 'Mage', 'Warlock'],
  Skyborne:    ['Warrior', 'Hunter', 'Rogue', 'Mage', 'Druid'],
}

const RACE_CANON: Record<string, string> = {
  human: 'Human',
  dwarf: 'Dwarf',
  gnome: 'Gnome',
  nightelf: 'Night Elf',
  skyborne: 'Skyborne',
  skyborn: 'Skyborne',
}

const CLASS_CANON: Record<string, string> = {
  warrior: 'Warrior',
  paladin: 'Paladin',
  hunter: 'Hunter',
  rogue: 'Rogue',
  priest: 'Priest',
  shaman: 'Shaman',
  mage: 'Mage',
  warlock: 'Warlock',
  druid: 'Druid',
}

function compactToken(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z]/g, '')
}

/** Picker label for a race string, including GRM's NightElf and Skyborn spellings. */
export function canonicalRace(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  return RACE_CANON[compactToken(raw)] ?? null
}

export function canonicalClass(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  return CLASS_CANON[compactToken(raw)] ?? null
}

/** Label to show players. Unknown strings pass through unchanged. */
export function displayRace(race: string | null | undefined): string | null {
  if (!race?.trim()) return null
  return canonicalRace(race) ?? race.trim()
}

export function isAllianceCombo(race: string | null | undefined, cls: string | null | undefined): boolean {
  const raceName = canonicalRace(race)
  const className = canonicalClass(cls)
  if (!raceName || !className) return false
  return RACE_CLASSES[raceName].includes(className)
}

/**
 * Soft check for a roster import. Returns null when the row is allowed or
 * incomplete. A message means the row is outside the Alliance matrix and
 * must still be imported.
 */
export function allianceComboWarning(race: string | null | undefined, cls: string | null | undefined): string | null {
  if (!race?.trim() || !cls?.trim()) return null
  if (isAllianceCombo(race, cls)) return null
  const raceLabel = canonicalRace(race) ?? race.trim()
  const classLabel = canonicalClass(cls) ?? cls.trim()
  return `${raceLabel} ${classLabel} is outside the Alliance matrix and was kept`
}
