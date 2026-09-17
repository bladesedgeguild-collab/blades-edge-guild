import { createClient } from '@/lib/supabase/server'
import { RosterClient } from '@/components/roster/RosterClient'
import { CharacterClass } from '@/types'

export default async function RosterPage() {
  const supabase = await createClient()

  const { data: characters } = await supabase
    .from('characters')
    .select('id, name, last_name, class, level, rank_name')
    .eq('hide_from_roster', false)
    .order('rank_index', { ascending: true })
    .order('name', { ascending: true })

  const chars = (characters ?? []).map((c) => ({ ...c, class: c.class as CharacterClass }))

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#c9a84c' }}>
        Guild Roster
      </h1>

      {chars.length === 0 ? (
        <p style={{ color: '#6b7a99' }}>No characters yet.</p>
      ) : (
        <RosterClient characters={chars} />
      )}
    </div>
  )
}
