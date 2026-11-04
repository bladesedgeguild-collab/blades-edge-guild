export const GUILD = {
  name: 'Blades Edge',
  established: 2023,
  game: 'WoW: Forever',
  faction: 'Alliance',
  ruleset: 'Roleplaying',       // Normal | PvP | Roleplaying | Hardcore
  launchAt: '2026-11-04T15:00:00-08:00', // WoW: Forever global launch, 3:00 PM PST
  maxLevel: 60,                 // adjust if Blizzard confirms otherwise
  foundersGoal: 50,
}

// Alliance race -> class rules. WoW: Forever is built on original WoW, so default to
// the original Alliance combos (no Draenei). Keep this the ONLY place these rules live.
export const RACE_CLASSES: Record<string, string[]> = {
  Human:       ['Warrior', 'Paladin', 'Rogue', 'Priest', 'Mage', 'Warlock'],
  Dwarf:       ['Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest'],
  'Night Elf': ['Warrior', 'Hunter', 'Rogue', 'Priest', 'Druid'],
  Gnome:       ['Warrior', 'Rogue', 'Mage', 'Warlock'],
}
