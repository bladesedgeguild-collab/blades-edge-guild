import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getDungeon } from '@/data/dungeons/index'
import DungeonDetail from './DungeonDetail'
import { fullName } from '@/lib/names'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lfg?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const dungeon = getDungeon(slug)
  if (!dungeon) return { title: 'Dungeon Not Found | Blades Edge' }
  return {
    title: `${dungeon.name} | Blades Edge Dungeon Finder`,
    description: dungeon.summary,
  }
}

export default async function DungeonPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { lfg: lfgId } = await searchParams
  const dungeon = getDungeon(slug)
  if (!dungeon) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole: string | undefined
  let playerLevel: number | null = null
  let userChars: { id: string; name: string; level: number; class: string; is_main: boolean; roles: string[] | null }[] = []
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('claimed_character_id, display_name, role')
      .eq('id', user.id)
      .single()

    userRole = (profile as { role?: string } | null)?.role ?? undefined

    const { data: chars } = await supabase
      .from('characters')
      .select('id, name, last_name, level, class, is_main, roles')
      .eq('claimed_by', user.id)
      .order('is_main', { ascending: false })
    const rows = chars ?? await supabase
      .from('characters')
      .select('id, name, last_name, level, class, is_main')
      .eq('claimed_by', user.id)
      .order('is_main', { ascending: false })
      .then(result => result.data)
    userChars = (rows ?? []).map((c) => ({
      id: c.id,
      name: fullName(c.name, c.last_name),
      level: c.level,
      class: c.class,
      is_main: c.is_main,
      roles: 'roles' in c ? (c.roles as string[] | null) : null,
    }))
    const main = userChars.find(character => character.is_main) ?? userChars[0]
    if (profile?.claimed_character_id) {
      const claimed = userChars.find(character => character.id === profile.claimed_character_id)
      playerLevel = claimed?.level ?? main?.level ?? null
    } else {
      playerLevel = main?.level ?? null
    }
  }

  // Fetch active LFG posts for this dungeon
  const { data: activePosts } = await supabase
    .from('dungeon_lfg')
    .select('id, character_name, role, available_window, notes, starts_at, ends_at')
    .eq('dungeon_slug', slug)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  // Fetch featured LFG post if lfg param present
  let featuredLFG = null
  if (lfgId) {
    const adminDb = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await adminDb
      .from('dungeon_lfg')
      .select('id, user_id, character_name, role, available_window, notes, current_group, starts_at, ends_at, needs')
      .eq('id', lfgId)
      .gt('expires_at', new Date().toISOString())
      .single()
    if (data) {
      const { user_id: ownerId, ...rest } = data
      featuredLFG = { ...rest, is_owner: ownerId === user?.id }
    }
  }

  return (
    <DungeonDetail
      dungeon={dungeon}
      initialPosts={activePosts ?? []}
      isLoggedIn={!!user}
      featuredLFG={featuredLFG}
      isOfficer={['admin', 'officer', 'gm'].includes(userRole ?? '')}
      userChars={userChars}
      playerLevel={playerLevel}
    />
  )
}
