'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DUNGEONS } from '@/data/dungeons/index'

const TankIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2L3 6.5v6C3 17.5 7 21.5 12 23c5-1.5 9-5.5 9-10.5v-6L12 2z"
      fill="rgba(201,150,26,0.25)"
      stroke="#c9961a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M12 7v10M8 12h8"
      stroke="#c9961a"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)

const HealerIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <rect x="8" y="2" width="4" height="16" rx="2" fill="#1aff6e" opacity="0.85"/>
    <rect x="2" y="8" width="16" height="4" rx="2" fill="#1aff6e" opacity="0.85"/>
  </svg>
)

const DPSIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <line x1="4" y1="16" x2="16" y2="4" stroke="#3fc7eb" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M14 3l3 0 0 3" stroke="#3fc7eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 17l2-2" stroke="#3fc7eb" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

type NameGroup = { tank: string[]; healer: string[]; dps: string[] }
type NumberGroup = { tank: number; healer: number; dps: number }

export type LFGPost = {
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
  current_group: NameGroup | NumberGroup | null
}

function normalizeGroup(group: LFGPost['current_group']): NameGroup {
  if (!group) return { tank: [], healer: [], dps: [] }
  return {
    tank: Array.isArray(group.tank) ? group.tank : [],
    healer: Array.isArray(group.healer) ? group.healer : [],
    dps: Array.isArray(group.dps) ? group.dps : [],
  }
}

function getNeedsText(group: NameGroup): string {
  const needsTank = !group.tank || group.tank.length === 0
  const needsHealer = !group.healer || group.healer.length === 0
  const needsDPS = !group.dps || group.dps.length < 3

  if (!needsTank && !needsHealer && !needsDPS) return 'Group is Full!'

  const needs: string[] = []
  if (needsTank) needs.push('Tank')
  if (needsHealer) needs.push('Heals')
  if (needsDPS) needs.push('DPS')

  if (needs.length === 3) return 'Needs All.'
  if (needs.length === 1) return `Needs ${needs[0]} then Good To Go.`
  return `Needs ${needs[0]} and ${needs[1]}.`
}

function formatWindow(post: LFGPost): string {
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

interface Props {
  posts: LFGPost[]
  userId?: string
  userRole?: string
}

export default function ActiveLFGCalls({ posts: initialPosts, userId, userRole }: Props) {
  const [posts, setPosts] = useState<LFGPost[]>(initialPosts)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })

  const isAdmin = ['admin', 'officer', 'gm'].includes(userRole ?? '')

  async function handleDelete(postId: string) {
    try {
      const res = await fetch(`/api/dungeons/lfg/${postId}`, { method: 'DELETE' })
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId))
        if (hoveredId === postId) setHoveredId(null)
      }
    } catch {
      // Non-fatal
    }
  }

  function handleMouseEnter(e: React.MouseEvent, postId: string) {
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverPos({ x: rect.left + rect.width / 2, y: rect.top })
    setHoveredId(postId)
  }

  const hoveredPost = posts.find(p => p.id === hoveredId)

  return (
    <section className="lfg-big-section">
      <h2 className="lfg-big-heading">Active Dungeon Calls</h2>
      {posts.length === 0 ? (
        <p className="active-lfg-empty">
          No active dungeon calls right now. Be the first to Raise the Banner.
        </p>
      ) : (
        posts.map(post => {
          const group = normalizeGroup(post.current_group)
          const needsText = getNeedsText(group)
          const window = formatWindow(post)
          const isOwner = !!userId && post.user_id === userId

          return (
            <div
              key={post.id}
              className="lfg-big-card"
              onMouseEnter={(e) => handleMouseEnter(e, post.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <h3 className="lfg-big-dungeon">{formatDungeonName(post.dungeon_slug)}</h3>
              <div className="lfg-big-meta">
                <strong>{post.role} {post.character_name}</strong> is seeking more.{' '}
                <span className="lfg-needs-text">{needsText}</span>
              </div>
              {window && <div className="lfg-big-window">{window}</div>}

              <div className="lfg-big-roles">
                <div className="lfg-role-block">
                  <div className="lfg-role-header">
                    <span className="lfg-role-icon lfg-role-icon--tank">
                      <TankIcon size={32} />
                    </span>
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
                    <span className="lfg-role-icon lfg-role-icon--healer">
                      <HealerIcon size={32} />
                    </span>
                    <span className="lfg-role-label">Healer</span>
                  </div>
                  <div className="lfg-role-slot">
                    {group.healer[0]
                      ? <span className="lfg-slot-name">{group.healer[0]}</span>
                      : <span className="lfg-slot-need">NEED</span>
                    }
                  </div>
                </div>

                <div className="lfg-role-block lfg-role-block--dps">
                  <div className="lfg-role-header">
                    <span className="lfg-role-icon lfg-role-icon--dps">
                      <DPSIcon size={32} />
                    </span>
                    <span className="lfg-role-label">DPS</span>
                  </div>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="lfg-role-slot">
                      <span className="lfg-dps-label">DPS {i + 1}:</span>
                      {group.dps[i]
                        ? <span className="lfg-slot-name">{group.dps[i]}</span>
                        : <span className="lfg-slot-need">NEED</span>
                      }
                    </div>
                  ))}
                </div>
              </div>

              {post.notes && <p className="lfg-big-notes">{post.notes}</p>}

              <div className="lfg-big-footer">
                <Link href={`/dungeons/${post.dungeon_slug}`} className="lfg-big-link">
                  Answer the Call
                </Link>
                {(isOwner || isAdmin) && (
                  <button
                    className="lfg-delete-btn"
                    onClick={() => handleDelete(post.id)}
                    title="Remove this LFG post"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}

      {/* Hover expansion card */}
      {hoveredPost && (() => {
        const g = normalizeGroup(hoveredPost.current_group)
        return (
          <div
            className="lfg-hover-card"
            style={{
              position: 'fixed',
              left: hoverPos.x,
              top: hoverPos.y - 16,
              transform: 'translate(-50%, -100%)',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          >
            <h2 className="lfg-hover-dungeon">{formatDungeonName(hoveredPost.dungeon_slug)}</h2>
            <p className="lfg-hover-meta">
              {hoveredPost.role} {hoveredPost.character_name} is seeking more.{' '}
              <strong>{getNeedsText(g)}</strong>
            </p>
            <div className="lfg-hover-roles">
              <div className="lfg-hover-role">
                <TankIcon size={36} />
                <span className="lfg-hover-role-label">Tank</span>
                {g.tank[0]
                  ? <span className="lfg-hover-filled">{g.tank[0]}</span>
                  : <span className="lfg-hover-need">NEED</span>
                }
              </div>
              <div className="lfg-hover-role">
                <HealerIcon size={36} />
                <span className="lfg-hover-role-label">Healer</span>
                {g.healer[0]
                  ? <span className="lfg-hover-filled">{g.healer[0]}</span>
                  : <span className="lfg-hover-need">NEED</span>
                }
              </div>
              <div className="lfg-hover-role lfg-hover-role--dps">
                <DPSIcon size={36} />
                <span className="lfg-hover-role-label">DPS</span>
                {[0, 1, 2].map(i => (
                  <div key={i} className="lfg-hover-dps-slot">
                    <span className="lfg-hover-dps-num">DPS {i + 1}</span>
                    {g.dps[i]
                      ? <span className="lfg-hover-filled">{g.dps[i]}</span>
                      : <span className="lfg-hover-need">NEED</span>
                    }
                  </div>
                ))}
              </div>
            </div>
            {formatWindow(hoveredPost) && (
              <p className="lfg-hover-window">{formatWindow(hoveredPost)}</p>
            )}
          </div>
        )
      })()}
    </section>
  )
}
