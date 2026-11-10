import { canonicalClass, canonicalRace } from '@/lib/guild-config'

/** Filename token for a canonical race. Night Elf files are NightElf_*.png. */
const RACE_FILE: Record<string, string> = {
  Human: 'Human',
  Dwarf: 'Dwarf',
  'Night Elf': 'NightElf',
  Gnome: 'Gnome',
  Skyborne: 'Skyborne',
}

/**
 * Filename token for a canonical class.
 * Warlock files keep the existing Lock token (Human_Lock_M.png).
 */
const CLASS_FILE: Record<string, string> = {
  Druid: 'Druid',
  Mage: 'Mage',
  Warrior: 'Warrior',
  Paladin: 'Paladin',
  Priest: 'Priest',
  Hunter: 'Hunter',
  Rogue: 'Rogue',
  Warlock: 'Lock',
  Shaman: 'Shaman',
}

/**
 * Wireframe paths for a race and class. Returns the URL even when the PNG
 * is not in the repo yet (the 16 Forever images). Callers must hide the
 * image if it fails to load. Unknown races, including removed ones, return null.
 */
export function getCharacterArt(
  race: string | null,
  characterClass: string | null
): { male: string; female: string } | null {
  const raceName = canonicalRace(race)
  const className = canonicalClass(characterClass)
  if (!raceName || !className) return null
  const racePart = RACE_FILE[raceName]
  const classPart = CLASS_FILE[className]
  if (!racePart || !classPart) return null
  return {
    male: `/images/characters/${racePart}_${classPart}_M.png`,
    female: `/images/characters/${racePart}_${classPart}_F.png`,
  }
}
