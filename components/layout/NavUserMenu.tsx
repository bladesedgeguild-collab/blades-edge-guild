'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface NavUserMenuProps {
  displayName: string
  charColor: string
  avatarUrl: string | null
}

export function NavUserMenu({ displayName, charColor, avatarUrl }: NavUserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function handleResetClaim() {
    setOpen(false)
    await fetch('/api/users/reset-onboarding', { method: 'POST' })
    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={displayName} className="w-7 h-7 rounded-full" />
        ) : (
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: charColor }}
          />
        )}
        <span
          className="text-sm"
          style={{ fontFamily: "'Cinzel', serif", color: charColor }}
        >
          {displayName}
        </span>
        <span style={{ color: charColor, fontSize: 10, marginLeft: 2 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: 180,
            backgroundColor: '#0d0b07',
            border: '1px solid #3d2e15',
            borderRadius: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            style={{ display: 'block', padding: '10px 16px', fontFamily: "'Cinzel', serif", fontSize: 12, color: '#f0e6c8', textDecoration: 'none' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1a1208' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
          >
            My Profile
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            style={{ display: 'block', padding: '10px 16px', fontFamily: "'Cinzel', serif", fontSize: 12, color: '#f0e6c8', textDecoration: 'none' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1a1208' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
          >
            Settings
          </Link>
          <button
            onClick={handleResetClaim}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontFamily: "'Cinzel', serif", fontSize: 12, color: '#8a7a5a', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1a1208'; (e.currentTarget as HTMLElement).style.color = '#f0e6c8' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#8a7a5a' }}
          >
            Reset Character Claim
          </button>
          <div style={{ height: 1, backgroundColor: '#3d2e15', margin: '4px 0' }} />
          <button
            onClick={handleSignOut}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontFamily: "'Cinzel', serif", fontSize: 12, color: '#c9961a', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1a1208' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
