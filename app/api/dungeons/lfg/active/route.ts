import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

const PUBLIC_COLUMNS = 'id, dungeon_slug, character_name, role, available_window, days_available, time_start, time_end, notes, current_group, starts_at, ends_at, needs'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  const first = await admin
    .from('dungeon_lfg')
    .select(`user_id, ${PUBLIC_COLUMNS}`)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  const second = first.error
    ? await admin
      .from('dungeon_lfg')
      .select('user_id, id, dungeon_slug, character_name, role, available_window, days_available, time_start, time_end, notes, current_group')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    : null

  const rows = ((second?.data ?? first.data ?? []) as Array<{ user_id: string } & Record<string, unknown>>).map(row => {
    const { user_id: ownerId, ...rest } = row
    return { ...rest, is_owner: !!user && ownerId === user.id }
  })
  return NextResponse.json(rows)
}
