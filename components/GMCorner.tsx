'use client'

import { useState, useEffect } from 'react'

const AVATAR_IMAGES = [
  '/images/AvatarOdys_speaking1_withScroll_noVertBar.png',
  '/images/AvatarOdys_speaking2_withScroll_noVertBar.png',
  '/images/AvatarOdys_speaking3_withScroll_noVertBar.png',
  '/images/AvatarOdys_speaking4_withScroll_noVertBar.png',
  '/images/AvatarOdys_speaking5_withScroll_noVertBar.png',
]

const GM_MESSAGE = "Thanks for coming to the guild website! I am currently working on it so let me know of issues!"

interface Props {
  scrollActivate?: boolean
}

export default function GMCorner({ scrollActivate = false }: Props) {
  const [avatarImg] = useState(
    () => AVATAR_IMAGES[Math.floor(Math.random() * AVATAR_IMAGES.length)]
  )
  const [visible, setVisible] = useState(!scrollActivate)

  useEffect(() => {
    if (!scrollActivate) return
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollActivate])

  return (
    <div
      className="rc-gm-corner"
      style={{
        width: 'clamp(400px, 38vw, 580px)',
        ...(scrollActivate ? {
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease',
          animationFillMode: 'both',
        } : {}),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarImg}
        className="rc-gm-corner-img"
        alt="Åvatarødys"
      />

      {/* Byline in the LEFT dark triangle area */}
      <div className="rc-gm-byline-left">
        <span className="rc-gm-name">Åvatarødys</span>
        <span className="rc-gm-title">Blådes Edge – Guild Master</span>
      </div>

      {/* Quote in the RIGHT narrow parchment column */}
      <div className="rc-gm-quote-right">
        <blockquote className="rc-gm-quote">
          &ldquo;{GM_MESSAGE}&rdquo;
        </blockquote>
      </div>
    </div>
  )
}
