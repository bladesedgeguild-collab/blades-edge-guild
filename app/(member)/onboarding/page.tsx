'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CLASS_COLORS, CharacterClass } from '@/types'

const CLASSES: CharacterClass[] = [
  'WARRIOR', 'PALADIN', 'HUNTER', 'ROGUE', 'PRIEST',
  'SHAMAN', 'MAGE', 'WARLOCK', 'DRUID',
]

type SearchResult = {
  id: string
  name: string
  class: CharacterClass
  level: number
  rank_name: string | null
  last_zone: string | null
  professions: { name: string; skill_level: number; is_primary: boolean }[]
}

function ClassDot({ charClass }: { charClass: CharacterClass }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: CLASS_COLORS[charClass] ?? '#888' }}
    />
  )
}

function CharacterCard({ char }: { char: SearchResult }) {
  const color = CLASS_COLORS[char.class] ?? '#888'
  const primaryProfs = char.professions.filter((p) => p.is_primary)
  return (
    <div
      className="rounded-lg border p-4"
      style={{ backgroundColor: '#0a0f1e', borderColor: color, borderLeftWidth: 3 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <ClassDot charClass={char.class} />
        <span className="font-bold text-white">{char.name}</span>
      </div>
      <p className="text-sm" style={{ color }}>
        {char.class} — Level {char.level}
      </p>
      {char.rank_name && (
        <p className="text-xs mt-1" style={{ color: '#8fa3c8' }}>Rank: {char.rank_name}</p>
      )}
      {primaryProfs.length > 0 && (
        <p className="text-xs mt-1" style={{ color: '#8fa3c8' }}>
          Professions: {primaryProfs.map((p) => `${p.name} (${p.skill_level})`).join(', ')}
        </p>
      )}
      {char.last_zone && (
        <p className="text-xs mt-1" style={{ color: '#6b7a99' }}>Last seen in: {char.last_zone}</p>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [discordNickname, setDiscordNickname] = useState<string | null>(null)

  // Step 1
  const [mainSearch, setMainSearch] = useState('')
  const [mainResults, setMainResults] = useState<SearchResult[]>([])
  const [selectedChar, setSelectedChar] = useState<SearchResult | null>(null)
  const [mainCharacter, setMainCharacter] = useState<SearchResult | null>(null)
  const [showNewMember, setShowNewMember] = useState(false)
  const [newName, setNewName] = useState('')
  const [newClass, setNewClass] = useState<CharacterClass>('WARRIOR')
  const [newLevel, setNewLevel] = useState(60)

  // Step 2
  const [altSearch, setAltSearch] = useState('')
  const [altResults, setAltResults] = useState<SearchResult[]>([])
  const [alts, setAlts] = useState<SearchResult[]>([])

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const meta = user.user_metadata ?? {}
      const nickname = meta.full_name ?? meta.name ?? null
      setDiscordNickname(nickname)
    })
  }, [])

  // Debounced main character search
  useEffect(() => {
    if (mainSearch.length < 2) { setMainResults([]); return }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/characters/search?q=${encodeURIComponent(mainSearch)}`)
      const data = await res.json()
      setMainResults(data.characters ?? [])
    }, 300)
    return () => clearTimeout(timer)
  }, [mainSearch])

  // Debounced alt search
  useEffect(() => {
    if (altSearch.length < 2) { setAltResults([]); return }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/characters/search?q=${encodeURIComponent(altSearch)}`)
      const data = await res.json()
      const filtered = (data.characters ?? []).filter(
        (c: SearchResult) =>
          c.id !== mainCharacter?.id && !alts.some((a) => a.id === c.id)
      )
      setAltResults(filtered)
    }, 300)
    return () => clearTimeout(timer)
  }, [altSearch, mainCharacter, alts])

  async function confirmMainCharacter(char: SearchResult) {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/characters/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character_id: char.id, is_alt: false }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed to claim character'); return }
    setMainCharacter(char)
    setSelectedChar(null)
    setMainSearch('')
    setMainResults([])
    setStep(2)
  }

  async function createAndClaimCharacter() {
    if (!newName.trim()) { setError('Enter a character name.'); return }
    setLoading(true)
    setError(null)
    const res = await fetch('/api/characters/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), class: newClass, level: newLevel, is_alt: false }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed to create character'); return }
    setMainCharacter({
      id: data.character.id,
      name: newName.trim(),
      class: newClass,
      level: newLevel,
      rank_name: null,
      last_zone: null,
      professions: [],
    })
    setStep(2)
  }

  async function addAlt(char: SearchResult) {
    const res = await fetch('/api/characters/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character_id: char.id, is_alt: true }),
    })
    if (res.ok) {
      setAlts((prev) => [...prev, char])
      setAltSearch('')
      setAltResults([])
    }
  }

  async function completeOnboarding() {
    if (!userId) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ has_completed_onboarding: true })
      .eq('id', userId)
    setLoading(false)
    if (error) { setError('Failed to complete onboarding. Please try again.'); return }
    router.push('/dashboard')
    router.refresh()
  }

  const inputClass = 'w-full px-3 py-2 rounded-md text-sm text-white outline-none focus:ring-1 focus:ring-[#c9a84c]'
  const inputStyle = { backgroundColor: '#0a0f1e', border: '1px solid #1e2a45' }

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: step >= s ? '#c9a84c' : '#1e2a45',
                color: step >= s ? '#0a0f1e' : '#6b7a99',
              }}
            >
              {s}
            </div>
            {s < 2 && <div className="flex-1 h-px w-8" style={{ backgroundColor: step > s ? '#c9a84c' : '#1e2a45' }} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md text-sm text-red-400" style={{ backgroundColor: '#2d1a1a' }}>
          {error}
        </div>
      )}

      {/* ── Step 1: Claim main character ── */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#c9a84c' }}>
              A guildie has returned!
            </h1>
            <p style={{ color: '#8fa3c8' }}>
              Find your character in the Blådes Edge roster to claim your identity on the site.
            </p>
          </div>

          {/* Discord nickname hint */}
          {discordNickname && !selectedChar && (
            <div
              className="rounded-lg border p-3 flex items-center justify-between gap-3"
              style={{ backgroundColor: '#0d1326', borderColor: '#1e2a45' }}
            >
              <p className="text-sm" style={{ color: '#8fa3c8' }}>
                Your Discord nickname is <span className="text-white font-medium">"{discordNickname}"</span> — is this your character?
              </p>
              <button
                onClick={() => setMainSearch(discordNickname)}
                className="text-xs px-3 py-1.5 rounded font-medium flex-shrink-0 hover:opacity-80"
                style={{ backgroundColor: '#1e2a45', color: '#c9a84c' }}
              >
                Search
              </button>
            </div>
          )}

          {!selectedChar && !showNewMember && (
            <>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search character name…"
                  value={mainSearch}
                  onChange={(e) => setMainSearch(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
                {mainResults.length > 0 && (
                  <div
                    className="absolute z-10 w-full mt-1 rounded-md border overflow-hidden shadow-lg"
                    style={{ backgroundColor: '#0d1326', borderColor: '#1e2a45' }}
                  >
                    {mainResults.map((char) => (
                      <button
                        key={char.id}
                        onClick={() => { setSelectedChar(char); setMainSearch('') }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1e2a45] transition-colors text-left"
                      >
                        <ClassDot charClass={char.class} />
                        <span className="font-medium text-sm text-white">{char.name}</span>
                        <span className="text-xs ml-auto" style={{ color: CLASS_COLORS[char.class] }}>
                          {char.class}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: '#1e2a45', color: '#8fa3c8' }}
                        >
                          Lvl {char.level}
                        </span>
                        {char.rank_name && (
                          <span className="text-xs" style={{ color: '#6b7a99' }}>{char.rank_name}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowNewMember(true)}
                className="text-sm text-center hover:text-white transition-colors"
                style={{ color: '#6b7a99' }}
              >
                I&apos;m a new member — create my character
              </button>
            </>
          )}

          {/* Confirmation card */}
          {selectedChar && (
            <div className="flex flex-col gap-4">
              <p className="font-semibold text-white">Is this you?</p>
              <CharacterCard char={selectedChar} />
              <div className="flex gap-3">
                <button
                  onClick={() => confirmMainCharacter(selectedChar)}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-md text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#c9a84c', color: '#0a0f1e' }}
                >
                  {loading ? 'Claiming…' : 'Yes, this is me!'}
                </button>
                <button
                  onClick={() => { setSelectedChar(null); setMainSearch('') }}
                  className="flex-1 py-2.5 rounded-md text-sm font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: '#1e2a45', color: '#8fa3c8' }}
                >
                  Search again
                </button>
              </div>
            </div>
          )}

          {/* New member form */}
          {showNewMember && (
            <div
              className="flex flex-col gap-3 p-4 rounded-lg border"
              style={{ backgroundColor: '#0d1326', borderColor: '#1e2a45' }}
            >
              <p className="text-sm font-semibold text-white">Create your character</p>
              <input
                type="text"
                placeholder="Character name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
              <select
                value={newClass}
                onChange={(e) => setNewClass(e.target.value as CharacterClass)}
                className={inputClass}
                style={inputStyle}
              >
                {CLASSES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Level"
                value={newLevel}
                min={1}
                max={70}
                onChange={(e) => setNewLevel(parseInt(e.target.value) || 1)}
                className={inputClass}
                style={inputStyle}
              />
              <div className="flex gap-3">
                <button
                  onClick={createAndClaimCharacter}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-md text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#c9a84c', color: '#0a0f1e' }}
                >
                  {loading ? 'Creating…' : 'Create & Claim'}
                </button>
                <button
                  onClick={() => setShowNewMember(false)}
                  className="flex-1 py-2.5 rounded-md text-sm font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: '#1e2a45', color: '#8fa3c8' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Add alts ── */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#c9a84c' }}>
              Any alts to add?
            </h1>
            <p style={{ color: '#8fa3c8' }}>
              Add alt characters now or skip and come back later. Admins can also assign alts to your profile.
            </p>
          </div>

          {mainCharacter && (
            <div>
              <p className="text-xs mb-2 font-semibold uppercase tracking-widest" style={{ color: '#6b7a99' }}>Your main</p>
              <CharacterCard char={mainCharacter} />
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              placeholder="Search for alts…"
              value={altSearch}
              onChange={(e) => setAltSearch(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
            {altResults.length > 0 && (
              <div
                className="absolute z-10 w-full mt-1 rounded-md border overflow-hidden shadow-lg"
                style={{ backgroundColor: '#0d1326', borderColor: '#1e2a45' }}
              >
                {altResults.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => addAlt(char)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1e2a45] transition-colors text-left"
                  >
                    <ClassDot charClass={char.class} />
                    <span className="font-medium text-sm text-white">{char.name}</span>
                    <span className="text-xs ml-auto" style={{ color: CLASS_COLORS[char.class] }}>
                      {char.class}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: '#1e2a45', color: '#8fa3c8' }}
                    >
                      Lvl {char.level}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Alt chips */}
          {alts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {alts.map((alt) => (
                <span
                  key={alt.id}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: '#1e2a45', color: '#c9a84c' }}
                >
                  <ClassDot charClass={alt.class} />
                  {alt.name}
                  <button
                    onClick={() => setAlts((prev) => prev.filter((a) => a.id !== alt.id))}
                    className="ml-1 text-xs hover:text-red-400 transition-colors"
                    style={{ color: '#6b7a99' }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={completeOnboarding}
              disabled={loading}
              className="flex-1 py-2.5 rounded-md text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#c9a84c', color: '#0a0f1e' }}
            >
              {loading ? 'Finishing…' : 'Done, take me in!'}
            </button>
            <button
              onClick={completeOnboarding}
              disabled={loading}
              className="flex-1 py-2.5 rounded-md text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#1e2a45', color: '#8fa3c8' }}
            >
              Add alts later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
