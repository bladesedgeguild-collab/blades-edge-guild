export type UserRole = 'pending' | 'member' | 'officer' | 'gm' | 'admin'
export type CharacterStatus = 'returned' | 'mia' | 'new'
export type CharacterClass =
  | 'MAGE'
  | 'PALADIN'
  | 'WARRIOR'
  | 'PRIEST'
  | 'DRUID'
  | 'HUNTER'
  | 'ROGUE'
  | 'WARLOCK'
  | 'SHAMAN'

export interface User {
  id: string
  discord_id: string | null
  discord_username: string | null
  discord_avatar: string | null
  display_name: string | null
  email: string | null
  role: UserRole
  approved_at: string | null
  approved_by: string | null
  has_completed_onboarding: boolean
  claimed_character_id: string | null
  created_at: string
  updated_at: string
}

export interface Character {
  id: string
  user_id: string
  name: string
  realm: string
  class: CharacterClass
  race: string | null
  sex: string | null
  level: number
  is_main: boolean
  rank_name: string | null
  rank_index: number | null
  joined_guild_at: string | null
  last_zone: string | null
  hair_color: string | null
  skin_tone: string | null
  hair_style: string | null
  status: CharacterStatus
  imported_from_grm: boolean
  claimed_by: string | null
  claimed_at: string | null
  created_at: string
  updated_at: string
}

export interface Profession {
  id: string
  character_id: string
  name: string
  abbr: string | null
  skill_level: number
  is_primary: boolean
  updated_at: string
}

export interface DungeonRun {
  id: string
  created_by: string
  dungeon_name: string
  quests: string | null
  notes: string | null
  scheduled_at: string | null
  status: string
  max_players: number
  level_min: number | null
  level_max: number | null
  created_at: string
}

export interface DungeonSlot {
  id: string
  run_id: string
  user_id: string
  character_id: string | null
  role: 'tank' | 'healer' | 'dps'
  slot_order: number | null
  signed_up_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

export interface GrmImport {
  id: string
  imported_by: string
  characters_updated: number | null
  characters_added: number | null
  notes: string | null
  imported_at: string
}

export const CLASS_COLORS: Record<CharacterClass, string> = {
  MAGE: '#3fc7eb',
  PALADIN: '#f48cba',
  WARRIOR: '#c69b3a',
  PRIEST: '#ffffff',
  DRUID: '#ff7c0a',
  HUNTER: '#aad372',
  ROGUE: '#fff468',
  WARLOCK: '#8788ee',
  SHAMAN: '#0070dd',
}
