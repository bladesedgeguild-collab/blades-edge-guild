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

  const expiresAt = calculateExpiry(daysAvailable, timeEnd)

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
      expires_at: expiresAt.toISOString(),
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

function calculateExpiry(
  days: string[] | null | undefined,
  timeEnd: string | null | undefined
): Date {
  if (!days?.length || !timeEnd) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
  const match = timeEnd.match(/^(\d{1,2}):(\d{2})\s+(AM|PM)$/i)
  if (!match) return new Date(Date.now() + 24 * 60 * 60 * 1000)

  let h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12
  if (match[3].toUpperCase() === 'AM' && h === 12) h = 0

  const DAY_MAP: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }

  const now = new Date()
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Denver',
    weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false,
    year: 'numeric', month: 'numeric', day: 'numeric',
  })
  const parts = fmt.formatToParts(now)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '0'

  let mtHour = parseInt(get('hour'))
  if (mtHour === 24) mtHour = 0
  const mtMin = parseInt(get('minute'))
  const mtYear = parseInt(get('year'))
  const mtMonth = parseInt(get('month')) - 1
  const mtDay = parseInt(get('day'))
  const currentMtDayNum = DAY_MAP[get('weekday').substring(0, 3)] ?? 0

  const currentMtMin = mtHour * 60 + mtMin
  const targetMin = h * 60 + m

  let bestDaysAhead = Infinity
  for (const day of days) {
    const targetDayNum = DAY_MAP[day]
    if (targetDayNum === undefined) continue
    let daysAhead = (targetDayNum - currentMtDayNum + 7) % 7
    if (daysAhead === 0 && targetMin <= currentMtMin) daysAhead = 7
    if (daysAhead < bestDaysAhead) bestDaysAhead = daysAhead
  }

  if (!isFinite(bestDaysAhead)) return new Date(Date.now() + 24 * 60 * 60 * 1000)

  // MT offset from UTC (MT = UTC + offset, offset is negative)
  const nowUtcMin = now.getUTCHours() * 60 + now.getUTCMinutes()
  let mtOffset = currentMtMin - nowUtcMin
  while (mtOffset > 720) mtOffset -= 1440
  while (mtOffset < -720) mtOffset += 1440

  // UTC = MT time - mtOffset
  const targetUtcMs =
    Date.UTC(mtYear, mtMonth, mtDay + bestDaysAhead, h, m, 0, 0) - mtOffset * 60 * 1000

  const expiry = new Date(targetUtcMs)
  const maxExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return expiry > maxExpiry ? maxExpiry : expiry
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
