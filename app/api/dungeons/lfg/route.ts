import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { dungeonSlug, dungeonName, role, availableWindow, notes, characterName } = body

  if (!dungeonSlug || !role || !characterName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: post, error } = await service
    .from('dungeon_lfg')
    .insert({
      dungeon_slug: dungeonSlug,
      user_id: user.id,
      character_name: characterName,
      role,
      available_window: availableWindow || null,
      notes: notes || null,
    })
    .select('id, character_name, role, available_window, notes')
    .single()

  if (error) {
    console.error('LFG insert error:', error)
    return NextResponse.json({ error: 'Failed to create LFG post' }, { status: 500 })
  }

  // Send Discord webhook if configured
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (webhookUrl) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bladesedgeguild.com'
    const content = [
      `⚔️ **Dungeon Call: ${dungeonName}**`,
      `**${characterName}** is looking for more as **${role}**.`,
      availableWindow ? `Window: ${availableWindow}` : null,
      notes ? `Notes: ${notes}` : null,
      `Sign up: ${siteUrl}/dungeons/${dungeonSlug}`,
    ].filter(Boolean).join('\n')

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
    } catch {
      // Webhook failure is non-fatal
    }
  }

  return NextResponse.json(post)
}
