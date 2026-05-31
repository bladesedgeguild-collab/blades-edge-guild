'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavMobileMenuProps {
  isLoggedIn: boolean
  isOfficer: boolean
  displayName: string
  charColor: string
  avatarUrl: string | null
}

export function NavMobileMenu({ isLoggedIn, isOfficer, displayName, charColor, avatarUrl }: NavMobileMenuProps) {
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
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <div ref={ref} className="nav-mobile-wrapper">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="5" y1="5" x2="19" y2="19" stroke="#c9961a" strokeWidth="2" strokeLinecap="round" />
            <line x1="19" y1="5" x2="5" y2="19" stroke="#c9961a" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <line x1="3" y1="7" x2="21" y2="7" stroke="#c9961a" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="12" x2="21" y2="12" stroke="#c9961a" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="17" x2="21" y2="17" stroke="#c9961a" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="nav-mobile-menu">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="nav-mobile-link" onClick={() => setOpen(false)}>Hall</Link>
              <Link href="/my-roster" className="nav-mobile-link" onClick={() => setOpen(false)}>My Roster</Link>
              <span className="nav-mobile-link" style={{ color: '#3d2e15', cursor: 'not-allowed' }}>Dungeons</span>
              {isOfficer && (
                <Link href="/approvals" className="nav-mobile-link" onClick={() => setOpen(false)}>Officers</Link>
              )}
              <div className="nav-mobile-user">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                  ) : (
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: charColor, display: 'inline-block', flexShrink: 0 }} />
                  )}
                  <span style={{ fontFamily: "'Cinzel', serif", color: charColor, fontSize: '0.85rem' }}>{displayName}</span>
                </div>
                <Link href="/settings" className="nav-mobile-link" style={{ paddingLeft: 0, paddingRight: 0 }} onClick={() => setOpen(false)}>Settings</Link>
                <button
                  onClick={handleSignOut}
                  className="nav-mobile-link"
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#c9961a' }}
                >
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/" className="nav-mobile-link" onClick={() => setOpen(false)}>Home</Link>
              <Link href="/roster" className="nav-mobile-link" onClick={() => setOpen(false)}>Roster</Link>
              <span className="nav-mobile-link" style={{ color: '#3d2e15', cursor: 'not-allowed' }}>Dungeons</span>
              <Link href="/login" className="nav-mobile-link" style={{ color: '#c9961a' }} onClick={() => setOpen(false)}>Login</Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
