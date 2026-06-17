'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type EligiblePost = {
  id: string
  dungeon_slug: string
  dungeon_name: string
  character_name: string
  role: string
  available_window: string | null
  notes: string | null
  current_group: { tank: number; healer: number; dps: number }
  matching_chars: { name: string; level: number }[]
}

export function LFGBanner() {
  const [posts, setPosts] = useState<EligiblePost[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/dungeons/lfg/eligible')
      .then(r => r.ok ? r.json() : [])
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const visible = posts.filter(p => !dismissedIds.includes(p.id))
  if (visible.length === 0) return null

  async function handleResponse(post: EligiblePost, response: 'accepted' | 'declined') {
    setDismissedIds(prev => [...prev, post.id])
    const acceptorCharName = post.matching_chars[0]?.name
    const acceptorRole = selectedRoles[post.id] ?? 'DPS'
    try {
      await fetch('/api/dungeons/lfg/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lfgId: post.id,
          response,
          acceptorCharName: response === 'accepted' ? acceptorCharName : undefined,
          acceptorRole: response === 'accepted' ? acceptorRole : undefined,
        }),
      })
    } catch {
      // Non-fatal
    }
  }

  return (
    <>
      {visible.map(post => {
        const chars = post.matching_chars
        const charText = chars.map(c => `${c.name} (Lvl ${c.level})`).join(', ')
        const currentRole = selectedRoles[post.id] ?? 'DPS'

        return (
          <div key={post.id} className="lfg-banner">
            <div className="lfg-banner-content">
              <span className="lfg-banner-icon">⚔️</span>
              <span className="lfg-banner-text">
                <strong>{post.character_name}</strong> is calling for{' '}
                <Link href={`/dungeons/${post.dungeon_slug}`} className="lfg-banner-dungeon-link">
                  <strong>{post.dungeon_name}</strong>
                </Link>.{' '}
                Your character{chars.length > 1 ? 's' : ''}{' '}
                <strong>{charText}</strong>{' '}
                {chars.length > 1 ? 'are' : 'is'} a great fit.
                {post.available_window && ` · ${post.available_window}`}
              </span>
              <div className="lfg-banner-actions">
                <select
                  className="lfg-banner-role-select"
                  value={currentRole}
                  onChange={e => setSelectedRoles(prev => ({ ...prev, [post.id]: e.target.value }))}
                  aria-label="Your role"
                >
                  <option>Tank</option>
                  <option>Healer</option>
                  <option>DPS</option>
                </select>
                <button
                  className="lfg-banner-accept"
                  onClick={() => handleResponse(post, 'accepted')}
                >
                  Accept
                </button>
                <button
                  className="lfg-banner-decline"
                  onClick={() => handleResponse(post, 'declined')}
                >
                  Decline
                </button>
              </div>
              <span className="lfg-banner-private">
                Your response is private. {post.character_name} will not be notified either way.
              </span>
            </div>
          </div>
        )
      })}
    </>
  )
}
