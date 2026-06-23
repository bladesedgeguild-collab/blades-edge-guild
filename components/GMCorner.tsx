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
    <>
      <div
        className="gm-corner-root"
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: 'min(480px, 35vw)',
          height: 'min(480px, 35vw)',
          zIndex: 50,
          pointerEvents: 'none',
          opacity: visible ? 1 : 0,
          transition: scrollActivate ? 'opacity 0.6s ease' : undefined,
        }}
      >
        {/* Combined character and scroll graphic (1254x1254 square) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={avatarImg}
          src={avatarImg}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
          }}
        />

        {/* Quote -- parchment area */}
        <div
          style={{
            position: 'absolute',
            bottom: '37.5%',
            right: '6.25%',
            width: '31.25%',
            textAlign: 'center',
            fontFamily: 'Spectral, serif',
            fontStyle: 'italic',
            fontSize: '0.82rem',
            lineHeight: '1.55',
            color: '#f0e6c8',
          }}
        >
          &ldquo;{quote}&rdquo;
        </div>

        {/* Byline -- three lines, right-aligned */}
        <div
          style={{
            position: 'absolute',
            bottom: '7.9%',
            right: '61.5%',
            textAlign: 'right',
            lineHeight: '1.4',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#c9961a',
            letterSpacing: '0.05em',
          }}>
            Åvatarødys
          </div>
          <div style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '0.78rem',
            fontWeight: 400,
            color: '#f0e6c8',
            letterSpacing: '0.05em',
          }}>
            Blådes Edge
          </div>
          <div style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '0.68rem',
            fontWeight: 400,
            color: '#a07820',
            letterSpacing: '0.06em',
          }}>
            Guild Master
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .gm-corner-root { display: none !important; }
        }
      `}</style>
    </>
  )
}
