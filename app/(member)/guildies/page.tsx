import { createClient } from '@/lib/supabase/server'
import { GuildiesClient, ActiveChar, UnclaimedChar } from './GuildiesClient'

export default async function GuildiesPage() {
  const supabase = await createClient()

  const [{ data: activeRaw }, { data: unclaimedRaw }] = await Promise.all([
    supabase
      .from('characters')
      .select('id, name, class, race, level, rank_name, rank_index, professions(name, skill_level, is_primary)')
      .not('claimed_by', 'is', null)
      .eq('hide_from_roster', false)
      .eq('is_main', true),
    supabase
      .from('characters')
      .select('id, name, class, race, level, rank_name, rank_index, professions(name)')
      .is('claimed_by', null)
      .eq('hide_from_roster', false),
  ])

  const active    = (activeRaw    ?? []) as unknown as ActiveChar[]
  const unclaimed = (unclaimedRaw ?? []) as unknown as UnclaimedChar[]

  return <GuildiesClient active={active} unclaimed={unclaimed} />
}
