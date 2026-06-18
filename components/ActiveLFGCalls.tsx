'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m} ${ampm}`
})

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

function buildWindowSummary(
  days: string[] | null,
  start: string | null,
  end: string | null
): string | null {
  const dayStr = !days || days.length === 0 ? 'Any day' : days.join(', ')
  if (start && end) return `${dayStr}, ${start}–${end} Server Time`
  if (days && days.length > 0) return dayStr
  return null
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
  const [days, setDays] = useState<string[]>(post.days_available ?? [])
  const [timeStart, setTimeStart] = useState(post.time_start ?? '')
  const [timeEnd, setTimeEnd] = useState(post.time_end ?? '')
  const [notes, setNotes] = useState(post.notes ?? '')

  function toggleDay(day: string) {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    const available_window = buildWindowSummary(days, timeStart || null, timeEnd || null)
    onSave({ days_available: days, time_start: timeStart || null, time_end: timeEnd || null, notes: notes || null, available_window })
  }

  return (
    <form className="lfg-edit-form" onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
      <div className="lfg-edit-days">
        {DAYS.map(day => (
          <label key={day} className={`lfg-day-chip${days.includes(day) ? ' lfg-day-chip--on' : ''}`}>
            <input type="checkbox" checked={days.includes(day)} onChange={() => toggleDay(day)} />
            {day}
          </label>
        ))}
      </div>
      <div className="lfg-edit-times">
        <select className="lfg-time-select" value={timeStart} onChange={e => setTimeStart(e.target.value)}>
          <option value="">Start time...</option>
          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="lfg-edit-to">to</span>
        <select className="lfg-time-select" value={timeEnd} onChange={e => setTimeEnd(e.target.value)}>
          <option value="">End time...</option>
          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
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
  const [userId, setUserId] = useState<string | undefined>()
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
        setUserId(session.user.id)
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
            const needsText = getNeedsText(group)
            const win = formatWindow(post)
            const isOwner = !!userId && post.user_id === userId

            return (
              <div
                id={`lfg-full-${post.id}`}
                key={post.id}
                className="lfg-big-card"
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/dungeons/${post.dungeon_slug}?lfg=${post.id}`)}
              >
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
