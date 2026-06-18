import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await service
    .from('dungeon_lfg')
    .select('id, user_id, dungeon_slug, character_name, role, available_window, days_available, time_start, time_end, notes, current_group')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}
