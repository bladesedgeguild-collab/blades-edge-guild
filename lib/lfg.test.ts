import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ALL_DUNGEONS, DUNGEONS, getDungeon, opensOnLabel } from '@/data/dungeons/index'
import { buildLfgWebhookPayload } from '@/lib/discord-lfg'
import { claimSlot, clampNeeds, needsSummary, openCounts, partyXpWarning, resolveNeeds } from '@/lib/lfg-group'
import { bannerMatches, discordMentions } from '@/lib/lfg-match'
import { formatInstant, resolveSchedule, zonedWallTimeToUtc } from '@/lib/lfg-time'
import { levelFit, levelFitLabel } from '@/lib/level-fit'
import { classRoles, effectiveRoles } from '@/lib/roles'

const deadmines = getDungeon('deadmines')!
const hall = getDungeon('hall-of-thanes')!
const dalaran = getDungeon('city-of-dalaran')!
const brd = getDungeon('blackrock-depths')!
const stocks = getDungeon('stockades')!

describe('Forever dungeon catalog', () => {
  it('lists the Forever set and hides Ragefire from Alliance', () => {
    assert.equal(ALL_DUNGEONS.length, 38)
    assert.equal(DUNGEONS.length, 37)
    assert.equal(DUNGEONS.some(dungeon => dungeon.id === 'ragefire-chasm'), false)
    assert.equal(getDungeon('ragefire-chasm')?.hiddenForAlliance, true)
    assert.equal(getDungeon('shadowfang-keep')?.recommendedLevelMin, 20)
    assert.equal(getDungeon('sunken-temple')?.continent, 'Eastern Kingdoms')
    assert.equal(getDungeon('hyjal-summit')?.maxPlayers, 20)
    const hyjal = getDungeon('hyjal-summit')!
    assert.equal(hyjal.groupComp.tank + hyjal.groupComp.healer + hyjal.groupComp.dps, 20)
    assert.equal(opensOnLabel(getDungeon('onyxias-lair')!), 'Opens Dec 9, 2026')
    assert.equal(opensOnLabel(deadmines), null)
  })

  it('splits wings, keeps sourced requirements, and does not invent boss tips', () => {
    for (const id of ['sm-graveyard', 'sm-library', 'sm-armory', 'sm-cathedral', 'dire-maul-east', 'dire-maul-west', 'dire-maul-north', 'stratholme-live', 'stratholme-undead']) {
      assert.ok(getDungeon(id), id)
    }
    assert.equal(getDungeon('scarlet-monastery'), undefined)
    assert.equal(dalaran.requirement?.includes('Attunement required'), true)
    assert.equal(getDungeon('onyxias-lair')?.requirement?.includes('Drakefire Amulet'), true)
    assert.equal(deadmines.bosses.length, 0)
    const drowned = getDungeon('drowned-city')!
    assert.ok(drowned.bosses.length > 0)
    assert.ok(drowned.bosses.every(boss => boss.unconfirmed && boss.quickTips.length === 0))
    assert.equal(getDungeon('upper-blackrock-spire')?.maxPlayers, 10)
    const ubrs = getDungeon('upper-blackrock-spire')!
    assert.equal(ubrs.groupComp.tank + ubrs.groupComp.healer + ubrs.groupComp.dps, 10)
    assert.equal('heroicRequiresLevel' in deadmines, false)
  })
})

describe('level fit', () => {
  it('locks below the door, stays green in range, and relabels the cap', () => {
    assert.equal(levelFit(hall, 15), 'active')
    assert.equal(levelFit(deadmines, 15), 'underleveled')
    assert.equal(levelFit(stocks, 14), 'locked')
    assert.equal(levelFitLabel('locked', stocks), 'Requires Level 15')
    assert.equal(levelFit(deadmines, 40), 'outleveled')
    assert.equal(levelFit(brd, 60), 'active')
    assert.equal(levelFit(deadmines, 60), 'no-xp')
    assert.equal(levelFitLabel('no-xp', deadmines), 'No XP (loot, quests or attunement only)')
    assert.equal(levelFit(getDungeon('hyjal-summit')!, 60), 'active')
  })
})

describe('roles and slots', () => {
  it('derives class roles and keeps a saved preference inside that set', () => {
    assert.deepEqual(classRoles('WARRIOR'), ['Tank', 'DPS'])
    assert.deepEqual(classRoles('Priest'), ['Healer', 'DPS'])
    assert.deepEqual(classRoles('Mage'), ['DPS'])
    assert.deepEqual(effectiveRoles('Warrior', ['DPS']), ['DPS'])
    assert.deepEqual(effectiveRoles('Mage', ['Tank']), ['DPS'])
    assert.deepEqual(effectiveRoles('Paladin', null), ['Tank', 'Healer', 'DPS'])
  })

  it('enforces slot caps, including a 20-player raid', () => {
    const needs = resolveNeeds({ tank: 1, healer: 1, dps: 3 }, { tank: 2, healer: 5, dps: 13 })
    const group = { tank: ['a'], healer: [] as string[], dps: ['b', 'c', 'd'] }
    assert.equal(claimSlot(group, needs, 'dps', { name: 'e', level: 30 }).ok, false)
    assert.equal(claimSlot(group, needs, 'healer', { name: 'e', level: 30 }).ok, true)
    const hyjal = clampNeeds({ tank: 4, healer: 8, dps: 20 }, 20, 'tank')
    assert.equal(hyjal.tank + hyjal.healer + hyjal.dps <= 20, true)
    assert.equal(hyjal.tank >= 1, true)
    const counts = openCounts({ tank: 2, healer: 3, dps: 5 }, { tank: ['a'], healer: [], dps: ['b'] })
    assert.equal(needsSummary({ tank: 2, healer: 3, dps: 5 }, { tank: ['a'], healer: [], dps: ['b'] }).includes('Healer'), true)
    assert.equal(counts.dps, 4)
  })

  it('warns when a member is far above the dungeon', () => {
    assert.match(partyXpWarning([18, 60], deadmines.recommendedLevelMax) ?? '', /no experience/i)
    assert.equal(partyXpWarning([18, 22], deadmines.recommendedLevelMax), null)
  })
})

describe('banner matching', () => {
  it('matches the green window, class, and an open role, main first', () => {
    const open = { tank: 0, healer: 1, dps: 2 }
    const matches = bannerMatches([
      { id: 'alt', name: 'Lyra', className: 'MAGE', level: 31, isMain: false, savedRoles: null },
      { id: 'main', name: 'Brogan', className: 'SHAMAN', level: 30, isMain: true, savedRoles: ['Healer'] },
      { id: 'high', name: 'Odys', className: 'PRIEST', level: 60, isMain: false, savedRoles: null },
      { id: 'low', name: 'Pip', className: 'WARRIOR', level: 15, isMain: false, savedRoles: null },
    ], dalaran, open)
    assert.equal(matches[0]?.name, 'Brogan')
    assert.equal(matches[0]?.role, 'Healer')
    assert.equal(matches.some(match => match.name === 'Lyra' && match.role === 'DPS'), true)
    assert.equal(matches.some(match => match.name === 'Odys'), false)
    assert.equal(matches.some(match => match.name === 'Pip'), false)
  })

  it('pings only opted-in Discord ids, once, and never the poster', () => {
    const mentions = discordMentions({
      posterId: 'poster',
      chars: [
        { id: 'c1', userId: 'poster', discordId: '111111111111111111', name: 'Lead', className: 'Warrior', level: 30, isMain: true, savedRoles: ['Tank'] },
        { id: 'c2', userId: 'healer', discordId: '222222222222222222', name: 'Brogan', className: 'Priest', level: 30, isMain: true, savedRoles: null },
        { id: 'c3', userId: 'quiet', discordId: '333333333333333333', name: 'Nyx', className: 'Priest', level: 30, isMain: true, savedRoles: null },
        { id: 'c4', userId: 'capped', discordId: '444444444444444444', name: 'Cap', className: 'Mage', level: 31, isMain: true, savedRoles: null },
      ],
      allowedUserIds: new Set(['healer', 'capped']),
      matchIdsByUser: new Map([['healer', null], ['capped', null]]),
      dungeon: dalaran,
      needs: { tank: 1, healer: 1, dps: 3 },
      groupCounts: { tank: 1, healer: 0, dps: 0 },
      already: new Set(),
      recentCounts: new Map([['capped', 8]]),
    })
    assert.deepEqual(mentions.map(mention => mention.discordId), ['222222222222222222'])
  })
})

describe('schedule and Discord payload', () => {
  it('converts a Mountain Time wall clock and rejects a past run', () => {
    const start = zonedWallTimeToUtc('2026-11-14', '19:00', 'America/Denver')
    assert.equal(start?.toISOString(), '2026-11-15T02:00:00.000Z')
    assert.match(formatInstant(start!, 'America/Denver'), /Nov 14/)
    const tooLate = resolveSchedule({
      date: '2026-11-01',
      start: '12:00',
      timeZone: 'America/Denver',
      now: Date.parse('2026-11-10T12:00:00Z'),
    })
    assert.equal(tooLate.ok, false)
  })

  it('allows mentions only for the listed users', () => {
    const payload = buildLfgWebhookPayload({
      dungeonName: 'City of Dalaran',
      posterName: 'Avatar Odys',
      posterRole: 'Tank',
      startsAt: '2026-11-15T02:00:00.000Z',
      levelMin: 28,
      levelMax: 33,
      openSummary: 'Needs a Healer and 2 DPS.',
      notes: '@everyone bring water',
      url: 'https://bladesedgeguild.com/dungeons/city-of-dalaran?lfg=abc',
      mentions: [{ discordId: '222222222222222222' }, { discordId: 'not-an-id' }],
    }) as {
      content: string
      allowed_mentions: { parse: string[]; users: string[] }
    }
    assert.equal(payload.content, '<@222222222222222222>')
    assert.deepEqual(payload.allowed_mentions, { parse: [], users: ['222222222222222222'] })
    assert.equal(JSON.stringify(payload).includes('@everyone'), true)
    assert.equal(payload.allowed_mentions.parse.length, 0)
  })
})
