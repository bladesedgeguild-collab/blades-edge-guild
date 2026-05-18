import { createClient } from '@/lib/supabase/server'
import { MemberCard } from '@/components/roster/MemberCard'
import { CharacterClass } from '@/types'

export default async function RosterPage() {
  const supabase = await createClient()

  const { data: characters } = await supabase
    .from('characters')
    .select('id, name, class, level, rank_name, status')
    .order('rank_index', { ascending: true })
    .order('name', { ascending: true })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#c9a84c' }}>
        Guild Roster
      </h1>

      {!characters || characters.length === 0 ? (
        <p style={{ color: '#6b7a99' }}>No characters imported yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {characters.map((c) => (
            <MemberCard
              key={c.id}
              name={c.name}
              class={c.class as CharacterClass}
              level={c.level}
              rank={c.rank_name ?? 'Member'}
              status={c.status}
            />
          ))}
        </div>
      )}
    </div>
  )
}
