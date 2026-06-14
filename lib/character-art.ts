const RACE_MAP: Record<string, string> = {
  'Night Elf': 'NightElf',
  'NightElf': 'NightElf',
  'night elf': 'NightElf',
  'Draenei': 'Draenei',
  'draenei': 'Draenei',
  'Dwarf': 'Dwarf',
  'dwarf': 'Dwarf',
  'Gnome': 'Gnome',
  'gnome': 'Gnome',
  'Human': 'Human',
  'human': 'Human',
}

const CLASS_MAP: Record<string, string> = {
  'DRUID': 'Druid',    'Druid': 'Druid',
  'MAGE': 'Mage',      'Mage': 'Mage',
  'WARRIOR': 'Warrior','Warrior': 'Warrior',
  'PALADIN': 'Paladin','Paladin': 'Paladin',
  'PRIEST': 'Priest',  'Priest': 'Priest',
  'HUNTER': 'Hunter',  'Hunter': 'Hunter',
  'ROGUE': 'Rogue',    'Rogue': 'Rogue',
  'WARLOCK': 'Lock',   'Warlock': 'Lock',
  'SHAMAN': 'Shaman',  'Shaman': 'Shaman',
}

export function getCharacterArt(
  race: string | null,
  characterClass: string | null
): { male: string; female: string } | null {
  if (!race || !characterClass) return null
  const racePart = RACE_MAP[race]
  if (!racePart) return null
  const classPart = CLASS_MAP[characterClass]
  if (!classPart) return null
  return {
    male: `/images/characters/${racePart}_${classPart}_M.png`,
    female: `/images/characters/${racePart}_${classPart}_F.png`,
  }
}
