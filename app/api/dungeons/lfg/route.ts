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
  const {
    dungeonSlug, dungeonName, role,
    daysAvailable, timeStart, timeEnd, timezoneLabel,
    notes, characterName,
  } = body

  if (!dungeonSlug || !role || !characterName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const windowSummary = buildWindowSummary(daysAvailable, timeStart, timeEnd)

  const initial_group = {
    tank: role === 'Tank' ? [characterName] : [],
    healer: role === 'Healer' ? [characterName] : [],
    dps: (role === 'DPS' || role === 'Flex') ? [characterName] : [],
  }

  const { data: post, error } = await service
    .from('dungeon_lfg')
    .insert({
      dungeon_slug: dungeonSlug,
      user_id: user.id,
      character_name: characterName,
      role,
      available_window: windowSummary,
      days_available: daysAvailable ?? null,
      time_start: timeStart || null,
      time_end: timeEnd || null,
      timezone_label: timezoneLabel || null,
      notes: notes || null,
      current_group: initial_group,
    })
    .select('id, character_name, role, available_window, notes, days_available, time_start, time_end, current_group')
    .single()

  if (error) {
    console.error('LFG insert error:', error)
    return NextResponse.json({ error: 'Failed to create LFG post' }, { status: 500 })
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (webhookUrl) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bladesedgeguild.com'
    const content = [
      `⚔️ **Dungeon Call: ${dungeonName}**`,
      `**${characterName}** is looking for more as **${role}**.`,
      windowSummary ? `Window: ${windowSummary}` : null,
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

function buildWindowSummary(
  days: string[] | null | undefined,
  start: string | null | undefined,
  end: string | null | undefined
): string | null {
  const dayStr = !days || days.length === 0 ? 'Any day' : days.join(', ')
  if (start && end) return `${dayStr}, ${start}–${end} Server Time`
  if (days && days.length > 0) return dayStr
  return null
}
