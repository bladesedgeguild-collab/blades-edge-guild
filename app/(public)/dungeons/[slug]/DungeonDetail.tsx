'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { opensOnLabel } from '@/data/dungeons/index'
import type { Dungeon, WoWClass } from '@/data/dungeons/types'
import { GroupBoard } from '@/components/lfg/GroupBoard'
import { ScheduleFields } from '@/components/lfg/ScheduleFields'
import { normalizeGroup, partyXpWarning, resolveNeeds, type Needs } from '@/lib/lfg-group'
import { formatRange, localFieldsFromInstant, SERVER_TIME_ZONE } from '@/lib/lfg-time'
import { levelFit, levelFitLabel } from '@/lib/level-fit'
import { displayClassName, effectiveRoles, type LfgRole } from '@/lib/roles'
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

type LfgPost = {
  id: string
  character_name: string
  role: string
  available_window: string | null
  notes: string | null
  starts_at?: string | null
  ends_at?: string | null
}

type FeaturedLFG = LfgPost & {
  is_owner?: boolean
  needs?: Needs | null
  current_group: unknown
}

type UserChar = {
  id: string
  name: string
  level: number
  class: string
  is_main: boolean
  roles?: string[] | null
}

interface Props {
  dungeon: Dungeon
  initialPosts: LfgPost[]
  isLoggedIn: boolean
  featuredLFG?: FeaturedLFG | null
  isOfficer?: boolean
  userChars?: UserChar[]
  playerLevel?: number | null
}

export default function DungeonDetail({
  dungeon,
  initialPosts,
  isLoggedIn,
  featuredLFG,
  isOfficer = false,
  userChars = [],
  playerLevel = null,
}: Props) {
  const [selectedClass, setSelectedClass] = useState<WoWClass>('Warrior')
  const [openBoss, setOpenBoss] = useState<number | null>(null)
  const [selectedCharId, setSelectedCharId] = useState(userChars.find(character => character.is_main)?.id ?? userChars[0]?.id ?? '')
  const selectedChar = userChars.find(character => character.id === selectedCharId) ?? userChars[0]
  const roleOptions = selectedChar ? effectiveRoles(selectedChar.class, selectedChar.roles) : (['DPS'] as LfgRole[])
  const [role, setRole] = useState<LfgRole>(roleOptions[0] ?? 'DPS')
  const [needs, setNeeds] = useState<Needs>({
    tank: dungeon.groupComp.tank,
    healer: dungeon.groupComp.healer,
    dps: dungeon.groupComp.dps,
  })
  const [date, setDate] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [notes, setNotes] = useState('')
  const [timeZone, setTimeZone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [posts, setPosts] = useState<LfgPost[]>(initialPosts)
  const [showForm, setShowForm] = useState(!featuredLFG)
  const [featuredPost, setFeaturedPost] = useState(featuredLFG ?? null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  const chosenRole = roleOptions.includes(role) ? role : (roleOptions[0] ?? 'DPS')

  const classLoot = dungeon.loot.filter(item => {
    const relevance = item.relevance[selectedClass]
    return relevance !== undefined && relevance.rating !== 'skip'
  })
  const allianceQuests = dungeon.quests.filter(quest => quest.faction !== 'Horde')
  const namesOnly = dungeon.bosses.length > 0 && dungeon.bosses.every(boss => boss.quickTips.length === 0)
  const opens = opensOnLabel(dungeon)
  const fit = playerLevel != null ? levelFit(dungeon, playerLevel) : null
  const fitLabel = fit ? levelFitLabel(fit, dungeon) : null
  const featuredNeeds = featuredPost
    ? resolveNeeds(featuredPost.needs, { tank: dungeon.groupComp.tank, healer: dungeon.groupComp.healer, dps: dungeon.groupComp.dps })
    : null
  const featuredGroup = featuredPost ? normalizeGroup(featuredPost.current_group) : null

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedChar) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/dungeons/lfg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dungeonSlug: dungeon.id,
          role: chosenRole,
          characterId: selectedChar.id,
          notes,
          date,
          start,
          end: end || null,
          timeZone,
          needs,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not raise the banner.')
        return
      }
      setPosts(prev => [data, ...prev])
      setSuccess(timeZone && data.starts_at
        ? `${formatRange(data.starts_at, data.ends_at, timeZone)} · Server time: ${formatRange(data.starts_at, data.ends_at, SERVER_TIME_ZONE)}`
        : 'Banner raised.')
      setNotes('')
    } finally {
      setSubmitting(false)
    }
  }

  async function cancelFeatured() {
    if (!featuredPost) return
    const res = await fetch(`/api/dungeons/lfg/${featuredPost.id}`, { method: 'DELETE' })
    if (res.ok) {
      setFeaturedPost(null)
      setShowForm(true)
    }
  }

  async function saveFeatured(event: React.FormEvent) {
    event.preventDefault()
    if (!featuredPost) return
    const res = await fetch(`/api/dungeons/lfg/${featuredPost.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, date, start, end: end || null, timeZone, needs }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Could not save.')
      return
    }
    setFeaturedPost(prev => prev ? { ...prev, notes, starts_at: data.starts_at, ends_at: data.ends_at, needs: data.needs } : prev)
    setEditing(false)
  }

  function beginEdit() {
    if (!featuredPost?.starts_at || !timeZone) {
      setDate('')
      setStart('')
      setEnd('')
    } else {
      const fields = localFieldsFromInstant(featuredPost.starts_at, timeZone)
      setDate(fields.date)
      setStart(fields.time)
      setEnd(featuredPost.ends_at ? localFieldsFromInstant(featuredPost.ends_at, timeZone).time : '')
    }
    setNotes(featuredPost?.notes ?? '')
    setEditing(true)
  }

  const posterWarning = selectedChar
    ? partyXpWarning([selectedChar.level], dungeon.recommendedLevelMax)
    : null

  return (
    <div className="dd-page">
      <div className="dd-hero">
        <div className="dd-hero-inner">
          <Link href="/dungeons" className="dd-back">← All Dungeons</Link>
          <div className="dd-continent">{dungeon.continent} &middot; {dungeon.zone}</div>
          <h1 className="dd-title">{dungeon.name}</h1>
          <div className="dd-meta-row">
            <span>Level {dungeon.recommendedLevelMin}–{dungeon.recommendedLevelMax}</span>
            <span className="dd-meta-sep">|</span>
            <span>Door {dungeon.minLevel}</span>
            <span className="dd-meta-sep">|</span>
            {dungeon.estimatedTimeMinutes != null && (
              <>
                <span>~{dungeon.estimatedTimeMinutes} min</span>
                <span className="dd-meta-sep">|</span>
              </>
            )}
            <span>{dungeon.maxPlayers}-player {dungeon.instanceType}</span>
            {opens && <span className="df-heroic-badge">{opens}</span>}
            {fitLabel && <span className="df-heroic-badge">{fitLabel}</span>}
          </div>
          <p className="dd-summary">{dungeon.summary}</p>
        </div>
      </div>

      <div className="dd-body">
        {featuredPost && featuredNeeds && featuredGroup && (
          <div className="dungeon-featured-lfg">
            <div className="dungeon-featured-header">
              <div className="dungeon-featured-title">Active Call for This Dungeon</div>
              {(featuredPost.is_owner || isOfficer) && (
                <div className="dungeon-featured-actions">
                  {featuredPost.is_owner && !editing && (
                    <button className="lfg-edit-btn" onClick={beginEdit}>Edit</button>
                  )}
                  <button className="lfg-cancel-btn" onClick={cancelFeatured}>Cancel Request</button>
                </div>
              )}
            </div>
            <p className="lfg-big-meta">
              <strong>{featuredPost.role} {featuredPost.character_name}</strong> is seeking more.
            </p>
            {featuredPost.starts_at && timeZone && (
              <div className="dungeon-featured-window">
                {formatRange(featuredPost.starts_at, featuredPost.ends_at, timeZone)}
                <div className="lfg-server-hint">Server time: {formatRange(featuredPost.starts_at, featuredPost.ends_at, SERVER_TIME_ZONE)}</div>
              </div>
            )}
            <GroupBoard
              lfgId={featuredPost.id}
              needs={featuredNeeds}
              group={featuredGroup}
              recommendedLevelMax={dungeon.recommendedLevelMax}
              isLoggedIn={isLoggedIn}
              isOwner={!!featuredPost.is_owner}
              userChars={userChars}
              onChange={group => setFeaturedPost(prev => prev ? { ...prev, current_group: group } : prev)}
            />
            {editing ? (
              <form onSubmit={saveFeatured} className="lfg-edit-form">
                <ScheduleFields date={date} start={start} end={end} onChange={next => { setDate(next.date); setStart(next.start); setEnd(next.end) }} />
                <textarea className="dd-lfg-textarea" value={notes} onChange={event => setNotes(event.target.value)} rows={3} />
                <div className="lfg-edit-actions">
                  <button type="submit" className="dd-lfg-btn df-lfg-btn">Save Changes</button>
                  <button type="button" className="lfg-cancel-btn" onClick={() => setEditing(false)}>Discard</button>
                </div>
              </form>
            ) : featuredPost.notes && (
              <div className="lfg-hover-note"><span className="lfg-hover-note-label">Note:</span><p className="lfg-hover-note-text">{featuredPost.notes}</p></div>
            )}
          </div>
        )}

        <div className="dd-section">
          <div className="dd-section-title">Before You Go</div>
          <div className="dd-quick-card">
            <div className="dd-quick-row">
              <span><span className="dd-quick-label">Tanks:</span>{dungeon.groupComp.tank}</span>
              <span><span className="dd-quick-label">Healers:</span>{dungeon.groupComp.healer}</span>
              <span><span className="dd-quick-label">DPS:</span>{dungeon.groupComp.dps}</span>
            </div>
            {dungeon.groupComp.notes && <div className="dd-quick-row"><span style={{ color: 'var(--be-muted)' }}>{dungeon.groupComp.notes}</span></div>}
            {dungeon.requirement && <div className="dd-requirement">{dungeon.requirement}</div>}
            {dungeon.specialMechanic && dungeon.specialMechanic !== dungeon.requirement && (
              <div className="dd-special-note">⚡ {dungeon.specialMechanic}</div>
            )}
            {opens && <div className="dd-special-note">{opens}. You can still schedule a group ahead of the door.</div>}
          </div>
        </div>

        {dungeon.tips.length > 0 && (
          <div className="dd-section">
            <div className="dd-section-title">Guild Tips</div>
            <div className="dd-boss-tips">
              {dungeon.tips.map(tip => <div key={tip} className="dd-boss-tip">• {tip}</div>)}
            </div>
          </div>
        )}

        {dungeon.uncertain.length > 0 && (
          <div className="dd-section">
            <div className="dd-section-title">Less certain</div>
            <div className="dd-boss-tips">
              {dungeon.uncertain.map(note => <div key={note} className="dd-boss-tip">• {note}</div>)}
            </div>
          </div>
        )}

        <div className="dd-section">
          <div className="dd-section-title">Quests</div>
          {allianceQuests.length === 0 ? (
            <p className="dd-quest-empty">Quest details are not listed yet. Nothing here is filled in from guesswork.</p>
          ) : (
            <div className="dd-quest-list">
              {allianceQuests.map(quest => (
                <div key={quest.name} className="dd-quest-item">
                  <div className="dd-quest-name">{quest.name}</div>
                  <div className="dd-quest-starts">Starts: {quest.startsAt}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dd-section">
          <div className="dd-section-title">Bosses</div>
          {dungeon.bosses.length === 0 ? (
            <p className="dd-boss-empty">Boss guides are not listed yet.</p>
          ) : namesOnly ? (
            <>
              <p className="dd-boss-empty">
                {dungeon.bosses.some(boss => boss.unconfirmed)
                  ? 'These names are incomplete or disagree across sources, so they are listed without a kill order or tactics.'
                  : 'Names only. Tactics are not written up yet.'}
              </p>
              <div className="dd-boss-list">
                {dungeon.bosses.map(boss => (
                  <div key={boss.order} className="dd-boss-item">
                    <div className="dd-boss-header">
                      <span className="dd-boss-order">{boss.order}.</span>
                      <span className="dd-boss-name">{boss.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="dd-boss-list">
              {dungeon.bosses.map(boss => (
                <div key={boss.order} className="dd-boss-item">
                  <button className="dd-boss-header" onClick={() => setOpenBoss(openBoss === boss.order ? null : boss.order)}>
                    <span className="dd-boss-order">{boss.order}.</span>
                    <span className="dd-boss-name">{boss.name}</span>
                  </button>
                  {openBoss === boss.order && (
                    <div className="dd-boss-tips">
                      {boss.quickTips.map(tip => <div key={tip} className="dd-boss-tip">• {tip}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
            <p className="dd-loot-empty">Loot for {selectedClass} is not sourced yet.</p>
          ) : (
            <div className="dd-loot-list">
              {classLoot.map(item => {
                const relevance = item.relevance[selectedClass]!
                return (
                  <div key={`${item.name}-${item.boss}`} className="dd-loot-item">
                    <span className="dd-loot-name">{item.name}</span>
                    <span className="dd-loot-slot">{item.slot}</span>
                    <span className={`dd-loot-rating dd-loot-rating--${relevance.rating}`}>{relevance.rating}</span>
                    <span className="dd-loot-boss">{item.boss}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="dd-section">
          <div className="dd-section-title">Call the Guild</div>
          <div className="dd-lfg-board">
            {showForm ? (
              <div className="dd-lfg-form-wrap">
                <div className="dd-lfg-form-title">Raise the Banner</div>
                {!isLoggedIn ? (
                  <p className="dd-lfg-auth-note"><Link href="/login">Log in</Link> to post a LFG request.</p>
                ) : success ? (
                  <div className="dd-lfg-success">
                    <div>Banner raised. Matched guildmates can see it on the site.</div>
                    <div className="lfg-confirm-time">{success}</div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {userChars.length > 0 && (
                      <div className="dd-lfg-field">
                        <label className="dd-lfg-label">Posting as</label>
                        <select className="dd-lfg-select" value={selectedCharId} onChange={event => setSelectedCharId(event.target.value)}>
                          {userChars.map(character => (
                            <option key={character.id} value={character.id}>
                              {character.is_main ? '★ ' : ''}{character.name} — Lvl {character.level} {displayClassName(character.class)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="dd-lfg-field">
                      <label className="dd-lfg-label">Your Role</label>
                      <select className="dd-lfg-select" value={chosenRole} onChange={event => setRole(event.target.value as LfgRole)}>
                        {roleOptions.map(option => <option key={option}>{option}</option>)}
                      </select>
                    </div>
                    <div className="lfg-time-row">
                      {(['tank', 'healer', 'dps'] as const).map(key => (
                        <div key={key} className="dd-lfg-field" style={{ flex: 1 }}>
                          <label className="dd-lfg-label">{key === 'dps' ? 'DPS slots' : `${key[0].toUpperCase()}${key.slice(1)} slots`}</label>
                          <input
                            className="dd-lfg-select"
                            type="number"
                            min={0}
                            max={dungeon.maxPlayers}
                            value={needs[key]}
                            onChange={event => setNeeds(prev => ({ ...prev, [key]: Number(event.target.value) }))}
                          />
                        </div>
                      ))}
                    </div>
                    <ScheduleFields
                      date={date}
                      start={start}
                      end={end}
                      onChange={next => { setDate(next.date); setStart(next.start); setEnd(next.end) }}
                    />
                    {posterWarning && <p className="lfg-xp-warning">{posterWarning}</p>}
                    {fit === 'locked' && fitLabel && <p className="lfg-xp-warning">{fitLabel}. This character cannot enter yet.</p>}
                    <div className="dd-lfg-field">
                      <label className="dd-lfg-label">Notes</label>
                      <textarea className="dd-lfg-textarea" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Route, attunement, or who you still need" />
                    </div>
                    {error && <p className="lfg-xp-warning">{error}</p>}
                    <button type="submit" className="dd-lfg-btn df-lfg-btn" disabled={submitting || userChars.length === 0}>
                      {submitting ? 'Raising...' : 'Raise the Banner'}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <button className="dungeon-own-run-btn" onClick={() => setShowForm(true)}>Schedule your own run instead?</button>
            )}

            <div className="dd-lfg-posts-wrap">
              <div className="dd-lfg-posts-title">Active LFG Posts</div>
              {posts.length === 0 ? (
                <p className="dd-lfg-empty">No active banners. Be the first to call the guild.</p>
              ) : posts.map(post => (
                <div key={post.id} className="dd-lfg-post">
                  <div>
                    <span className="dd-lfg-post-name">{post.character_name}</span>
                    {' '}is seeking more as <span className="dd-lfg-post-role">{post.role}</span>
                  </div>
                  {post.starts_at && timeZone ? (
                    <div className="dd-lfg-post-window">
                      {formatRange(post.starts_at, post.ends_at, timeZone)}
                      <div className="lfg-server-hint">Server time: {formatRange(post.starts_at, post.ends_at, SERVER_TIME_ZONE)}</div>
                    </div>
                  ) : post.available_window && <div className="dd-lfg-post-window">{post.available_window}</div>}
                  {post.notes && <div className="dd-lfg-post-notes">{post.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
