/**
 * Parse a WoW SavedVariables file (e.g. Guild_Roster_Manager.lua) in the browser
 * and pull out current guild members.
 *
 * Replaces the old "upload your GRM .lua to Claude to get JSON" step. The parser is
 * deliberately tolerant: it walks every table looking for member-shaped records
 * (a `name` string plus a `level` or `class`), skips GRM's "players that left" /
 * ban lists, and prefers the guild whose key contains "Blades Edge".
 */
import { normalizeForSearch } from '@/lib/names'
import type { UploadedChar } from '@/lib/roster-sync'

type LuaValue = string | number | boolean | null | LuaTable
type LuaTable = Map<string | number, LuaValue>

class LuaParser {
  private i = 0
  private src: string
  constructor(src: string) {
    this.src = src
  }

  private skip() {
    const s = this.src
    for (;;) {
      while (this.i < s.length && /\s/.test(s[this.i])) this.i++
      if (s.startsWith('--', this.i)) {
        this.i += 2
        const long = /^\[(=*)\[/.exec(s.slice(this.i, this.i + 20))
        if (long) {
          const close = `]${long[1]}]`
          const end = s.indexOf(close, this.i)
          this.i = end < 0 ? s.length : end + close.length
        } else {
          const nl = s.indexOf('\n', this.i)
          this.i = nl < 0 ? s.length : nl + 1
        }
        continue
      }
      break
    }
  }

  private peek(): string { this.skip(); return this.src[this.i] }

  private expect(ch: string) {
    this.skip()
    if (this.src[this.i] !== ch) throw new Error(`Expected "${ch}" at position ${this.i}`)
    this.i++
  }

  private ident(): string | null {
    this.skip()
    const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(this.src.slice(this.i, this.i + 256))
    if (!m) return null
    this.i += m[0].length
    return m[0]
  }

  private string(): string {
    const s = this.src
    const q = s[this.i]
    if (q === '[') {
      const m = /^\[(=*)\[/.exec(s.slice(this.i, this.i + 20))!
      const close = `]${m[1]}]`
      const start = this.i + m[0].length
      const end = s.indexOf(close, start)
      if (end < 0) throw new Error('Unterminated long string')
      this.i = end + close.length
      return s.slice(start, end).replace(/^\r?\n/, '')
    }
    this.i++
    let out = ''
    while (this.i < s.length) {
      const c = s[this.i++]
      if (c === q) return out
      if (c === '\\') {
        const n = s[this.i++]
        if (n === 'n') out += '\n'
        else if (n === 't') out += '\t'
        else if (n === 'r') out += '\r'
        else if (n === '\n') out += '\n'
        else if (/[0-9]/.test(n)) {
          let digits = n
          while (digits.length < 3 && /[0-9]/.test(s[this.i])) digits += s[this.i++]
          out += String.fromCharCode(parseInt(digits, 10))
        } else out += n
      } else out += c
    }
    throw new Error('Unterminated string')
  }

  value(): LuaValue {
    const c = this.peek()
    if (c === '{') return this.table()
    if (c === '"' || c === "'") return this.string()
    if (c === '[' && /^\[=*\[/.test(this.src.slice(this.i, this.i + 20))) return this.string()
    const num = /^-?(0[xX][0-9a-fA-F]+|(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?)/.exec(this.src.slice(this.i, this.i + 64))
    if (num) { this.i += num[0].length; return Number(num[0]) }
    const id = this.ident()
    if (id === 'true') return true
    if (id === 'false') return false
    if (id === 'nil') return null
    throw new Error(`Unexpected token at position ${this.i}`)
  }

  private table(): LuaTable {
    this.expect('{')
    const t: LuaTable = new Map()
    let arrayIndex = 1
    for (;;) {
      const c = this.peek()
      if (c === '}') { this.i++; return t }
      if (c === '[' && !/^\[=*\[/.test(this.src.slice(this.i, this.i + 20))) {
        this.i++
        const k = this.value()
        this.expect(']')
        this.expect('=')
        t.set(k as string | number, this.value())
      } else {
        const save = this.i
        const id = this.ident()
        if (id && this.peek() === '=' && this.src[this.i + 1] !== '=') {
          this.i++
          t.set(id, this.value())
        } else {
          this.i = save
          t.set(arrayIndex++, this.value())
        }
      }
      const sep = this.peek()
      if (sep === ',' || sep === ';') this.i++
    }
  }

  /** Top-level `Name = value` assignments. */
  assignments(): Map<string, LuaValue> {
    const out = new Map<string, LuaValue>()
    for (;;) {
      this.skip()
      if (this.i >= this.src.length) return out
      const id = this.ident()
      if (!id) throw new Error(`Unexpected character at position ${this.i}`)
      this.expect('=')
      out.set(id, this.value())
    }
  }
}

export function parseSavedVariables(src: string): Map<string, LuaValue> {
  return new LuaParser(src.replace(/^\uFEFF/, '')).assignments()
}

// ── Member extraction ──────────────────────────────────────────────────────

const CLASS_TOKENS: Record<string, string> = {
  warrior: 'WARRIOR', paladin: 'PALADIN', hunter: 'HUNTER', rogue: 'ROGUE', priest: 'PRIEST',
  shaman: 'SHAMAN', mage: 'MAGE', warlock: 'WARLOCK', druid: 'DRUID',
  'death knight': 'DEATHKNIGHT', deathknight: 'DEATHKNIGHT', monk: 'MONK',
  'demon hunter': 'DEMONHUNTER', demonhunter: 'DEMONHUNTER', evoker: 'EVOKER',
}

function get(t: LuaTable, ...keys: string[]): LuaValue | undefined {
  for (const k of keys) {
    if (t.has(k)) return t.get(k)
    for (const [kk, v] of t) if (typeof kk === 'string' && kk.toLowerCase() === k.toLowerCase()) return v
  }
  return undefined
}

const str = (v: LuaValue | undefined) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
const num = (v: LuaValue | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)

function toMember(t: LuaTable, keyName: string | undefined): UploadedChar | null {
  const name = str(get(t, 'name', 'fullName', 'playerName')) ?? keyName
  if (!name || name.length > 60) return null
  const level = num(get(t, 'level', 'lvl'))
  const rawClass = str(get(t, 'class', 'classFile', 'classToken'))
  if (level == null && !rawClass) return null
  const cls = rawClass ? (CLASS_TOKENS[rawClass.toLowerCase()] ?? rawClass.toUpperCase()) : undefined
  // sex is WoW UnitSex (2 = male, 3 = female). Mapped later by normaliseSex.
  // Public note and current zone are private and are not copied out of the file.
  return {
    name,
    class: cls,
    race: str(get(t, 'race')),
    sex: get(t, 'sex') ?? undefined,
    level,
    rank_name: str(get(t, 'rankName', 'rank')) ?? null,
    rank_index: num(get(t, 'rankIndex', 'rankInd')) ?? null,
  }
}

type Found = { member: UploadedChar; guildKey: string }

function walk(v: LuaValue, path: (string | number)[], out: Found[], depth = 0) {
  if (!(v instanceof Map) || depth > 8) return
  for (const [k, child] of v) {
    if (!(child instanceof Map)) continue
    const keyName = typeof k === 'string' ? k : undefined
    const m = toMember(child, keyName)
    if (m) {
      out.push({ member: m, guildKey: String(path[path.length - 1] ?? '') })
      continue
    }
    walk(child, [...path, k], out, depth + 1)
  }
}

const EXCLUDE_VARS = /left|ban|former|removed|alt_?list|log/i

export type GrmParseResult = { characters: UploadedChar[]; guilds: string[]; source: string }

export function extractGuildMembers(src: string, guildName = 'Blades Edge'): GrmParseResult {
  const vars = parseSavedVariables(src)
  const preferred = [...vars.keys()].filter((k) => /GuildMemberHistory/i.test(k))
  const candidates = preferred.length ? preferred : [...vars.keys()].filter((k) => !EXCLUDE_VARS.test(k))

  const found: Found[] = []
  for (const k of candidates) walk(vars.get(k) ?? null, [k], found)

  const guilds = [...new Set(found.map((f) => f.guildKey))]
  const want = normalizeForSearch(guildName).replace(/[^a-z]/g, '')
  const matching = guilds.filter((g) => normalizeForSearch(g).replace(/[^a-z]/g, '').includes(want))
  const keep = matching.length ? found.filter((f) => matching.includes(f.guildKey)) : found

  // De-dupe by name
  const seen = new Set<string>()
  const characters: UploadedChar[] = []
  for (const f of keep) {
    const key = normalizeForSearch(f.member.name)
    if (seen.has(key)) continue
    seen.add(key)
    characters.push(f.member)
  }
  return { characters, guilds: matching.length ? matching : guilds, source: candidates.join(', ') }
}
