import { NextRequest, NextResponse } from 'next/server'
import type { Dungeon } from '@/lib/dungeon-schema'
import { isOfficerUser } from '@/lib/officer'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createAdminClient()
  if (!(await isOfficerUser(adminClient, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let dungeons: Dungeon[]
  try {
    dungeons = await request.json()
    if (!Array.isArray(dungeons)) {
      return NextResponse.json({ error: 'Expected a JSON array of dungeon objects.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const errors: string[] = []
  let imported = 0

  for (const dungeon of dungeons) {
    if (!dungeon.id || !dungeon.name || dungeon.min_level == null || dungeon.max_level == null) {
      errors.push(`Skipped "${dungeon.name ?? dungeon.id ?? '?'}": missing required fields (id, name, min_level, max_level).`)
      continue
    }
    const { error } = await adminClient
      .from('dungeons')
      .upsert({ ...dungeon, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    if (error) {
      errors.push(`Failed to import "${dungeon.name}": ${error.message}`)
    } else {
      imported++
    }
  }

  return NextResponse.json({ imported, total: dungeons.length, errors })
}
