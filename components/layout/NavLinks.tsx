'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface NavLinksProps {
  isLoggedIn: boolean
  isOfficer: boolean
}

export function NavLinks({ isLoggedIn, isOfficer }: NavLinksProps) {
  const [loadingNav, setLoadingNav] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    setLoadingNav(null)
  }, [pathname])

  function handleNavClick(href: string) {
    setLoadingNav(href)
  }

  function linkClass(href: string, extra = '') {
    return `text-sm transition-colors hover:text-[#c9961a]${extra}${loadingNav === href ? ' nav-loading' : ''}`
  }

  return (
    <>
      {isLoggedIn ? (
        <>
          <Link
            href="/dashboard"
            className={linkClass('/dashboard')}
            style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
            onClick={() => handleNavClick('/dashboard')}
          >
            Hall
          </Link>
          <Link
            href="/my-roster"
            className={linkClass('/my-roster')}
            style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
            onClick={() => handleNavClick('/my-roster')}
          >
            My Roster
          </Link>
          <Link
            href="/guildies"
            className={linkClass('/guildies')}
            style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
            onClick={() => handleNavClick('/guildies')}
          >
            Guildies
          </Link>
          <Link
            href="/dungeons"
            className={linkClass('/dungeons')}
            style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
            onClick={() => handleNavClick('/dungeons')}
          >
            Dungeons
          </Link>
          {isOfficer && (
            <Link
              href="/officers"
              className={linkClass('/officers')}
              style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
              onClick={() => handleNavClick('/officers')}
            >
              Officers
            </Link>
          )}
        </>
      ) : (
        <>
          <Link
            href="/"
            className={linkClass('/')}
            style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
            onClick={() => handleNavClick('/')}
          >
            Home
          </Link>
          <Link
            href="/roster"
            className={linkClass('/roster')}
            style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
            onClick={() => handleNavClick('/roster')}
          >
            Roster
          </Link>
          <Link
            href="/recruit"
            className={`nav-recruit-link${loadingNav === '/recruit' ? ' nav-loading' : ''}`}
            onClick={() => handleNavClick('/recruit')}
          >
            ✦ Join
          </Link>
          <Link
            href="/dungeons"
            className={linkClass('/dungeons')}
            style={{ fontFamily: "'Cinzel', serif", color: '#f0e6c8' }}
            onClick={() => handleNavClick('/dungeons')}
          >
            Dungeons
          </Link>
          <Link
            href="/login"
            className={linkClass('/login', ' font-medium hover:text-white')}
            style={{ fontFamily: "'Cinzel', serif", color: '#c9961a' }}
            onClick={() => handleNavClick('/login')}
          >
            Login
          </Link>
        </>
      )}
    </>
  )
}
