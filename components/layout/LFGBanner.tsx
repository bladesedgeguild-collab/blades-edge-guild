'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { formatInstant, formatRange, SERVER_TIME_ZONE } from '@/lib/lfg-time'
import type { LfgRole } from '@/lib/roles'

type Match = {
  characterId: string
  name: string
  className: string
  level: number
  isMain: boolean
  role: LfgRole
  openRoles: LfgRole[]
}

export type EligiblePost = {
  id: string
  dungeon_slug: string
  dungeon_name: string
  poster_name: string
  poster_role: string
  notes: string | null
  starts_at: string | null
  ends_at: string | null
  available_window: string | null
  needs_summary: string
  matches: Match[]
}

export function LFGBanner({ initialPosts }: { initialPosts?: EligiblePost[] } = {}) {
  const pathname = usePathname()
  const [posts, setPosts] = useState<EligiblePost[]>(initialPosts ?? [])
  const [hidden, setHidden] = useState<string[]>([])

  useEffect(() => {
    if (initialPosts) return
    let cancelled = false
    fetch('/api/dungeons/lfg/eligible')
      .then(response => response.ok ? response.json() : [])
      .then(data => { if (!cancelled) setPosts(Array.isArray(data) ? data : []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [pathname, initialPosts])

  const visible = posts.filter(post => !hidden.includes(post.id))
  if (visible.length === 0) return null

  return (
    <>
      {visible.map(post => (
        <BannerCard
          key={post.id}
          post={post}
          onDone={() => setHidden(prev => [...prev, post.id])}
        />
      ))}
    </>
  )
}

function BannerCard({ post, onDone }: { post: EligiblePost; onDone: () => void }) {
  const [characterId, setCharacterId] = useState(post.matches[0]?.characterId ?? '')
  const match = post.matches.find(item => item.characterId === characterId) ?? post.matches[0]
  const [role, setRole] = useState<LfgRole>(match?.role ?? 'DPS')
  const [error, setError] = useState<string | null>(null)
  const [timeZone, setTimeZone] = useState('')

  useEffect(() => {
    const id = window.setTimeout(() => {
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  const chosenRole = match && match.openRoles.includes(role) ? role : (match?.role ?? role)

  if (!match) return null

  const when = post.starts_at && timeZone
    ? formatInstant(post.starts_at, timeZone)
    : post.available_window
  const serverHint = post.starts_at && timeZone
    ? formatRange(post.starts_at, post.ends_at, SERVER_TIME_ZONE)
    : null

  async function respond(response: 'accepted' | 'declined' | 'dismissed') {
    setError(null)
    const res = await fetch('/api/dungeons/lfg/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lfgId: post.id,
        response,
        characterId: response === 'accepted' ? match?.characterId : undefined,
        role: response === 'accepted' ? chosenRole : undefined,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(typeof data.error === 'string' ? data.error : 'Could not save that response.')
      return
    }
    onDone()
  }

  return (
    <div className="lfg-banner">
      <div className="lfg-banner-content">
        <span className="lfg-banner-icon">⚔️</span>
        <span className="lfg-banner-text">
          Your {match.className} {match.name} (lvl {match.level}) fits the {chosenRole} spot in{' '}
          <Link href={`/dungeons/${post.dungeon_slug}?lfg=${post.id}`} className="lfg-banner-dungeon-link">
            <strong>{post.dungeon_name}</strong>
          </Link>
          {when ? <> on {when}</> : null}.
          {serverHint ? <span className="lfg-server-hint"> Server time: {serverHint}.</span> : null}
        </span>
        <div className="lfg-banner-actions">
          {post.matches.length > 1 && (
            <select
              className="lfg-banner-role-select"
              value={match.characterId}
              onChange={event => setCharacterId(event.target.value)}
              aria-label="Character"
            >
              {post.matches.map(item => (
                <option key={item.characterId} value={item.characterId}>
                  {item.isMain ? '★ ' : ''}{item.name} ({item.level})
                </option>
              ))}
            </select>
          )}
          {match.openRoles.length > 1 && (
            <select
              className="lfg-banner-role-select"
              value={chosenRole}
              onChange={event => setRole(event.target.value as LfgRole)}
              aria-label="Your role"
            >
              {match.openRoles.map(option => <option key={option}>{option}</option>)}
            </select>
          )}
          <button className="lfg-banner-accept" onClick={() => respond('accepted')}>Accept</button>
          <button className="lfg-banner-decline" onClick={() => respond('declined')}>Decline</button>
          <button className="lfg-banner-decline" onClick={() => respond('dismissed')}>Dismiss</button>
        </div>
        <span className="lfg-banner-private">
          Accept tells {post.poster_name} on the site. {post.needs_summary}
        </span>
        {error && <span className="lfg-xp-warning">{error}</span>}
      </div>
    </div>
  )
}
