import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, discord_username, role')
    .eq('id', user?.id ?? '')
    .single()

  const params = await searchParams
  const isPending = params.pending === 'true' || profile?.role === 'pending'

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2" style={{ color: '#c9a84c' }}>
        Welcome, {profile?.display_name ?? profile?.discord_username ?? 'Adventurer'}
      </h1>

      {isPending ? (
        <div
          className="mt-6 rounded-lg border p-6"
          style={{ backgroundColor: '#0d1326', borderColor: '#1e2a45' }}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: '#c9a84c' }}>
            Awaiting Approval
          </h2>
          <p style={{ color: '#8fa3c8' }}>
            Your account is pending officer approval. You will be notified once access is granted.
          </p>
        </div>
      ) : (
        <div
          className="mt-6 rounded-lg border p-6"
          style={{ backgroundColor: '#0d1326', borderColor: '#1e2a45' }}
        >
          <p style={{ color: '#8fa3c8' }}>
            You're logged in. More guild features coming soon.
          </p>
        </div>
      )}
    </div>
  )
}
