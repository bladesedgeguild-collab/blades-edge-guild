import { createClient } from '@/lib/supabase/server'
import { GuildiesClient, RosterChar } from './GuildiesClient'

type DbRosterChar = RosterChar & { claimed_by: string | null }

export default async function GuildiesPage() {
  const supabase = await createClient()

  const { data: activeRaw } = await supabase
    .from('characters')
    .select('id, name, last_name, class, race, level, rank_name, rank_index, claimed_by, professions(name, skill_level, is_primary)')
    .eq('hide_from_roster', false)
    .is('left_guild_at', null)

  const activeAll       = (activeRaw ?? []) as unknown as DbRosterChar[]
  const claimed         = activeAll.filter(c => c.claimed_by !== null) as unknown as RosterChar[]
  const unclaimedActive = activeAll.filter(c => c.claimed_by === null) as unknown as RosterChar[]

  return (
    <GuildiesClient
      claimed={claimed}
      unclaimedActive={unclaimedActive}
    />
  )
}
