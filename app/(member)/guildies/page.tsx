import { createClient } from '@/lib/supabase/server'
import { GuildiesClient, RosterChar, MiaChar } from './GuildiesClient'

type DbRosterChar = RosterChar & { claimed_by: string | null }

export default async function GuildiesPage() {
  const supabase = await createClient()

  const [{ data: activeRaw }, { data: miaRaw }] = await Promise.all([
    supabase
      .from('characters')
      .select('id, name, class, race, level, rank_name, rank_index, last_online_days, claimed_by, professions(name, skill_level, is_primary)')
      .lt('last_online_days', 9999)
      .eq('hide_from_roster', false),
    supabase
      .from('characters')
      .select('id, name, class, race, level, rank_name, rank_index, in_original_roster, last_online_days, professions(name, skill_level)')
      .eq('in_original_roster', true)
      .eq('last_online_days', 9999)
      .eq('hide_from_roster', false),
  ])

  const activeAll       = (activeRaw ?? []) as unknown as DbRosterChar[]
  const claimed         = activeAll.filter(c => c.claimed_by !== null) as unknown as RosterChar[]
  const unclaimedActive = activeAll.filter(c => c.claimed_by === null) as unknown as RosterChar[]
  const miaOriginals    = (miaRaw ?? []) as unknown as MiaChar[]

  return (
    <GuildiesClient
      claimed={claimed}
      unclaimedActive={unclaimedActive}
      miaOriginals={miaOriginals}
    />
  )
}
