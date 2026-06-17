import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import DungeonsClient from './DungeonsClient'
import './dungeons.css'

export const metadata: Metadata = {
  title: 'Dungeon Finder — Blådes Edge',
  description: 'Find your next dungeon run. View level requirements, quests, loot, and call guildmates to join you.',
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

  return (
    <div className="df-page">
      <div className="page-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div className="df-header">
          <h1 className="df-title">Dungeon Finder</h1>
          <p className="df-subtitle">
            Every den of darkness, every vault of peril — sorted for your level.
          </p>
        </div>
        <DungeonsClient playerLevel={playerLevel} />
      </div>
    </div>
  )
}
