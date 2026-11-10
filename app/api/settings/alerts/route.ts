import { NextResponse } from 'next/server'
import { effectiveRoles, type LfgRole } from '@/lib/roles'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

type CharacterInput = { id?: string; roles?: string[] }

export async function PUT(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as {
    siteBanner?: boolean
    discordMentions?: boolean
    matchCharacterIds?: string[] | null
    characters?: CharacterInput[]
  } | null
  if (!body || typeof body.siteBanner !== 'boolean' || typeof body.discordMentions !== 'boolean') {
    return NextResponse.json({ error: 'Invalid alert settings.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin.from('users').select('discord_id').eq('id', user.id).maybeSingle()
  const { data: owned } = await admin
    .from('characters')
    .select('id, class')
    .eq('claimed_by', user.id)
  const mine = (owned ?? []) as { id: string; class: string }[]
  const mineIds = new Set(mine.map(character => character.id))

  const requested = body.matchCharacterIds
  if (requested != null && !Array.isArray(requested)) {
    return NextResponse.json({ error: 'Invalid character list.' }, { status: 400 })
  }
  const matchIds = requested?.filter(id => mineIds.has(id)) ?? null
  const matchAll = matchIds == null || (mineIds.size > 0 && matchIds.length === mineIds.size)

  const prefs = await admin.from('notification_prefs').upsert({
    user_id: user.id,
    site_banner: body.siteBanner,
    discord_mentions: profile?.discord_id ? body.discordMentions : false,
    match_character_ids: matchAll ? null : matchIds,
    updated_at: new Date().toISOString(),
  })
  if (prefs.error) {
    console.error('alert prefs', prefs.error)
    return NextResponse.json({ error: 'Could not save alert settings. Apply the latest database migration first.' }, { status: 500 })
  }

  for (const row of body.characters ?? []) {
    if (!row.id || !mineIds.has(row.id) || !Array.isArray(row.roles)) continue
    const character = mine.find(item => item.id === row.id)
    if (!character) continue
    const allowed = new Set(effectiveRoles(character.class, null))
    const roles = row.roles.filter((role): role is LfgRole => allowed.has(role as LfgRole))
    if (roles.length === 0) continue
    const updated = await admin.from('characters').update({ roles }).eq('id', row.id).eq('claimed_by', user.id)
    if (updated.error) {
      console.error('character roles', updated.error)
      return NextResponse.json({ error: 'Could not save character roles. Apply the latest database migration first.' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
