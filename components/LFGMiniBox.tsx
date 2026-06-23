'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DUNGEONS } from '@/data/dungeons/index'
import { useIsMobile } from '@/hooks/useIsMobile'

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

function CalendarBadge({ daysAvailable, timeStart }: {
  daysAvailable: string[] | null
  timeStart: string | null
}) {
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

type NameGroup = { tank: string[]; healer: string[]; dps: string[] }
type NumberGroup = { tank: number; healer: number; dps: number }
type RawGroup = NameGroup | NumberGroup | null

type LFGPost = {
  id: string
  user_id?: string
  dungeon_slug: string
  character_name: string
  role: string
  available_window: string | null
  days_available: string[] | null
  time_start: string | null
  time_end: string | null
  notes: string | null
  current_group: RawGroup
}

function normalizeGroup(group: RawGroup): NameGroup {
  if (!group) return { tank: [], healer: [], dps: [] }
  return {
    tank: Array.isArray(group.tank) ? group.tank : [],
    healer: Array.isArray(group.healer) ? group.healer : [],
    dps: Array.isArray(group.dps) ? group.dps : [],
  }
}

function getNeedsText(group: RawGroup): string {
  const g = normalizeGroup(group)
  const needsTank = g.tank.length === 0
  const needsHealer = g.healer.length === 0
  const needsDPS = g.dps.length < 3
  if (!needsTank && !needsHealer && !needsDPS) return 'Group is Full!'
  const needs: string[] = []
  if (needsTank) needs.push('Tank')
  if (needsHealer) needs.push('Heals')
  if (needsDPS) needs.push('DPS')
  if (needs.length === 3) return 'Needs All.'
  if (needs.length === 1) return `Need ${needs[0]} then GTG!`
  return `Needs ${needs[0]} + ${needs[1]}.`
}

function formatWindow(post: LFGPost): string {
  const days = post.days_available?.length
    ? post.days_available.join(', ')
    : (post.days_available !== null && post.days_available !== undefined)
    ? 'Any day' : null
  if (post.time_start && post.time_end)
    return `${days || 'Any day'}, ${post.time_start}–${post.time_end} Server Time`
  if (days) return days
  return post.available_window ?? ''
}

function formatDungeonName(slug: string): string {
  return DUNGEONS.find(d => d.id === slug)?.name ?? slug.replace(/-/g, ' ')
}

interface Props {
  title?: string
  columns?: number
  maxRows?: number
  maxItems?: number
  className?: string
  noScroll?: boolean
}

export default function LFGMiniBox({ title, columns = 3, maxRows = 2, maxItems, className = '', noScroll = false }: Props) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [posts, setPosts] = useState<LFGPost[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    fetch('/api/dungeons/lfg/active')
      .then(r => r.ok ? r.json() : [])
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  if (posts.length === 0) return null

  const displayPosts = maxItems ? posts.slice(0, maxItems) : posts
  const hoveredPost = posts.find(p => p.id === hoveredId)

  const CARD_HEIGHT = 140
  const GAP = 12
  const maxHeightVal = noScroll ? undefined : maxRows * CARD_HEIGHT + (maxRows - 1) * GAP

  function handleClick(post: LFGPost) {
    const el = document.getElementById(`lfg-full-${post.id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('lfg-card-highlight')
      setTimeout(() => el.classList.remove('lfg-card-highlight'), 1500)
    } else {
      router.push(`/dungeons/${post.dungeon_slug}?lfg=${post.id}`)
    }
  }

  function handleMouseEnter(e: React.MouseEvent, postId: string) {
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverPos({ x: rect.right + 12, y: rect.top })
    setHoveredId(postId)
  }

  return (
    <div className={className || 'lfg-mini-grid-wrap'}>
      {title && <div className="lfg-mini-grid-title">{title}</div>}
      <div
        className="lfg-mini-grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          ...(maxHeightVal !== undefined ? { maxHeight: `${maxHeightVal}px` } : {}),
        }}
      >
        {displayPosts.map(post => {
          const win = formatWindow(post)
          return (
            <div
              key={post.id}
              className="lfg-mini-card"
              onClick={() => handleClick(post)}
              onMouseEnter={!isMobile ? e => handleMouseEnter(e, post.id) : undefined}
              onMouseLeave={!isMobile ? () => setHoveredId(null) : undefined}
            >
              <CalendarBadge daysAvailable={post.days_available} timeStart={post.time_start} />
              <span className="lfg-mini-dungeon">{formatDungeonName(post.dungeon_slug)}</span>
              <span className="lfg-mini-caller">{post.role} · {post.character_name}</span>
              <span className="lfg-mini-needs">{getNeedsText(post.current_group)}</span>
              {win && <span className="lfg-mini-window">{win}</span>}
              <span className="lfg-mini-view">View →</span>
            </div>
          )
        })}
      </div>

      {hoveredPost && (() => {
        const g = normalizeGroup(hoveredPost.current_group)
        const win = formatWindow(hoveredPost)
        return (
          <div
            className="lfg-hover-card"
            style={{
              position: 'fixed',
              left: hoverPos.x,
              top: hoverPos.y,
              transform: 'translateY(-25%)',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          >
            <CalendarBadge daysAvailable={hoveredPost.days_available} timeStart={hoveredPost.time_start} />
            <h2 className="lfg-hover-dungeon">{formatDungeonName(hoveredPost.dungeon_slug)}</h2>
            <p className="lfg-hover-meta">
              {hoveredPost.role} {hoveredPost.character_name} is seeking more.{' '}
              <strong>{getNeedsText(hoveredPost.current_group)}</strong>
            </p>
            <div className="lfg-hover-roles">
              <div className="lfg-roles-left">
                <div className="lfg-hover-role">
                  <span className="lfg-hover-role-label">Tank</span>
                  {g.tank[0] ? <span className="lfg-hover-filled">{g.tank[0]}</span> : <span className="lfg-hover-need">NEED</span>}
                </div>
                <div className="lfg-hover-role">
                  <span className="lfg-hover-role-label">Healer</span>
                  {g.healer[0] ? <span className="lfg-hover-filled">{g.healer[0]}</span> : <span className="lfg-hover-need">NEED</span>}
                </div>
              </div>
              <div className="lfg-hover-role lfg-hover-role--dps">
                <span className="lfg-hover-role-label">DPS</span>
                {[0, 1, 2].map(i => (
                  <div key={i} className="lfg-hover-dps-slot">
                    <span className="lfg-hover-dps-num">DPS {i + 1}</span>
                    {g.dps[i] ? <span className="lfg-hover-filled">{g.dps[i]}</span> : <span className="lfg-hover-need">NEED</span>}
                  </div>
                ))}
              </div>
            </div>
            {win && <p className="lfg-hover-window">{win}</p>}
            {hoveredPost.notes && (
              <div className="lfg-hover-note">
                <span className="lfg-hover-note-label">Note:</span>
                <p className="lfg-hover-note-text">{hoveredPost.notes}</p>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
