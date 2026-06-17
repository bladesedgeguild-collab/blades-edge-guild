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

interface Props {
  dungeon: Dungeon
  initialPosts: LfgPost[]
  isLoggedIn: boolean
  characterName?: string
}

export default function DungeonDetail({ dungeon, initialPosts, isLoggedIn, characterName }: Props) {
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
      const today = new Date().toDateString()
      const mtDate = new Date(`${today} ${serverTimeStr} MST`)
      return mtDate.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
        timeZone: detectedTimezone,
      })
    } catch {
      return null
    }
  }

  const localStartEquiv = getLocalEquivalent(timeStart)
  const localEndEquiv = getLocalEquivalent(timeEnd)

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
                    <span style={{ fontSize: '0.72rem', color: 'var(--be-muted)', fontStyle: 'italic', fontFamily: 'Spectral, serif' }}>
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
            <div className="dd-lfg-form-wrap">
              <div className="dd-lfg-form-title">⚔️ Raise the Banner</div>
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
                      {timeStart && timeEnd ? ` from ${timeStart} to ${timeEnd} Server Time (Mountain)` : ''}
                      {detectedTimezone && localStartEquiv && localEndEquiv && (
                        <>
                          <br />
                          <span className="lfg-confirm-local">
                            That is {localStartEquiv} to {localEndEquiv} in your timezone ({detectedTimezone}).
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
                      className="dd-lfg-select"
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
                    <span className="lfg-server-label">Server Time (Mountain):</span>
                    <span className="lfg-server-value" id="server-time-display" />
                    <script dangerouslySetInnerHTML={{ __html: `
                      function updateServerTime() {
                        var now = new Date();
                        var mt = now.toLocaleTimeString('en-US', {
                          timeZone: 'America/Denver',
                          hour: '2-digit', minute: '2-digit', hour12: true
                        });
                        var el = document.getElementById('server-time-display');
                        if (el) el.textContent = mt + ' MT';
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
                      <label className="dd-lfg-label lfg-field-label">Start Time (MT)</label>
                      <select
                        className="dd-lfg-select"
                        value={timeStart}
                        onChange={e => setTimeStart(e.target.value)}
                      >
                        <option value="">Select...</option>
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <span className="lfg-time-to">to</span>
                    <div className="dd-lfg-field" style={{ flex: 1 }}>
                      <label className="dd-lfg-label lfg-field-label">End Time (MT)</label>
                      <select
                        className="dd-lfg-select"
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
                          {timeStart} MT is {localStartEquiv} in your local time.
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

                  <button type="submit" className="dd-lfg-btn" disabled={submitting}>
                    {submitting ? 'Raising...' : '⚔️ Raise the Banner'}
                  </button>
                </form>
              )}
            </div>

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
