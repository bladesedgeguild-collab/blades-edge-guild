'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Notice = {
  id: string
  title: string
  body: string | null
  link: string | null
  created_at: string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notice[]>([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/notifications')
      .then(response => response.ok ? response.json() : [])
      .then(data => { if (!cancelled && Array.isArray(data)) setItems(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (items.length === 0) return null

  async function openNotice(notice: Notice) {
    setItems(prev => prev.filter(item => item.id !== notice.id))
    setOpen(false)
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [notice.id] }),
    }).catch(() => {})
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        aria-label={`${items.length} unread notifications`}
        onClick={() => setOpen(value => !value)}
        style={{
          background: 'none',
          border: '1px solid rgba(201,150,26,0.45)',
          color: '#c9961a',
          borderRadius: 999,
          minWidth: 28,
          height: 28,
          cursor: 'pointer',
          fontFamily: "'Cinzel', serif",
          fontSize: 12,
        }}
      >
        {items.length}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 280,
            background: '#0d0b07',
            border: '1px solid #3d2e15',
            borderRadius: 6,
            zIndex: 120,
            padding: '0.4rem 0',
          }}
        >
          {items.map(notice => {
            const inner = (
              <>
                <strong style={{ display: 'block', fontFamily: "'Cinzel', serif", fontSize: 12, color: '#f0e6c8' }}>{notice.title}</strong>
                {notice.body && <span style={{ fontFamily: "'Spectral', serif", fontSize: 13, color: '#8a7a5a' }}>{notice.body}</span>}
              </>
            )
            return notice.link ? (
              <Link key={notice.id} href={notice.link} onClick={() => openNotice(notice)} style={{ display: 'block', padding: '0.55rem 0.8rem', textDecoration: 'none' }}>
                {inner}
              </Link>
            ) : (
              <button key={notice.id} type="button" onClick={() => openNotice(notice)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 0, padding: '0.55rem 0.8rem', cursor: 'pointer' }}>
                {inner}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
