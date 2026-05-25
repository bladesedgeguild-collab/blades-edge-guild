const RACE_MAP: Record<string, string> = {
  'Night Elf': 'NightElf',
  'NightElf': 'NightElf',
  'Draenei': 'Draenei',
  'Dwarf': 'Dwarf',
  'Gnome': 'Gnome',
  'Human': 'Human',
}

// Files use title-case class names, except Warlock → Lock
const CLASS_MAP: Record<string, string> = {
  'Warlock': 'Lock',
  'Hunter': 'Hunter',
  'Mage': 'Mage',
  'Paladin': 'Paladin',
  'Priest': 'Priest',
  'Rogue': 'Rogue',
  'Warrior': 'Warrior',
  'Shaman': 'Shaman',
  'Druid': 'Druid',
}

// Handles both DB-uppercase ('WARRIOR') and form title-case ('Warrior') inputs
function toTitleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export function getCharacterArt(
  race: string | null,
  characterClass: string | null
): { male: string; female: string } | null {
  if (!race || !characterClass) return null
  const racePart = RACE_MAP[race]
  if (!racePart) return null
  const classPart = CLASS_MAP[toTitleCase(characterClass)]
  if (!classPart) return null
  return {
    male: `/images/characters/${racePart}_${classPart}_M.png`,
    female: `/images/characters/${racePart}_${classPart}_F.png`,
  }
}
