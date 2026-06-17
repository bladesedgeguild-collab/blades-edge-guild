import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createClient as adminClient } from '@supabase/supabase-js'
import DungeonsClient from './DungeonsClient'
import { DUNGEONS } from '@/data/dungeons/index'
import './dungeons.css'

export const metadata: Metadata = {
  title: 'Dungeon Finder | Blådes Edge',
  description: 'Find your next dungeon run. View level requirements, quests, loot, and call guildmates to join you.',
}

export type LfgSidebarPost = {
  id: string
  dungeon_slug: string
  character_name: string
  role: string
  available_window: string | null
  days_available: string[] | null
  time_start: string | null
  time_end: string | null
  current_group: { tank: number; healer: number; dps: number } | null
}

export default async function DungeonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let playerLevel = 1

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('claimed_character_id')
      .eq('id', user.id)
      .single()

    if (profile?.claimed_character_id) {
      const { data: char } = await supabase
        .from('characters')
        .select('level')
        .eq('id', profile.claimed_character_id)
        .single()
      if (char?.level) playerLevel = char.level
    }
  }

  const service = adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: lfgData, error: lfgError } = await service
    .from('dungeon_lfg')
    .select('id, dungeon_slug, character_name, role, available_window, days_available, time_start, time_end, current_group')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  if (lfgError) console.error('Dungeons page LFG fetch error:', lfgError)

  const activeLFG = (lfgData ?? []) as LfgSidebarPost[]

  const dungeonNames = Object.fromEntries(DUNGEONS.map(d => [d.id, d.name]))

  return (
    <div className="df-page">
      <div className="page-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <DungeonsClient playerLevel={playerLevel} activeLFG={activeLFG} dungeonNames={dungeonNames} />
      </div>
    </div>
  )
}
