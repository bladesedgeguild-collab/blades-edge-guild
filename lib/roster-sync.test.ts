import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { identityKey, normalizeUploaded, planRosterSync, rosterWritePlan, type SyncDbRow, type UploadedChar } from '@/lib/roster-sync'

function row(p: Partial<SyncDbRow> & { id: string; name: string; last_name: string | null }): SyncDbRow {
  return {
    guid: null, class: 'MAGE', race: 'Human', sex: null, level: 10, rank_index: 7, rank_name: 'Fresh Recruit',
    last_online_days: 9999, imported_from_grm: true, claimed_by: null, left_guild_at: null, ...p,
  }
}

const FORBIDDEN = ['note', 'last_zone', 'zone', 'notes', 'claimed_by', 'claimed_at', 'user_id', 'is_main', 'hide_from_roster']

describe('roster sync planner', () => {
  it('matches on GUID first, even after a rename', () => {
    const db = [row({ id: 'a', name: 'Old', last_name: 'Name', guid: 'Player-6928-0000000A', claimed_by: 'u1' })]
    const up = normalizeUploaded([{ name: 'New Name', guid: 'Player-6928-0000000A', class: 'MAGE', level: 12, rank_index: 6, rank_name: 'Member' }])
    const plan = planRosterSync(up, db, 'Roleplaying')
    assert.equal(plan.inserts.length, 0)
    assert.equal(plan.updates.length, 1)
    assert.equal(plan.updates[0].matchedBy, 'guid')
    assert.deepEqual(plan.renames, [{ id: 'a', from: 'Old Name', to: 'New Name' }])
    for (const k of FORBIDDEN) assert.equal(Object.hasOwn(plan.updates[0].fields, k), false, k)
    assert.equal(Object.hasOwn(plan.updates[0].fields, 'name'), false)
    assert.equal(Object.hasOwn(plan.updates[0].fields, 'realm'), false)
  })

  it('links a GUID onto a legacy name match without touching the claim', () => {
    const db = [row({ id: 'a', name: 'Aria', last_name: 'Dawn', claimed_by: 'u1' })]
    const up = normalizeUploaded([{ name: 'Aria Dawn', guid: 'Player-6928-0000000B', class: 'MAGE', level: 10, rank_index: 7, rank_name: 'Fresh Recruit' }])
    const plan = planRosterSync(up, db, 'Roleplaying')
    assert.equal(plan.updates.length, 1)
    assert.equal(plan.updates[0].fields.guid, 'Player-6928-0000000B')
    for (const k of FORBIDDEN) assert.equal(Object.hasOwn(plan.updates[0].fields, k), false, k)
  })

  it('treats a same-name row with a different GUID as a conflict, not a match', () => {
    const db = [row({ id: 'a', name: 'Aria', last_name: 'Dawn', guid: 'Player-6928-0000000C' })]
    const up = normalizeUploaded([{ name: 'Aria Dawn', guid: 'Player-7055-0000000D', class: 'MAGE', level: 10 }])
    const plan = planRosterSync(up, db, 'Roleplaying')
    assert.equal(plan.updates.length, 0)
    assert.equal(plan.inserts.length, 0)
    assert.equal(plan.conflicts.length, 1)
  })

  it('NFC-normalizes and case-folds names for duplicate checks, but keeps accents distinct', () => {
    assert.equal(identityKey('Cafe\u0301', 'X'), identityKey('Caf\u00e9', 'x'))
    assert.equal(identityKey('STRAßE', null), identityKey('strasse', null))
    assert.notEqual(identityKey('Café', null), identityKey('Cafe', null))
    const db = [row({ id: 'a', name: 'Caoimhe', last_name: 'L\u00e1mhthine' })]
    const up = normalizeUploaded([
      { name: 'caoimhe la\u0301mhthine', class: 'SHAMAN', level: 10 },
      { name: 'CAOIMHE LÁMHTHINE', class: 'SHAMAN', level: 10 },
    ])
    const plan = planRosterSync(up, db, 'Roleplaying')
    assert.equal(plan.inserts.length, 0)
    assert.equal(plan.duplicates.length, 1)
  })

  it('writes rank only as the exact uploaded pair, and leaves is_main and realm alone', () => {
    const ins = rosterWritePlan({ name: 'Lea', last_name: 'Alt', rank_index: 2, rank_name: 'Leadership Alt', class: 'priest', level: 5, guid: 'Player-6928-0000000E' }, 'Roleplaying', null)
    assert.equal(ins.fields.rank_index, 2)
    assert.equal(ins.fields.rank_name, 'Leadership Alt')
    assert.equal(Object.hasOwn(ins.fields, 'is_main'), false)
    assert.equal(ins.fields.realm, 'Roleplaying')
    for (const k of FORBIDDEN.filter((k) => k !== 'hide_from_roster')) assert.equal(Object.hasOwn(ins.fields, k), false, k)
    const half = rosterWritePlan({ name: 'Lea', last_name: 'Alt', rank_name: 'Leadership Alt' } as UploadedChar, 'Roleplaying', { last_name: 'Alt' })
    assert.equal(Object.hasOwn(half.fields, 'rank_name'), false)
    assert.equal(Object.hasOwn(half.fields, 'rank_index'), false)
    assert.equal(Object.hasOwn(half.fields, 'level'), false)
  })

  it('flags only GRM rows that left, never member-made rows, and never plans a delete', () => {
    const db = [
      row({ id: 'stay', name: 'Stay', last_name: 'Here' }),
      row({ id: 'gone', name: 'Gone', last_name: 'Away', claimed_by: 'u2' }),
      row({ id: 'mine', name: 'Made', last_name: 'Bymember', imported_from_grm: false, claimed_by: 'u3' }),
    ]
    const up = normalizeUploaded([{ name: 'Stay Here', class: 'MAGE', level: 10, rank_index: 7, rank_name: 'Fresh Recruit' }])
    const plan = planRosterSync(up, db, 'Roleplaying')
    assert.deepEqual(plan.leaving.map((l) => l.id), ['gone'])
    assert.deepEqual(plan.notInGrm.map((l) => l.id), ['mine'])
    assert.equal(plan.leaveFlagBlocked, null)
    assert.equal(Object.hasOwn(plan, 'deletes'), false)
  })

  it('blocks departure flags for a partial upload', () => {
    const db = Array.from({ length: 10 }, (_, i) => row({ id: `r${i}`, name: `N${i}`, last_name: 'X' }))
    const up = normalizeUploaded([{ name: 'N0 X', class: 'MAGE', level: 10 }])
    const plan = planRosterSync(up, db, 'Roleplaying')
    assert.ok(plan.leaveFlagBlocked)
  })

  it('reports a new character whose first name is already taken instead of failing the insert', () => {
    const db = [row({ id: 'a', name: 'Kaus', last_name: 'Taine' })]
    const up = normalizeUploaded([
      { name: 'Kaus Taine', class: 'MAGE', level: 10 },
      { name: 'Kaus Other', class: 'MAGE', level: 10 },
    ])
    const plan = planRosterSync(up, db, 'Roleplaying')
    assert.equal(plan.inserts.length, 0)
    assert.equal(plan.conflicts.length, 1)
  })

  it('clears the departed flag when a character comes back', () => {
    const db = [row({ id: 'a', name: 'Back', last_name: 'Again', left_guild_at: '2026-11-14T00:00:00Z' })]
    const up = normalizeUploaded([{ name: 'Back Again', class: 'MAGE', level: 10, rank_index: 7, rank_name: 'Fresh Recruit' }])
    const plan = planRosterSync(up, db, 'Roleplaying')
    assert.equal(plan.updates[0].fields.left_guild_at, null)
  })
})
