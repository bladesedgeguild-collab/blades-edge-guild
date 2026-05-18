import { createClient } from '@/lib/supabase/server'

export default async function ApprovalsPage() {
  const supabase = await createClient()

  const { data: pending } = await supabase
    .from('users')
    .select('id, discord_username, display_name, created_at')
    .eq('role', 'pending')
    .order('created_at', { ascending: true })

  return (
    <div>
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
    </div>
  )
}
