export interface DungeonBoss {
  name: string
  abilities?: string[]
  notable_loot?: string[]
}

export interface Dungeon {
  id: string
  name: string
  zone: string
  region: string
  min_level: number
  max_level: number
  heroic: boolean
  description: string
  location_note?: string
  bosses: DungeonBoss[]
  tags?: string[]
  image_key?: string
}
