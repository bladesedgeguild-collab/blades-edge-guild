import { createClient } from '@/lib/supabase/server'
import { CLASS_COLORS, CharacterClass } from '@/types'
import { ReleaseButton } from '@/components/admin/ReleaseButton'

export default async function ApprovalsPage() {
  const supabase = await createClient()

  const { data: pending } = await supabase
    .from('users')
    .select('id, discord_username, display_name, created_at')
    .eq('role', 'pending')
    .order('created_at', { ascending: true })

  // Claimed characters — gracefully handles pre-migration state
  const { data: claimedRaw } = await supabase
    .from('characters')
    .select('id, name, class, level, claimed_by, claimed_at')
    .not('claimed_by', 'is', null)
    .order('claimed_at', { ascending: false })

  const claimed = claimedRaw ?? []

  // Fetch user info for each claimer in one query
  const claimerIds = [...new Set(claimed.map((c) => c.claimed_by).filter(Boolean))]
  const { data: claimersRaw } = await supabase
    .from('users')
    .select('id, discord_username, display_name')
    .in('id', claimerIds.length > 0 ? claimerIds : ['00000000-0000-0000-0000-000000000000'])

  const claimersById = Object.fromEntries(
    (claimersRaw ?? []).map((u) => [u.id, u])
  )

  const { count: unclaimedCount } = await supabase
    .from('characters')
    .select('*', { count: 'exact', head: true })
    .is('claimed_by', null)

  return (
    <div className="flex flex-col gap-10">
      {/* ── Pending Approvals ── */}
      <section>
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#c9a84c' }}>
          Approval Queue
        </h1>

        {!pending || pending.length === 0 ? (
          <p style={{ color: '#6b7a99' }}>No pending approvals.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border p-4"
                style={{ backgroundColor: '#0d1326', borderColor: '#1e2a45' }}
              >
                <div>
                  <p className="font-semibold text-white">
                    {u.display_name ?? u.discord_username ?? 'Unknown'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#6b7a99' }}>
                    Requested {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-xs px-3 py-1.5 rounded font-medium"
                    style={{ backgroundColor: '#166534', color: '#4ade80' }}
                  >
                    Approve
                  </button>
                  <button
                    className="text-xs px-3 py-1.5 rounded font-medium"
                    style={{ backgroundColor: '#7f1d1d', color: '#f87171' }}
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Character Claims ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold" style={{ color: '#c9a84c' }}>
            Character Claims
          </h2>
          {unclaimedCount !== null && (
            <span className="text-sm" style={{ color: '#6b7a99' }}>
              {unclaimedCount} of 187 characters still unclaimed
            </span>
          )}
        </div>

        {claimed.length === 0 ? (
          <p style={{ color: '#6b7a99' }}>No characters claimed yet.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#1e2a45' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#0d1326', color: '#6b7a99' }}>
                  <th className="text-left px-4 py-3 font-medium">Character</th>
                  <th className="text-left px-4 py-3 font-medium">Class</th>
                  <th className="text-left px-4 py-3 font-medium">Level</th>
                  <th className="text-left px-4 py-3 font-medium">Claimed By</th>
                  <th className="text-left px-4 py-3 font-medium">Claimed At</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {claimed.map((char, i) => {
                  const claimer = claimersById[char.claimed_by]
                  const classColor = CLASS_COLORS[char.class as CharacterClass] ?? '#888'
                  return (
                    <tr
                      key={char.id}
                      style={{ backgroundColor: i % 2 === 0 ? '#060b18' : '#0d1326', borderTop: '1px solid #1e2a45' }}
                    >
                      <td className="px-4 py-3 font-medium text-white">{char.name}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: classColor }} />
                          <span style={{ color: classColor }}>{char.class}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: '#8fa3c8' }}>{char.level}</td>
                      <td className="px-4 py-3" style={{ color: '#8fa3c8' }}>
                        {claimer?.display_name ?? claimer?.discord_username ?? char.claimed_by?.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3" style={{ color: '#6b7a99' }}>
                        {char.claimed_at ? new Date(char.claimed_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ReleaseButton characterId={char.id} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
