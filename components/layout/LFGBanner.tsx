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

  useEffect(() => {
    fetch('/api/dungeons/lfg/eligible')
      .then(r => r.ok ? r.json() : [])
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const visible = posts.filter(p => !dismissedIds.includes(p.id))
  if (visible.length === 0) return null

  async function handleResponse(lfgId: string, response: 'accepted' | 'declined') {
    setDismissedIds(prev => [...prev, lfgId])
    try {
      await fetch('/api/dungeons/lfg/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lfgId, response }),
      })
    } catch {
      // Non-fatal — banner already dismissed locally
    }
  }

  return (
    <>
      {visible.map(post => {
        const chars = post.matching_chars
        const charText = chars.map(c => `${c.name} (Lvl ${c.level})`).join(', ')
        const cg = post.current_group ?? { tank: 0, healer: 0, dps: 0 }

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
                {chars.length > 1 ? 'are' : 'is'} a great fit.{' '}
                Group: {cg.tank}/1 Tank · {cg.healer}/1 Healer · {cg.dps}/3 DPS
                {post.available_window && ` · ${post.available_window}`}
              </span>
              <div className="lfg-banner-actions">
                <button
                  className="lfg-banner-accept"
                  onClick={() => handleResponse(post.id, 'accepted')}
                >
                  Accept
                </button>
                <button
                  className="lfg-banner-decline"
                  onClick={() => handleResponse(post.id, 'declined')}
                >
                  Decline
                </button>
              </div>
              <span className="lfg-banner-private">
                Your response is private — {post.character_name} will not be notified either way.
              </span>
            </div>
          </div>
        )
      })}
    </>
  )
}
