import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isOfficerUser } from '@/lib/officer'
import { GUILD } from '@/lib/guild-config'
import {
  normalizeUploaded,
  planRosterSync,
  ROSTER_SYNC_COLUMNS,
  type SyncDbRow,
  type UploadedChar,
} from '@/lib/roster-sync'

/** Preview only. Reads the roster (never note or last_zone) and writes nothing. */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (!(await isOfficerUser(admin, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const uploaded: UploadedChar[] = normalizeUploaded(body.characters ?? (Array.isArray(body) ? body : []))

  if (uploaded.length === 0) {
    return NextResponse.json({ error: 'No characters in payload' }, { status: 400 })
  }

  const { data, error } = await admin.from('characters').select(ROSTER_SYNC_COLUMNS)
  if (error) return NextResponse.json({ error: `Could not read the roster: ${error.message}` }, { status: 500 })

  const plan = planRosterSync(uploaded, (data ?? []) as unknown as SyncDbRow[], GUILD.ruleset)

  return NextResponse.json({
    new: plan.inserts.map((i) => ({
      status: 'NEW',
      name: i.name,
      change: [i.uc.race, i.uc.class, i.uc.level != null ? `L${i.uc.level}` : null, i.fields.rank_name ?? 'no rank']
        .filter(Boolean).join(' '),
    })),
    updated: plan.updates.map((u) => ({
      status: 'UPDATED',
      dbName: u.name,
      uploadedName: u.name,
      change: u.changes.join(', '),
      dbId: u.id,
    })),
    unchanged: plan.unchanged,
    renames: plan.renames,
    missing: plan.leaving.map((m) => ({ ...m, willFlag: !plan.leaveFlagBlocked })),
    notInGrm: plan.notInGrm,
    conflicts: plan.conflicts,
    duplicates: plan.duplicates,
    leaveFlagBlocked: plan.leaveFlagBlocked,
    hasLastOnline: true,
  })
}
