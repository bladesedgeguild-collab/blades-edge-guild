'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Dungeon, WoWClass } from '@/data/dungeons/types'
import '../dungeons.css'

const WOW_CLASSES: WoWClass[] = [
  'Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest',
  'Mage', 'Warlock', 'Druid', 'Shaman',
]

const CLASS_COLORS: Record<WoWClass, string> = {
  Warrior: '#c69b3a',
  Paladin: '#f48cba',
  Hunter: '#aad372',
  Rogue: '#fff468',
  Priest: '#ffffff',
  Mage: '#3fc7eb',
  Warlock: '#8788ee',
  Druid: '#ff7c0a',
  Shaman: '#0070dd',
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${m} ${ampm}`
})

type LfgPost = {
  id: string
  character_name: string
  role: string
  available_window: string | null
  notes: string | null
  days_available?: string[] | null
  time_start?: string | null
  time_end?: string | null
}

type FeaturedLFG = {
  id: string
  user_id?: string
  character_name: string
  role: string
  available_window: string | null
  notes: string | null
  days_available: string[] | null
  time_start: string | null
  time_end: string | null
  current_group: {
    tank: string[] | number
    healer: string[] | number
    dps: string[] | number
  } | null
}

type FeaturedEditUpdates = {
  days_available: string[] | null
  time_start: string | null
  time_end: string | null
  notes: string | null
  available_window: string | null
}

function FeaturedEditForm({
  post,
  onSave,
  onCancel,
}: {
  post: FeaturedLFG
  onSave: (updates: FeaturedEditUpdates) => Promise<void>
  onCancel: () => void
}) {
  const [days, setDays] = useState<string[]>(post.days_available ?? [])
  const [anyDay, setAnyDay] = useState((post.days_available ?? []).length === 0)
  const [timeStart, setTimeStart] = useState(post.time_start ?? '')
  const [timeEnd, setTimeEnd] = useState(post.time_end ?? '')
  const [notes, setNotes] = useState(post.notes ?? '')
  const [saving, setSaving] = useState(false)

  function toggleDay(day: string) {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      days_available: anyDay ? [] : days,
      time_start: timeStart || null,
      time_end: timeEnd || null,
      notes: notes || null,
      available_window: null,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="lfg-edit-form">
      <div className="dd-lfg-field">
        <label className="dd-lfg-label">Days Available</label>
        <div className="lfg-day-row">
          {DAYS.map(d => (
            <button
              key={d}
              type="button"
              className={`lfg-day-btn${days.includes(d) && !anyDay ? ' lfg-day-btn--active' : ''}`}
              onClick={() => { setAnyDay(false); toggleDay(d) }}
            >{d}</button>
          ))}
          <button
            type="button"
            className={`lfg-day-btn${anyDay ? ' lfg-day-btn--active' : ''}`}
            onClick={() => { setAnyDay(true); setDays([]) }}
          >Any</button>
        </div>
      </div>
      <div className="lfg-time-row">
        <div className="dd-lfg-field" style={{ flex: 1 }}>
          <label className="dd-lfg-label lfg-field-label">Start Time (Server)</label>
          <select className="dd-lfg-select lfg-time-select" value={timeStart} onChange={e => setTimeStart(e.target.value)}>
            <option value="">Select...</option>
            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <span className="lfg-time-to">to</span>
        <div className="dd-lfg-field" style={{ flex: 1 }}>
          <label className="dd-lfg-label lfg-field-label">End Time (Server)</label>
          <select className="dd-lfg-select lfg-time-select" value={timeEnd} onChange={e => setTimeEnd(e.target.value)}>
            <option value="">Select...</option>
            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="dd-lfg-field">
        <label className="dd-lfg-label">Notes</label>
        <textarea className="dd-lfg-textarea" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
      </div>
      <div className="lfg-edit-actions">
        <button type="submit" className="dd-lfg-btn df-lfg-btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <button type="button" className="lfg-cancel-btn" onClick={onCancel}>Discard</button>
      </div>
    </form>
  )
}

function formatWindow(post: LfgPost): string {
  const days = post.days_available?.length
    ? post.days_available.join(', ')
    : post.days_available !== undefined && post.days_available !== null
    ? 'Any day'
    : null
  if (post.time_start && post.time_end)
    return `${days || 'Any day'}, ${post.time_start}–${post.time_end} Server Time`
  if (days) return days
  return post.available_window ?? ''
}

function formatFeaturedWindow(post: FeaturedLFG): string {
  const days = post.days_available?.length
    ? post.days_available.join(', ')
    : post.days_available !== null
    ? 'Any day'
    : null
  if (post.time_start && post.time_end)
    return `${days || 'Any day'}, ${post.time_start}–${post.time_end} Server Time`
  if (days) return days
  return post.available_window ?? ''
}

function normalizeGroup(g: FeaturedLFG['current_group']): { tank: string[]; healer: string[]; dps: string[] } {
  if (!g) return { tank: [], healer: [], dps: [] }
  return {
    tank: Array.isArray(g.tank) ? g.tank : [],
    healer: Array.isArray(g.healer) ? g.healer : [],
    dps: Array.isArray(g.dps) ? g.dps : [],
  }
}

function getFeaturedNeedsText(g: FeaturedLFG['current_group']): string {
  const group = normalizeGroup(g)
  const needsTank = group.tank.length === 0
  const needsHealer = group.healer.length === 0
  const needsDPS = group.dps.length < 3
  if (!needsTank && !needsHealer && !needsDPS) return 'Group is Full!'
  const needs: string[] = []
  if (needsTank) needs.push('Tank')
  if (needsHealer) needs.push('Heals')
  if (needsDPS) needs.push('DPS')
  if (needs.length === 3) return 'Needs All.'
  if (needs.length === 1) return `Needs ${needs[0]} then Good To Go.`
  return `Needs ${needs[0]} and ${needs[1]}.`
}

const MT_ZONES = ['America/Denver', 'America/Phoenix', 'America/Boise', 'America/Creston']

interface Props {
  dungeon: Dungeon
  initialPosts: LfgPost[]
  isLoggedIn: boolean
  characterName?: string
  featuredLFG?: FeaturedLFG | null
  userId?: string
  userRole?: string
}

export default function DungeonDetail({ dungeon, initialPosts, isLoggedIn, characterName, featuredLFG, userId, userRole }: Props) {
  const [selectedClass, setSelectedClass] = useState<WoWClass>('Warrior')
  const [openBoss, setOpenBoss] = useState<number | null>(null)
  const [role, setRole] = useState('DPS')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [anyDay, setAnyDay] = useState(false)
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [notes, setNotes] = useState('')
  const [detectedTimezone, setDetectedTimezone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [posts, setPosts] = useState<LfgPost[]>(initialPosts)
  const [showBannerForm, setShowBannerForm] = useState(!featuredLFG)
  const [featuredPost, setFeaturedPost] = useState(featuredLFG ?? null)
  const [featuredEditMode, setFeaturedEditMode] = useState(false)

  const isAdmin = ['admin', 'officer', 'gm'].includes(userRole ?? '')
  const isFeaturedOwner = !!userId && featuredPost?.user_id === userId

  async function handleFeaturedCancel() {
    if (!featuredPost) return
    try {
      const res = await fetch(`/api/dungeons/lfg/${featuredPost.id}`, { method: 'DELETE' })
      if (res.ok) {
        setFeaturedPost(null)
        setShowBannerForm(true)
      }
    } catch { }
  }

  async function handleFeaturedSave(updates: {
    days_available: string[] | null
    time_start: string | null
    time_end: string | null
    notes: string | null
    available_window: string | null
  }) {
    if (!featuredPost) return
    try {
      const res = await fetch(`/api/dungeons/lfg/${featuredPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        setFeaturedPost(prev => prev ? { ...prev, ...updates } : null)
        setFeaturedEditMode(false)
      }
    } catch { }
  }

  useEffect(() => {
    setDetectedTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  function toggleDay(day: string) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  function getLocalEquivalent(serverTimeStr: string): string | null {
    if (!serverTimeStr || !detectedTimezone) return null
    try {
      const match = serverTimeStr.match(/^(\d{1,2}):(\d{2})\s+(AM|PM)$/i)
      if (!match) return null
      let h = parseInt(match[1], 10)
      const m = parseInt(match[2], 10)
      if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12
      if (match[3].toUpperCase() === 'AM' && h === 12) h = 0

      const now = new Date()
      const mtFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Denver',
        hour: 'numeric', minute: 'numeric', hour12: false,
      })
      const mtParts = mtFmt.formatToParts(now)
      let mtH = parseInt(mtParts.find(p => p.type === 'hour')?.value ?? '0')
      const mtM = parseInt(mtParts.find(p => p.type === 'minute')?.value ?? '0')
      if (mtH === 24) mtH = 0

      const nowUtcMins = now.getUTCHours() * 60 + now.getUTCMinutes()
      const nowMtMins = mtH * 60 + mtM
      const mtOffsetMins = nowMtMins - nowUtcMins

      const serverMins = h * 60 + m
      const utcTotalMins = serverMins - mtOffsetMins
      const utcH = Math.floor(((utcTotalMins % 1440) + 1440) % 1440 / 60)
      const utcMin = ((utcTotalMins % 60) + 60) % 60

      const utcDate = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
        utcH, utcMin,
      ))

      return utcDate.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
        timeZone: detectedTimezone,
      })
    } catch {
      return null
    }
  }

  const isSameMT = MT_ZONES.includes(detectedTimezone)
  const localStartEquiv = timeStart ? getLocalEquivalent(timeStart) : null
  const localEndEquiv = timeEnd ? getLocalEquivalent(timeEnd) : null

  const classLoot = dungeon.loot.filter(item => {
    const rel = item.relevance[selectedClass]
    return rel !== undefined && rel.rating !== 'skip'
  })

  const allianceQuests = dungeon.quests.filter(q => q.faction !== 'Horde')

  async function handleLFGSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/dungeons/lfg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dungeonSlug: dungeon.id,
          dungeonName: dungeon.name,
          role,
          daysAvailable: anyDay ? [] : selectedDays,
          timeStart,
          timeEnd,
          timezoneLabel: detectedTimezone,
          notes,
          characterName,
        }),
      })
      if (res.ok) {
        const newPost = await res.json()
        setPosts(prev => [newPost, ...prev])
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setSelectedDays([])
          setAnyDay(false)
          setTimeStart('')
          setTimeEnd('')
          setNotes('')
        }, 5000)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const sourceBadgeClass = dungeon.sourceStatus === 'verified' || dungeon.sourceStatus === 'source-checked'
    ? 'dd-source-badge--verified'
    : 'dd-source-badge--placeholder'

  const sourceBadgeLabel: Record<typeof dungeon.sourceStatus, string> = {
    placeholder: 'Draft',
    draft: 'Draft',
    'source-checked': 'Reviewed',
    verified: 'Verified',
  }

  const daysLabel = anyDay ? 'Any day' : selectedDays.length > 0 ? selectedDays.join(', ') : ''

  const featuredGroup = featuredPost ? normalizeGroup(featuredPost.current_group) : null
  const featuredWindow = featuredPost ? formatFeaturedWindow(featuredPost as FeaturedLFG) : null

  return (
    <div className="dd-page">
      {/* Hero Bar */}
      <div className="dd-hero">
        <div className="dd-hero-inner">
          <Link href="/dungeons" className="dd-back">← All Dungeons</Link>
          <div className="dd-continent">{dungeon.continent} &middot; {dungeon.zone}</div>
          <h1 className="dd-title">{dungeon.name}</h1>
          <div className="dd-meta-row">
            <span>Level {dungeon.recommendedLevelMin}–{dungeon.recommendedLevelMax}</span>
            <span className="dd-meta-sep">|</span>
            <span>~{dungeon.estimatedTimeMinutes} min</span>
            <span className="dd-meta-sep">|</span>
            <span>{dungeon.maxPlayers}-player</span>
            {dungeon.heroicRequiresLevel && (
              <>
                <span className="dd-meta-sep">|</span>
                <span className="df-heroic-badge">Heroic Req. 70</span>
              </>
            )}
            <span className={`dd-source-badge ${sourceBadgeClass}`}>
              {sourceBadgeLabel[dungeon.sourceStatus]}
            </span>
          </div>
          <p className="dd-summary">{dungeon.summary}</p>
        </div>
      </div>

      {/* Body */}
      <div className="dd-body">

        {/* Featured LFG */}
        {featuredPost && featuredGroup && (
          <div className="dungeon-featured-lfg">
            <div className="dungeon-featured-header">
              <div className="dungeon-featured-title">Active Call for This Dungeon</div>
              {(isFeaturedOwner || isAdmin) && (
                <div className="dungeon-featured-actions">
                  {isFeaturedOwner && !featuredEditMode && (
                    <button className="lfg-edit-btn" onClick={() => setFeaturedEditMode(true)}>Edit</button>
                  )}
                  {(isFeaturedOwner || isAdmin) && (
                    <button className="lfg-cancel-btn" onClick={handleFeaturedCancel}>Cancel Request</button>
                  )}
                </div>
              )}
            </div>

            <p className="lfg-big-meta">
              <strong>{featuredPost.role} {featuredPost.character_name}</strong> is seeking more.{' '}
              <span className="lfg-needs-text">{getFeaturedNeedsText(featuredPost.current_group)}</span>
            </p>

            {/* 2-column role layout */}
            <div className="lfg-roles-2col" style={{ marginBottom: '1rem' }}>
              <div className="lfg-roles-left">
                <div className="lfg-role-block">
                  <div className="lfg-role-header">
                    <span className="lfg-role-label">Tank</span>
                  </div>
                  <div className="lfg-role-slot">
                    {featuredGroup.tank[0]
                      ? <span className="lfg-slot-name">{featuredGroup.tank[0]}</span>
                      : <span className="lfg-slot-need">NEED</span>
                    }
                  </div>
                </div>
                <div className="lfg-role-block">
                  <div className="lfg-role-header">
                    <span className="lfg-role-label">Healer</span>
                  </div>
                  <div className="lfg-role-slot">
                    {featuredGroup.healer[0]
                      ? <span className="lfg-slot-name">{featuredGroup.healer[0]}</span>
                      : <span className="lfg-slot-need">NEED</span>
                    }
                  </div>
                </div>
              </div>
              <div className="lfg-role-block lfg-role-block--dps">
                <div className="lfg-role-header">
                  <span className="lfg-role-label">DPS</span>
                </div>
                {[0, 1, 2].map(i => (
                  <div key={i} className="lfg-role-slot">
                    <span className="lfg-dps-label">DPS {i + 1}:</span>
                    {featuredGroup.dps[i]
                      ? <span className="lfg-slot-name">{featuredGroup.dps[i]}</span>
                      : <span className="lfg-slot-need">NEED</span>
                    }
                  </div>
                ))}
              </div>
            </div>

            {featuredEditMode ? (
              <FeaturedEditForm post={featuredPost} onSave={handleFeaturedSave} onCancel={() => setFeaturedEditMode(false)} />
            ) : (
              <>
                {featuredPost.notes && (
                  <div className="lfg-hover-note" style={{ marginBottom: '1rem' }}>
                    <span className="lfg-hover-note-label">Note:</span>
                    <p className="lfg-hover-note-text">{featuredPost.notes}</p>
                  </div>
                )}
                {featuredWindow && (
                  <div className="dungeon-featured-window">{featuredWindow}</div>
                )}
                {!isFeaturedOwner && (
                  <button className="dungeon-join-btn" onClick={() => setShowBannerForm(true)}>
                    Answer the Call
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Quick Card */}
        <div className="dd-section">
          <div className="dd-section-title">Before You Go</div>
          <div className="dd-quick-card">
            <div className="dd-quick-row">
              <span>
                <span className="dd-quick-label">Tanks:</span>{dungeon.groupComp.tank}
              </span>
              <span>
                <span className="dd-quick-label">Healers:</span>{dungeon.groupComp.healer}
              </span>
              <span>
                <span className="dd-quick-label">DPS:</span>{dungeon.groupComp.dps}
              </span>
              {dungeon.groupComp.usefulClasses && dungeon.groupComp.usefulClasses.length > 0 && (
                <span>
                  <span className="dd-quick-label">Useful:</span>
                  {dungeon.groupComp.usefulClasses.join(', ')}
                </span>
              )}
            </div>
            {dungeon.groupComp.notes && (
              <div className="dd-quick-row">
                <span style={{ color: 'var(--be-muted)' }}>{dungeon.groupComp.notes}</span>
              </div>
            )}
            {dungeon.specialMechanic && (
              <div className="dd-special-note">⚡ {dungeon.specialMechanic}</div>
            )}
          </div>
        </div>

        {/* Quests */}
        <div className="dd-section">
          <div className="dd-section-title">Quests</div>
          {allianceQuests.length === 0 ? (
            <p className="dd-quest-empty">Quest details coming soon.</p>
          ) : (
            <div className="dd-quest-list">
              {allianceQuests.map((q, i) => (
                <div key={i} className="dd-quest-item">
                  <div className="dd-quest-name">{q.name}</div>
                  <div className="dd-quest-starts">Starts: {q.startsAt}</div>
                  <span className={`dd-quest-importance dd-quest-importance--${q.importance}`}>
                    {q.importance.replace(/-/g, ' ')}
                  </span>
                  {q.rewardNote && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--be-muted)', fontStyle: 'italic', fontFamily: 'Spectral, serif' }}>
                      {q.rewardNote}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bosses */}
        <div className="dd-section">
          <div className="dd-section-title">Bosses</div>
          {dungeon.bosses.length === 0 ? (
            <p className="dd-boss-empty">Boss guides coming soon.</p>
          ) : (
            <div className="dd-boss-list">
              {dungeon.bosses.map(boss => (
                <div key={boss.order} className="dd-boss-item">
                  <button
                    className="dd-boss-header"
                    onClick={() => setOpenBoss(openBoss === boss.order ? null : boss.order)}
                  >
                    <span className="dd-boss-order">{boss.order}.</span>
                    <span className="dd-boss-name">{boss.name}</span>
                    {boss.wipeRisk && (
                      <span className={`dd-boss-wipe dd-boss-wipe--${boss.wipeRisk}`}>
                        {boss.wipeRisk} risk
                      </span>
                    )}
                    <span className={`dd-boss-chevron${openBoss === boss.order ? ' dd-boss-chevron--open' : ''}`}>▼</span>
                  </button>
                  {openBoss === boss.order && (
                    <div className="dd-boss-tips">
                      {boss.quickTips.map((tip, i) => (
                        <div key={i} className="dd-boss-tip">• {tip}</div>
                      ))}
                      {boss.tankTip && (
                        <div className="dd-boss-role-tip dd-boss-role-tip--tank">🛡 Tank: {boss.tankTip}</div>
                      )}
                      {boss.healerTip && (
                        <div className="dd-boss-role-tip dd-boss-role-tip--healer">💚 Healer: {boss.healerTip}</div>
                      )}
                      {boss.dpsTip && (
                        <div className="dd-boss-role-tip dd-boss-role-tip--dps">⚔️ DPS: {boss.dpsTip}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loot by Class */}
        <div className="dd-section">
          <div className="dd-section-title">Loot by Class</div>
          <div className="dd-class-tabs">
            {WOW_CLASSES.map(cls => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`dd-class-tab${selectedClass === cls ? ' dd-class-tab--active' : ''}`}
                style={selectedClass === cls ? { backgroundColor: CLASS_COLORS[cls] } : {}}
              >
                {cls}
              </button>
            ))}
          </div>
          {classLoot.length === 0 ? (
            <p className="dd-loot-empty">
              No notable loot for {selectedClass}, or loot data not yet sourced.
            </p>
          ) : (
            <div className="dd-loot-list">
              {classLoot.map((item, i) => {
                const rel = item.relevance[selectedClass]!
                return (
                  <div key={i} className="dd-loot-item">
                    <span className="dd-loot-name">{item.name}</span>
                    <span className="dd-loot-slot">{item.slot}</span>
                    <span className={`dd-loot-rating dd-loot-rating--${rel.rating}`}>
                      {rel.rating}
                    </span>
                    <span className="dd-loot-boss">{item.boss}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* LFG Section */}
        <div className="dd-section">
          <div className="dd-section-title">Call the Guild</div>
          <div className="dd-lfg-board">
            {/* Form */}
            {showBannerForm ? (
              <div className="dd-lfg-form-wrap">
                <div className="dd-lfg-form-title">Raise the Banner</div>
                {!isLoggedIn ? (
                  <p className="dd-lfg-auth-note">
                    <Link href="/login">Log in</Link> to post a LFG request.
                  </p>
                ) : success ? (
                  <div className="dd-lfg-success">
                    <div>Banner raised! Your guildmates have been alerted.</div>
                    {daysLabel && (
                      <div className="lfg-confirm-time">
                        <strong>Your window:</strong>{' '}
                        {daysLabel}
                        {timeStart && timeEnd ? ` from ${timeStart} to ${timeEnd} Server Time` : ''}
                        {detectedTimezone && localStartEquiv && localEndEquiv && (
                          <>
                            <br />
                            <span className="lfg-confirm-local">
                              That is {localStartEquiv} to {localEndEquiv} in your local time
                              {isSameMT ? ' (same timezone)' : ''}.
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleLFGSubmit}>
                    {/* Role */}
                    <div className="dd-lfg-field">
                      <label className="dd-lfg-label">Role</label>
                      <select
                        className="dd-lfg-select lfg-role-select"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                      >
                        <option>Tank</option>
                        <option>Healer</option>
                        <option>DPS</option>
                        <option>Flex</option>
                      </select>
                    </div>

                    {/* Server time */}
                    <div className="lfg-server-time">
                      <span className="lfg-server-label">Server Time:</span>
                      <span className="lfg-server-value" id="server-time-display" />
                      <script dangerouslySetInnerHTML={{ __html: `
                        function updateServerTime() {
                          var now = new Date();
                          var st = now.toLocaleTimeString('en-US', {
                            timeZone: 'America/Denver',
                            hour: '2-digit', minute: '2-digit', hour12: true
                          });
                          var el = document.getElementById('server-time-display');
                          if (el) el.textContent = st;
                        }
                        updateServerTime();
                        setInterval(updateServerTime, 10000);
                      `}} />
                    </div>

                    {/* Days */}
                    <div className="dd-lfg-field">
                      <label className="dd-lfg-label lfg-field-label">Day(s) Available</label>
                      <div className="lfg-day-checkboxes">
                        {DAYS.map(day => (
                          <label key={day} className={`lfg-day-chip${selectedDays.includes(day) ? ' lfg-day-chip--on' : ''}`}>
                            <input
                              type="checkbox"
                              value={day}
                              checked={selectedDays.includes(day)}
                              disabled={anyDay}
                              onChange={() => toggleDay(day)}
                            />
                            {day}
                          </label>
                        ))}
                        <label className={`lfg-day-chip lfg-day-any${anyDay ? ' lfg-day-chip--on' : ''}`}>
                          <input
                            type="checkbox"
                            checked={anyDay}
                            onChange={e => {
                              setAnyDay(e.target.checked)
                              if (e.target.checked) setSelectedDays([])
                            }}
                          />
                          Any Day
                        </label>
                      </div>
                    </div>

                    {/* Time range */}
                    <div className="lfg-time-row">
                      <div className="dd-lfg-field" style={{ flex: 1 }}>
                        <label className="dd-lfg-label lfg-field-label">Start Time (Server)</label>
                        <select
                          className="dd-lfg-select lfg-time-select"
                          value={timeStart}
                          onChange={e => setTimeStart(e.target.value)}
                        >
                          <option value="">Select...</option>
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <span className="lfg-time-to">to</span>
                      <div className="dd-lfg-field" style={{ flex: 1 }}>
                        <label className="dd-lfg-label lfg-field-label">End Time (Server)</label>
                        <select
                          className="dd-lfg-select lfg-time-select"
                          value={timeEnd}
                          onChange={e => setTimeEnd(e.target.value)}
                        >
                          <option value="">Select...</option>
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Timezone */}
                    {detectedTimezone && (
                      <div className="lfg-timezone">
                        <span className="lfg-tz-label">Your timezone:</span>
                        <span className="lfg-tz-value">{detectedTimezone}</span>
                        {localStartEquiv && timeStart && (
                          <span className="lfg-tz-equiv">
                            {timeStart} Server Time is {localStartEquiv} in your local time
                            {isSameMT ? ' (same timezone)' : ''}.
                          </span>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    <div className="dd-lfg-field">
                      <label className="dd-lfg-label">Notes</label>
                      <textarea
                        className="dd-lfg-textarea"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Any notes for your group..."
                      />
                    </div>

                    <button type="submit" className="dd-lfg-btn df-lfg-btn" disabled={submitting}>
                      {submitting ? 'Raising...' : 'Raise the Banner'}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <button className="dungeon-own-run-btn" onClick={() => setShowBannerForm(true)}>
                Schedule your own run instead?
              </button>
            )}

            {/* Active Posts */}
            <div className="dd-lfg-posts-wrap">
              <div className="dd-lfg-posts-title">Active LFG Posts</div>
              {posts.length === 0 ? (
                <p className="dd-lfg-empty">No active banners. Be the first to call the guild.</p>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="dd-lfg-post">
                    <div>
                      <span className="dd-lfg-post-name">{post.character_name}</span>
                      {' '}is seeking more as{' '}
                      <span className="dd-lfg-post-role">{post.role}</span>
                    </div>
                    {formatWindow(post) && (
                      <div className="dd-lfg-post-window">{formatWindow(post)}</div>
                    )}
                    {post.notes && (
                      <div className="dd-lfg-post-notes">{post.notes}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
