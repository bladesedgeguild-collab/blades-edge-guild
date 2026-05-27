import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'

type UserProfile = {
  id: string
  email: string
  discord_id: string | null
  discord_username: string | null
  discord_avatar: string | null
  claimed_character_id: string | null
  has_completed_onboarding: boolean | null
}

type MainChar = {
  id: string
  name: string
  class: string
  race: string | null
  level: number
  rank_name: string | null
}

type AltChar = {
  id: string
  name: string
  class: string
  race: string | null
  level: number
}

const CLASS_COLORS: Record<string, string> = {
  MAGE: '#3fc7eb', PALADIN: '#f48cba', WARRIOR: '#c69b3a',
  PRIEST: '#ffffff', DRUID: '#ff7c0a', HUNTER: '#aad372',
  ROGUE: '#fff468', WARLOCK: '#8788ee', SHAMAN: '#0070dd',
  DEATH_KNIGHT: '#c41e3a', MONK: '#00ff98', DEMON_HUNTER: '#a330c9',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profileRaw } = await admin
    .from('users')
    .select('discord_id, discord_username, discord_avatar, claimed_character_id, has_completed_onboarding')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as Omit<UserProfile, 'id' | 'email'> | null

  const isEmailUser = user.identities?.every(i => i.provider === 'email') ?? true
  const email = user.email ?? ''

  let mainChar: MainChar | null = null
  let alts: AltChar[] = []

  if (profile?.claimed_character_id) {
    const { data: charData } = await admin
      .from('characters')
      .select('id, name, class, race, level, rank_name')
      .eq('id', profile.claimed_character_id)
      .single()
    mainChar = charData as unknown as MainChar

    const { data: altData } = await admin
      .from('characters')
      .select('id, name, class, race, level')
      .eq('claimed_by', user.id)
      .neq('id', profile.claimed_character_id)
      .order('name', { ascending: true })
    alts = (altData ?? []) as unknown as AltChar[]
  }

  const classColors = CLASS_COLORS

  return (
    <SettingsClient
      userId={user.id}
      email={email}
      isEmailUser={isEmailUser}
      discordId={profile?.discord_id ?? null}
      discordUsername={profile?.discord_username ?? null}
      discordAvatar={profile?.discord_avatar ?? null}
      mainChar={mainChar}
      alts={alts}
      classColors={classColors}
    />
  )
}
