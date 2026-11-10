import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import { getCharacterArt } from '@/lib/character-art'
import { extractGuildMembers } from '@/lib/grm-parse'
import {
  RACE_CLASSES,
  allianceComboWarning,
  canonicalRace,
  displayRace,
  isAllianceCombo,
} from '@/lib/guild-config'
import { normaliseSex, rosterWritePlan, type UploadedChar } from '@/lib/roster-sync'

const ROOT = path.resolve(import.meta.dirname, '..')

const FOREVER_MATRIX: Record<string, string[]> = {
  Human: ['Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest', 'Mage', 'Warlock'],
  Dwarf: ['Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest', 'Shaman'],
  'Night Elf': ['Warrior', 'Hunter', 'Rogue', 'Priest', 'Druid'],
  Gnome: ['Warrior', 'Rogue', 'Priest', 'Mage', 'Warlock'],
  Skyborne: ['Warrior', 'Hunter', 'Rogue', 'Mage', 'Druid'],
}

const NEW_WIREFRAMES = [
  'Human_Hunter',
  'Dwarf_Shaman',
  'Gnome_Priest',
  'Skyborne_Druid',
  'Skyborne_Hunter',
  'Skyborne_Mage',
  'Skyborne_Rogue',
  'Skyborne_Warrior',
]

const RACE_FILE: Record<string, string> = {
  Human: 'Human',
  Dwarf: 'Dwarf',
  'Night Elf': 'NightElf',
  Gnome: 'Gnome',
  Skyborne: 'Skyborne',
}

const CLASS_FILE: Record<string, string> = {
  Warrior: 'Warrior',
  Paladin: 'Paladin',
  Hunter: 'Hunter',
  Rogue: 'Rogue',
  Priest: 'Priest',
  Shaman: 'Shaman',
  Mage: 'Mage',
  Warlock: 'Lock',
  Druid: 'Druid',
}

describe('WoW Forever Alliance matrix', () => {
  it('matches the Blizzard Alliance table, with Skyborne spelled Skyborne', () => {
    assert.deepEqual(RACE_CLASSES, FOREVER_MATRIX)
    assert.equal(Object.hasOwn(RACE_CLASSES, 'Draenei'), false)
    assert.equal(RACE_CLASSES.Skyborne.includes('Shaman'), false)
    assert.equal(RACE_CLASSES.Skyborne.includes('Mage'), true)
    assert.equal(RACE_CLASSES.Human.includes('Hunter'), true)
    assert.equal(RACE_CLASSES.Dwarf.includes('Shaman'), true)
    assert.equal(RACE_CLASSES.Gnome.includes('Priest'), true)
  })

  it('accepts GRM spellings and shows Skyborn as Skyborne', () => {
    assert.equal(canonicalRace('NightElf'), 'Night Elf')
    assert.equal(canonicalRace('Skyborn'), 'Skyborne')
    assert.equal(displayRace('Skyborn'), 'Skyborne')
    assert.equal(displayRace('Skyborne'), 'Skyborne')
    assert.equal(isAllianceCombo('NightElf', 'HUNTER'), true)
    assert.equal(isAllianceCombo('Skyborn', 'DRUID'), true)
    assert.equal(isAllianceCombo('Skyborne', 'SHAMAN'), false)
    assert.equal(isAllianceCombo('Human', 'HUNTER'), true)
    assert.equal(isAllianceCombo('Dwarf', 'SHAMAN'), true)
    assert.equal(isAllianceCombo('Gnome', 'PRIEST'), true)
  })

  it('maps every allowed combo, including the 16 new wireframes', () => {
    for (const [race, classes] of Object.entries(RACE_CLASSES)) {
      for (const cls of classes) {
        const art = getCharacterArt(race, cls)
        const stem = `${RACE_FILE[race]}_${CLASS_FILE[cls]}`
        assert.equal(art?.male, `/images/characters/${stem}_M.png`)
        assert.equal(art?.female, `/images/characters/${stem}_F.png`)
      }
    }
    for (const stem of NEW_WIREFRAMES) {
      const [race, cls] = stem.split('_')
      const art = getCharacterArt(race, cls)
      assert.equal(art?.male, `/images/characters/${stem}_M.png`)
      assert.equal(art?.female, `/images/characters/${stem}_F.png`)
      assert.equal(existsSync(path.join(ROOT, 'public/images/characters', `${stem}_M.png`)), true, `${stem}_M.png`)
      assert.equal(existsSync(path.join(ROOT, 'public/images/characters', `${stem}_F.png`)), true, `${stem}_F.png`)
    }
    assert.equal(getCharacterArt('Human', 'Warlock')?.male, '/images/characters/Human_Lock_M.png')
    assert.equal(getCharacterArt('NightElf', 'Hunter')?.female, '/images/characters/NightElf_Hunter_F.png')
    assert.equal(getCharacterArt('Draenei', 'Mage'), null)
    assert.equal(getCharacterArt('draenei', 'SHAMAN'), null)
  })
})

describe('GRM UnitSex', () => {
  it('maps 2 to male and 3 to female', () => {
    assert.equal(normaliseSex(2), 'Male')
    assert.equal(normaliseSex('2'), 'Male')
    assert.equal(normaliseSex(3), 'Female')
    assert.equal(normaliseSex('3'), 'Female')
    assert.equal(normaliseSex('male'), 'Male')
    assert.equal(normaliseSex('Female'), 'Female')
    assert.equal(normaliseSex(1), null)
    assert.equal(normaliseSex('1'), null)
    assert.notEqual(normaliseSex(2), 'Female')
  })
})

const LUA = `
GRM_GuildMemberHistory_Save = {
  ["Blades Edge"] = {
    ["Aria-Dawn"] = {
      name = "Aria Dawn",
      level = 18,
      class = "Druid",
      race = "Skyborne",
      sex = 3,
      note = "do not store this public note",
      publicNote = "also private",
      zone = "Stormwind City",
    },
    ["Brom-Ironbrow"] = {
      name = "Brom Ironbrow",
      level = 60,
      class = "Shaman",
      race = "Dwarf",
      sex = 2,
      note = "officer only",
      zone = "Ironforge",
    },
  },
}
`

describe('GRM import privacy and roster writes', () => {
  it('drops the public note and zone while keeping UnitSex', () => {
    const parsed = extractGuildMembers(LUA)
    assert.equal(parsed.characters.length, 2)
    const aria = parsed.characters.find((c) => c.name === 'Aria Dawn')
    const brom = parsed.characters.find((c) => c.name === 'Brom Ironbrow')
    assert.ok(aria)
    assert.ok(brom)
    assert.equal(aria.sex, 3)
    assert.equal(brom.sex, 2)
    assert.equal(aria.note, undefined)
    assert.equal(aria.zone, undefined)
    assert.equal(brom.note, undefined)
    assert.equal(brom.zone, undefined)
    assert.equal(JSON.stringify(parsed).includes('do not store'), false)
    assert.equal(JSON.stringify(parsed).includes('Stormwind'), false)
  })

  it('never writes note, last_zone, or claim fields', () => {
    const smuggled: UploadedChar = {
      name: 'Aria',
      last_name: 'Dawn',
      class: 'DRUID',
      race: 'Skyborne',
      sex: 3,
      level: 18,
      note: 'secret public note',
      zone: 'Stormwind City',
    }
    const insert = rosterWritePlan(smuggled, 'Roleplaying', null)
    assert.equal(insert.op, 'insert')
    assert.equal(insert.warning, null)
    assert.equal(insert.fields.sex, 'Female')
    assert.equal(insert.fields.race, 'Skyborne')
    assert.equal(insert.fields.class, 'DRUID')
    for (const key of ['note', 'last_zone', 'zone', 'publicNote', 'claimed_by', 'claimed_at', 'user_id']) {
      assert.equal(Object.hasOwn(insert.fields, key), false, key)
    }

    const update = rosterWritePlan(
      { ...smuggled, sex: 2, class: 'SHAMAN', race: 'Dwarf' },
      'Roleplaying',
      { last_name: 'Dawn' },
    )
    assert.equal(update.op, 'update')
    assert.equal(update.fields.sex, 'Male')
    assert.equal(update.fields.class, 'SHAMAN')
    for (const key of ['note', 'last_zone', 'zone', 'claimed_by', 'claimed_at', 'user_id', 'is_main', 'hide_from_roster']) {
      assert.equal(Object.hasOwn(update.fields, key), false, key)
    }

    const unknownSex = rosterWritePlan({ ...smuggled, sex: 1 }, 'Roleplaying', { last_name: 'Dawn' })
    assert.equal(Object.hasOwn(unknownSex.fields, 'sex'), false)
  })

  it('keeps a real roster row that is outside the Alliance matrix', () => {
    const row: UploadedChar = {
      name: 'Vindicator',
      last_name: 'Mora',
      class: 'PALADIN',
      race: 'Draenei',
      sex: 3,
      level: 60,
      note: 'leave this out',
      zone: 'The Exodar',
    }
    const plan = rosterWritePlan(row, 'Roleplaying', null)
    assert.equal(plan.op, 'insert')
    assert.equal(plan.fields.race, 'Draenei')
    assert.equal(plan.fields.class, 'PALADIN')
    assert.equal(plan.fields.sex, 'Female')
    assert.match(plan.warning ?? '', /outside the Alliance matrix/)
    assert.equal(allianceComboWarning('NightElf', 'DRUID'), null)
    assert.equal(Object.hasOwn(plan.fields, 'note'), false)
    assert.equal(Object.hasOwn(plan.fields, 'last_zone'), false)
  })
})

describe('removed scene art', () => {
  it('is gone from the image folders and from app source', () => {
    const characters = readdirSync(path.join(ROOT, 'public/images/characters'))
    assert.equal(characters.some((name) => name.startsWith('Draenei_')), false)
    assert.equal(existsSync(path.join(ROOT, 'public/images/GuildiesGroup.jpg')), true)
    for (const gone of ['GuildiesInShattrath.jpg', 'guild-photo.jpg', 'guild-photo.png', 'hero-portal.png']) {
      assert.equal(existsSync(path.join(ROOT, 'public/images', gone)), false, gone)
    }

    const banned = [
      'Draenei',
      'Shattrath',
      'shattrath',
      'guild-photo',
      'hero-portal',
      'GuildiesInShattrath',
      'Outland',
      'Dark Portal',
      'Burning Crusade',
    ]
    const hits: string[] = []
    const roots = ['app', 'components', 'lib', 'data'].map((dir) => path.join(ROOT, dir))
    function walk(dir: string) {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry)
        if (statSync(full).isDirectory()) {
          walk(full)
          continue
        }
        if (!/\.(ts|tsx|css|js|jsx)$/.test(entry) || entry.endsWith('.test.ts')) continue
        const text = readFileSync(full, 'utf8')
        for (const word of banned) {
          if (text.includes(word)) hits.push(`${path.relative(ROOT, full)}: ${word}`)
        }
      }
    }
    for (const dir of roots) walk(dir)
    assert.deepEqual(hits, [])
  })
})
