'use client'

import { useState, useEffect } from 'react'

const AVATAR_IMAGES = [
  '/images/AvatarOdys_speaking1_withScroll_noVertBar.png',
  '/images/AvatarOdys_speaking2_withScroll_noVertBar.png',
  '/images/AvatarOdys_speaking3_withScroll_noVertBar.png',
  '/images/AvatarOdys_speaking4_withScroll_noVertBar.png',
  '/images/AvatarOdys_speaking5_withScroll_noVertBar.png',
]

interface GMCornerProps {
  quote: string
  image?: string
  scrollActivate?: boolean
}

export default function GMCorner({ quote, image, scrollActivate = false }: GMCornerProps) {
  const [randomImg] = useState(
    () => AVATAR_IMAGES[Math.floor(Math.random() * AVATAR_IMAGES.length)]
  )
  const avatarImg = image ?? randomImg
  const [visible, setVisible] = useState(!scrollActivate)

  useEffect(() => {
    if (!scrollActivate) return
    const handleScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollActivate])

  return (
    <div
      className="rc-gm-corner"
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: 'clamp(380px, 33vw, 500px)',
        zIndex: 50,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: scrollActivate ? 'opacity 0.6s ease' : undefined,
      }}
    >
      {/* Single image contains both character art and scroll/triangle graphic */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={avatarImg}
        src={avatarImg}
        alt=""
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />

      {/* Quote — parchment area */}
      <div
        style={{
          position: 'absolute',
          bottom: '180px',
          right: '30px',
          width: '150px',
          maxWidth: '150px',
          textAlign: 'center',
          fontFamily: 'Spectral, serif',
          fontStyle: 'italic',
          fontSize: '0.9rem',
          lineHeight: '1.6',
          color: '#f0e6c8',
        }}
      >
        &ldquo;{quote}&rdquo;
      </div>

      {/* Attribution — three-line byline */}
      <div
        style={{
          position: 'absolute',
          bottom: '42px',
          right: '300px',
          textAlign: 'right',
          lineHeight: '1.4',
        }}
      >
        <div style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '1rem',
          fontWeight: 700,
          color: '#c9961a',
          letterSpacing: '0.05em',
        }}>
          Åvatarødys
        </div>
        <div style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '0.8rem',
          fontWeight: 400,
          color: '#f0e6c8',
          letterSpacing: '0.05em',
        }}>
          Blådes Edge
        </div>
        <div style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '0.7rem',
          fontWeight: 400,
          color: '#a07820',
          letterSpacing: '0.06em',
        }}>
          Guild Master
        </div>
      </div>
    </div>
  )
}
