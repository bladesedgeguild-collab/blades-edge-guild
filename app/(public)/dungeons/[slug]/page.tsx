import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDungeon } from '@/data/dungeons/index'
import DungeonDetail from './DungeonDetail'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const dungeon = getDungeon(slug)
  if (!dungeon) return { title: 'Dungeon Not Found — Blådes Edge' }
  return {
    title: `${dungeon.name} — Blådes Edge Dungeon Finder`,
    description: dungeon.summary,
  }
}

export default async function DungeonPage({ params }: Props) {
  const { slug } = await params
  const dungeon = getDungeon(slug)
  if (!dungeon) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let characterName: string | undefined
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('claimed_character_id, display_name')
      .eq('id', user.id)
      .single()

    if (profile?.claimed_character_id) {
      const { data: char } = await supabase
        .from('characters')
        .select('name')
        .eq('id', profile.claimed_character_id)
        .single()
      characterName = char?.name ?? profile?.display_name ?? undefined
    } else {
      characterName = profile?.display_name ?? undefined
    }
  }

  // Fetch active LFG posts for this dungeon
  const { data: activePosts } = await supabase
    .from('dungeon_lfg')
    .select('id, character_name, role, available_window, notes')
    .eq('dungeon_slug', slug)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return (
    <DungeonDetail
      dungeon={dungeon}
      initialPosts={activePosts ?? []}
      isLoggedIn={!!user}
      characterName={characterName}
    />
  )
}
