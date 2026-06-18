'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DUNGEONS } from '@/data/dungeons/index'

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
  if (needs.length === 1) return `Needs ${needs[0]}.`
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
              onMouseEnter={e => handleMouseEnter(e, post.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
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
