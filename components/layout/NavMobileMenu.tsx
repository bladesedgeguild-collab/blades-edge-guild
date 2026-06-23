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
              <Link href="/guildies" className="nav-mobile-link" onClick={() => setOpen(false)}>Guildies</Link>
              <Link href="/dungeons" className="nav-mobile-link" onClick={() => setOpen(false)}>Dungeons</Link>
              {isOfficer && (
                <Link href="/officers" className="nav-mobile-link" onClick={() => setOpen(false)}>Officers</Link>
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
              <Link href="/recruit" className="nav-mobile-link" style={{ color: '#1aff6e' }} onClick={() => setOpen(false)}>Join</Link>
              <Link href="/dungeons" className="nav-mobile-link" onClick={() => setOpen(false)}>Dungeons</Link>
              <Link href="/login" className="nav-mobile-link" style={{ color: '#c9961a' }} onClick={() => setOpen(false)}>Login</Link>
            </>
          )}
          <a
            href="https://discord.gg/B9fEz7AC6T"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-mobile-link"
            style={{
              background: '#5865F2',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderTop: '1px solid rgba(88,101,242,0.3)',
              borderBottom: 'none',
            }}
            onClick={() => setOpen(false)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Join the Guild Discord
          </a>
        </div>
      )}
    </div>
  )
}
