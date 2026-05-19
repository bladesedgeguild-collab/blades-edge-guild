'use client'

import { useEffect } from 'react'

export function NavScrollGlow() {
  useEffect(() => {
    const nav = document.getElementById('site-nav')
    const handler = () => {
      if (window.scrollY > 10) {
        nav?.classList.add('nav-glow')
      } else {
        nav?.classList.remove('nav-glow')
      }
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])
  return null
}
