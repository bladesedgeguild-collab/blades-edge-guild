'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ReleaseButton({ characterId }: { characterId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRelease() {
    if (!confirm('Release this character claim? The character will return to MIA status.')) return
    setLoading(true)
    await fetch('/api/characters/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character_id: characterId }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleRelease}
      disabled={loading}
      className="text-xs px-3 py-1.5 rounded font-medium disabled:opacity-50"
      style={{ backgroundColor: '#7f1d1d', color: '#f87171' }}
    >
      {loading ? '…' : 'Release'}
    </button>
  )
}
