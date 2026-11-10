'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { DUNGEONS, getDungeon } from '@/data/dungeons/index'
import { memberName, needsSummary, normalizeGroup as sharedGroup, resolveNeeds } from '@/lib/lfg-group'
import { formatRange, localFieldsFromInstant, SERVER_TIME_ZONE } from '@/lib/lfg-time'
import { ScheduleFields } from '@/components/lfg/ScheduleFields'

const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

function getNextOccurrence(
  daysAvailable: string[] | null,
  timeStart: string | null
): { label: string; countdown: string } {
  if (!daysAvailable?.length || daysAvailable.includes('Any') || !timeStart) {
    return { label: 'ANY DAY', countdown: 'Flexible' }
  }

  const now = new Date()
  const [time, ampm] = timeStart.split(' ')
  const [h, m] = time.split(':').map(Number)
  let hours = h
  if (ampm === 'PM' && h !== 12) hours += 12
  if (ampm === 'AM' && h === 12) hours = 0

  let soonest: Date | null = null
  for (const day of daysAvailable) {
    const targetDay = DAY_MAP[day]
    if (targetDay === undefined) continue
    const target = new Date()
    const daysUntil = (targetDay - now.getDay() + 7) % 7
    target.setDate(target.getDate() + daysUntil)
    target.setHours(hours + 6, m, 0, 0)
    if (target <= now) target.setDate(target.getDate() + 7)
    if (!soonest || target < soonest) soonest = target
  }

  if (!soonest) return { label: 'SOON', countdown: '' }

  const dayAbbr = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][soonest.getDay()]
  const label = `${dayAbbr} ${soonest.getDate()}`

  const diff = soonest.getTime() - now.getTime()
  const totalHours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hrs = totalHours % 24

  let countdown = ''
  if (days > 0) countdown = `in ${days}d ${hrs}h`
  else if (hrs > 0) countdown = `in ${hrs}h`
  else countdown = 'Starting soon'

  return { label, countdown }
}

function CalendarBadge({ daysAvailable, timeStart, startsAt }: {
  daysAvailable: string[] | null
  timeStart: string | null
  startsAt?: string | null
}) {
  if (startsAt) {
    const when = new Date(startsAt)
    const label = when.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
    const diff = when.getTime() - new Date().getTime()
    const totalHours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)))
    const days = Math.floor(totalHours / 24)
    const hrs = totalHours % 24
    const countdown = diff <= 0 ? 'Starting soon' : days > 0 ? `in ${days}d ${hrs}h` : hrs > 0 ? `in ${hrs}h` : 'Starting soon'
    return (
      <div className="lfg-cal-badge">
        <div className="lfg-cal-day">{label}</div>
        <div className="lfg-cal-countdown">{countdown}</div>
      </div>
    )
  }
  const { label, countdown } = getNextOccurrence(daysAvailable, timeStart)
  const isMultiDay = (daysAvailable?.length ?? 0) > 1 && !daysAvailable?.includes('Any')

  return (
    <div className="lfg-cal-badge">
      {isMultiDay ? (
        <div className="lfg-cal-days-row">
          {daysAvailable!.map(day => (
            <span key={day} className="lfg-cal-day-pill">{day.toUpperCase()}</span>
          ))}
        </div>
      ) : (
        <div className="lfg-cal-day">{label}</div>
      )}
      {countdown && <div className="lfg-cal-countdown">{countdown}</div>}
    </div>
  )
}

const TankIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2L3 6.5v6C3 17.5 7 21.5 12 23c5-1.5 9-5.5 9-10.5v-6L12 2z"
      fill="rgba(201,150,26,0.25)"
      stroke="#c9961a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M12 7v10M8 12h8" stroke="#c9961a" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

const HealerIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="8" y="2" width="4" height="16" rx="2" fill="#1aff6e" opacity="0.85" />
    <rect x="2" y="8" width="16" height="4" rx="2" fill="#1aff6e" opacity="0.85" />
  </svg>
)

const DPSIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <line x1="4" y1="16" x2="16" y2="4" stroke="#3fc7eb" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M14 3l3 0 0 3" stroke="#3fc7eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 17l2-2" stroke="#3fc7eb" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

type NameGroup = { tank: string[]; healer: string[]; dps: string[] }
type NumberGroup = { tank: number; healer: number; dps: number }

export type LFGPost = {
  id: string
  is_owner?: boolean
  dungeon_slug: string
  character_name: string
  role: string
  available_window: string | null
  days_available: string[] | null
  time_start: string | null
  time_end: string | null
  notes: string | null
  starts_at?: string | null
  ends_at?: string | null
  needs?: { tank: number; healer: number; dps: number } | null
  current_group: NameGroup | NumberGroup | null
}

function normalizeGroup(group: LFGPost['current_group']): NameGroup {
  const shared = sharedGroup(group)
  return {
    tank: shared.tank.map(member => memberName(member)),
    healer: shared.healer.map(member => memberName(member)),
    dps: shared.dps.map(member => memberName(member)),
  }
}

function postNeeds(post: LFGPost) {
  const dungeon = getDungeon(post.dungeon_slug) ?? DUNGEONS.find(item => item.id === post.dungeon_slug)
  const fallback = dungeon
    ? { tank: dungeon.groupComp.tank, healer: dungeon.groupComp.healer, dps: dungeon.groupComp.dps }
    : { tank: 1, healer: 1, dps: 3 }
  return resolveNeeds(post.needs, fallback)
}

function getNeedsText(post: LFGPost): string {
  return needsSummary(postNeeds(post), sharedGroup(post.current_group))
}

function formatWindow(post: LFGPost): string {
  if (post.starts_at && typeof window !== 'undefined') {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return `${formatRange(post.starts_at, post.ends_at, zone)} · Server ${formatRange(post.starts_at, post.ends_at, SERVER_TIME_ZONE)}`
  }
  const days = post.days_available?.length
    ? post.days_available.join(', ')
    : post.days_available !== null && post.days_available !== undefined
    ? 'Any day' : null
  if (post.time_start && post.time_end)
    return `${days || 'Any day'}, ${post.time_start}–${post.time_end} Server Time`
  if (days) return days
  return post.available_window ?? ''
}

function formatDungeonName(slug: string): string {
  return DUNGEONS.find(d => d.id === slug)?.name ?? slug.replace(/-/g, ' ')
}

interface EditFormProps {
  post: LFGPost
  onSave: (updates: Partial<LFGPost> & { available_window: string | null }) => void
  onCancel: () => void
}

function LFGEditForm({ post, onSave, onCancel }: EditFormProps) {
  const zone = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'America/Denver'
  const initial = post.starts_at ? localFieldsFromInstant(post.starts_at, zone) : { date: '', time: '' }
  const initialEnd = post.ends_at ? localFieldsFromInstant(post.ends_at, zone).time : ''
  const [date, setDate] = useState(initial.date)
  const [timeStart, setTimeStart] = useState(initial.time)
  const [timeEnd, setTimeEnd] = useState(initialEnd)
  const [notes, setNotes] = useState(post.notes ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    onSave({
      notes: notes || null,
      available_window: null,
      date,
      start: timeStart,
      end: timeEnd || null,
      timeZone: zone,
    } as Partial<LFGPost> & { available_window: string | null })
  }

  return (
    <form className="lfg-edit-form" onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
      <ScheduleFields
        date={date}
        start={timeStart}
        end={timeEnd}
        onChange={next => { setDate(next.date); setTimeStart(next.start); setTimeEnd(next.end) }}
      />
      <textarea className="lfg-edit-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." rows={2} />
      <div className="lfg-edit-actions">
        <button type="submit" className="lfg-edit-save-btn">Save</button>
        <button type="button" className="lfg-edit-cancel-form-btn" onClick={e => { e.stopPropagation(); onCancel() }}>Cancel</button>
      </div>
    </form>
  )
}

export default function ActiveLFGCalls() {
  const router = useRouter()
  const [posts, setPosts] = useState<LFGPost[]>([])
  const [userRole, setUserRole] = useState<string | undefined>()
  const [editingId, setEditingId] = useState<string | null>(null)

  const isAdmin = ['admin', 'officer', 'gm'].includes(userRole ?? '')

  useEffect(() => {
    fetch('/api/dungeons/lfg/active')
      .then(r => r.ok ? r.json() : [])
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => {})

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('users').select('role').eq('id', session.user.id).single()
          .then(({ data }) => { if (data?.role) setUserRole(data.role) })
      }
    })
  }, [])

  async function handleCancel(postId: string) {
    try {
      const res = await fetch(`/api/dungeons/lfg/${postId}`, { method: 'DELETE' })
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId))
      }
    } catch {
      // Non-fatal
    }
  }

  async function handleSave(postId: string, updates: Partial<LFGPost> & { available_window: string | null }) {
    try {
      const res = await fetch(`/api/dungeons/lfg/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p))
        setEditingId(null)
      }
    } catch {
      // Non-fatal
    }
  }

  return (
    <section className="lfg-big-section">
      <h2 className="lfg-big-heading">Active Dungeon Calls</h2>
      {posts.length === 0 ? (
        <p className="active-lfg-empty">
          No active dungeon calls right now. Be the first to Raise the Banner.
        </p>
      ) : (
        <div className="active-lfg-grid">
          {posts.map(post => {
            const group = normalizeGroup(post.current_group)
            const needsText = getNeedsText(post)
            const win = formatWindow(post)
            const isOwner = !!post.is_owner
            const caps = postNeeds(post)

            return (
              <div
                id={`lfg-full-${post.id}`}
                key={post.id}
                className="lfg-big-card"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/dungeons/${post.dungeon_slug}?lfg=${post.id}`)}
              >
                <CalendarBadge daysAvailable={post.days_available} timeStart={post.time_start} startsAt={post.starts_at} />
                <Link
                  href={`/dungeons/${post.dungeon_slug}`}
                  className="lfg-card-dungeon-link"
                  onClick={e => e.stopPropagation()}
                >
                  {formatDungeonName(post.dungeon_slug)}
                </Link>
                <div className="lfg-big-meta">
                  <strong>{post.role} {post.character_name}</strong> is seeking more.{' '}
                  <span className="lfg-needs-text">{needsText}</span>
                </div>
                {win && <div className="lfg-big-window">{win}</div>}

                {/* 2-column role layout */}
                <div className="lfg-roles-2col">
                  <div className="lfg-roles-left">
                    <div className="lfg-role-block">
                      <div className="lfg-role-header">
                        <span className="lfg-role-icon lfg-role-icon--tank"><TankIcon size={28} /></span>
                        <span className="lfg-role-label">Tank</span>
                      </div>
                      <div className="lfg-role-slot">
                        {group.tank[0]
                          ? <span className="lfg-slot-name">{group.tank[0]}</span>
                          : <span className="lfg-slot-need">NEED</span>
                        }
                      </div>
                    </div>
                    <div className="lfg-role-block">
                      <div className="lfg-role-header">
                        <span className="lfg-role-icon lfg-role-icon--healer"><HealerIcon size={28} /></span>
                        <span className="lfg-role-label">Healer</span>
                      </div>
                      <div className="lfg-role-slot">
                        {group.healer[0]
                          ? <span className="lfg-slot-name">{group.healer[0]}</span>
                          : <span className="lfg-slot-need">NEED</span>
                        }
                      </div>
                    </div>
                  </div>

                  <div className="lfg-role-block lfg-role-block--dps">
                    <div className="lfg-role-header">
                      <span className="lfg-role-icon lfg-role-icon--dps"><DPSIcon size={28} /></span>
                      <span className="lfg-role-label">DPS</span>
                    </div>
                    {(caps.dps > 5 ? [0] : Array.from({ length: Math.max(caps.dps, 1) }, (_, i) => i)).map(i => (
                      <div key={i} className="lfg-role-slot">
                        <span className="lfg-dps-label">{caps.dps > 5 ? `DPS ${group.dps.length}/${caps.dps}` : `DPS ${i + 1}:`}</span>
                        {caps.dps > 5
                          ? <span className="lfg-slot-name">{group.dps.join(', ') || 'NEED'}</span>
                          : group.dps[i]
                            ? <span className="lfg-slot-name">{group.dps[i]}</span>
                            : <span className="lfg-slot-need">NEED</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {post.notes && <p className="lfg-big-notes">{post.notes}</p>}

                {editingId === post.id ? (
                  <LFGEditForm
                    post={post}
                    onSave={updates => handleSave(post.id, updates)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="lfg-big-footer">
                    <Link
                      href={`/dungeons/${post.dungeon_slug}?lfg=${post.id}`}
                      className="lfg-big-link"
                      onClick={e => e.stopPropagation()}
                    >
                      Answer the Call
                    </Link>
                    {(isOwner || isAdmin) && (
                      <>
                        <button className="lfg-edit-btn" onClick={e => { e.stopPropagation(); setEditingId(post.id) }}>
                          Edit
                        </button>
                        <button className="lfg-cancel-btn" onClick={e => { e.stopPropagation(); handleCancel(post.id) }}>
                          Cancel Request
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

    </section>
  )
}
