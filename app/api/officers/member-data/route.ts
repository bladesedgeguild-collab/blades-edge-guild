import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isOfficerUser(admin: any, userId: string): Promise<boolean> {
  const { data: profileRaw } = await admin
    .from('users')
    .select('role, claimed_character_id')
    .eq('id', userId)
    .single()
  const profile = profileRaw as { role: string | null; claimed_character_id: string | null } | null

  if (['admin', 'gm', 'officer'].includes(profile?.role ?? '')) return true

  if (profile?.claimed_character_id) {
    const { data: charRaw } = await admin
      .from('characters')
      .select('rank_index')
      .eq('id', profile.claimed_character_id)
      .single()
    const char = charRaw as { rank_index: number | null } | null
    if (char?.rank_index != null && char.rank_index <= 3) return true
  }
  return false
}

export async function GET() {
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

  // Fetch all users and all claimed characters in parallel
  const [{ data: usersRaw }, { data: claimedCharsRaw }] = await Promise.all([
    admin
      .from('users')
      .select('id, display_name, discord_username, role, has_completed_onboarding, claimed_character_id, created_at')
      .order('created_at', { ascending: false }),
    admin
      .from('characters')
      .select('id, name, class, claimed_by, claimed_at')
      .not('claimed_by', 'is', null)
      .order('claimed_at', { ascending: false }),
  ])

  const users = (usersRaw ?? []) as {
    id: string
    display_name: string | null
    discord_username: string | null
    role: string
    has_completed_onboarding: boolean
    claimed_character_id: string | null
    created_at: string
  }[]

  const claimedChars = (claimedCharsRaw ?? []) as {
    id: string
    name: string
    class: string
    claimed_by: string | null
    claimed_at: string | null
  }[]

  // Fetch main chars for completed members
  const mainCharIds = users
    .filter((u) => u.claimed_character_id && u.has_completed_onboarding)
    .map((u) => u.claimed_character_id as string)

  let mainCharsById: Record<string, { id: string; name: string; class: string }> = {}
  if (mainCharIds.length > 0) {
    const { data: mainCharsRaw } = await admin
      .from('characters')
      .select('id, name, class')
      .in('id', mainCharIds)
    mainCharsById = Object.fromEntries((mainCharsRaw ?? []).map((c) => [c.id, c]))
  }

  const usersById = Object.fromEntries(users.map((u) => [u.id, u]))

  // Compute alts count per user (claimed chars that are NOT the user's main)
  const altsByUser = new Map<string, number>()
  for (const c of claimedChars) {
    if (!c.claimed_by) continue
    const owner = usersById[c.claimed_by]
    if (!owner) continue
    if (c.id !== owner.claimed_character_id) {
      altsByUser.set(c.claimed_by, (altsByUser.get(c.claimed_by) ?? 0) + 1)
    }
  }

  // Section A: all claimed characters
  const claims = claimedChars.map((c) => {
    const claimer = c.claimed_by ? usersById[c.claimed_by] : null
    return {
      id: c.id,
      name: c.name,
      class: c.class,
      claimed_at: c.claimed_at,
      claimer: claimer
        ? { id: claimer.id, display_name: claimer.display_name, role: claimer.role }
        : null,
    }
  })

  // Section B: completed members
  const members = users
    .filter((u) => u.has_completed_onboarding)
    .map((u) => ({
      id: u.id,
      display_name: u.display_name,
      discord_username: u.discord_username,
      role: u.role,
      created_at: u.created_at,
      main_char: u.claimed_character_id ? (mainCharsById[u.claimed_character_id] ?? null) : null,
      alts_count: altsByUser.get(u.id) ?? 0,
    }))

  // Section C: pending/stuck users
  const pending = users
    .filter((u) => !u.has_completed_onboarding)
    .map((u) => ({
      id: u.id,
      display_name: u.display_name,
      discord_username: u.discord_username,
      created_at: u.created_at,
    }))

  return NextResponse.json({ claims, members, pending })
}
