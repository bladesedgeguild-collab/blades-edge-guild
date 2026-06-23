'use client'

import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'

const CAMPAIGN_IMAGES = [
  '/images/GuildiesInShattrath.jpg',
  '/images/Recruiting_TophinDarkshire.jpg',
  '/images/Summon_toBlastedLands.jpg',
  '/images/Summon_toWinterspring.jpg',
]

const eyebrow: CSSProperties = {
  fontFamily: 'var(--be-font-display)',
  fontSize: '0.7rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  margin: '0 0 12px',
}

export default function CampaignBanner() {
  const [activeBg, setActiveBg] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActiveBg(i => (i + 1) % CAMPAIGN_IMAGES.length), 12000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      background: 'rgba(26,18,8,0.6)',
      border: '1px solid rgba(61,46,21,0.5)',
      borderRadius: 4,
      minHeight: 260,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Rotating backgrounds */}
      {CAMPAIGN_IMAGES.map((src, i) => (
        <div
          key={src}
          className={`campaign-bg-slide${i === activeBg ? ' is-active' : ''}`}
          style={{ backgroundImage: `url('${src}')` }}
        />
      ))}

      {/* Dark gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(95deg, rgba(10,8,5,0.95) 0%, rgba(10,8,5,0.82) 38%, rgba(10,8,5,0.4) 70%, rgba(10,8,5,0.15) 100%)',
        zIndex: 1,
      }} />

      {/* Online badge */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 10px',
        backgroundColor: 'rgba(10,8,5,0.75)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(61,46,21,0.5)',
        borderRadius: 2,
        zIndex: 2,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--be-font-display)', fontSize: '0.6rem', letterSpacing: '0.15em', color: '#4ade80' }}>ONLINE</span>
      </div>

      {/* Content */}
      <div className="campaign-banner-content" style={{ position: 'absolute', bottom: 0, left: 0, right: '30%', padding: 24, zIndex: 2 }}>
        <p style={{ ...eyebrow, color: 'var(--be-portal)' }}>Current Campaign</p>
        <h2 style={{ fontFamily: 'var(--be-font-display)', fontSize: '1.5rem', color: '#f0e6c8', margin: '0 0 10px', lineHeight: 1.2 }}>
          Welcome, New Guildies!
        </h2>
        <p style={{ fontFamily: "'Spectral', serif", fontSize: '0.9rem', color: 'rgba(138,122,90,0.8)', margin: '0 0 18px', lineHeight: 1.5 }}>
          The guild is in heavy recruitment mode and reactivating old guildies before the name change. Our goal is 200+ active members, enough to have guildies online at nearly all times, day or night. The more the merrier. Spread the word.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/dungeons" style={{ padding: '9px 20px', backgroundColor: 'var(--be-gold)', color: '#0d0b07', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: '0.72rem', letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block' }}>
            Sign up for raid
          </Link>
          <Link href="/roster" style={{ padding: '9px 20px', backgroundColor: 'transparent', color: '#f0e6c8', border: '1px solid rgba(201,150,26,0.4)', borderRadius: 'var(--be-radius)', fontFamily: 'var(--be-font-display)', fontSize: '0.72rem', letterSpacing: '0.08em', textDecoration: 'none', display: 'inline-block' }}>
            View roster
          </Link>
        </div>
      </div>
    </div>
  )
}
