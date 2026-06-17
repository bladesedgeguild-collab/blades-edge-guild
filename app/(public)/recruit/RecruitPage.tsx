'use client'

import './recruit.css'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

// ── Constants ─────────────────────────────────────────────────────────────────

const DISCORD_URL = 'https://discord.gg/B9fEz7AC6T'
const AUTH_URL = '/login'
const MAX_SCORE = 12
const LETTERS = ['A', 'B', 'C', 'D']

const CYCLING_IMAGES = [
  '/images/Summon_toBlastedLands.jpg',
  '/images/Summon_toMaraudon.jpg',
  '/images/Summon_toMaraudon2.jpg',
  '/images/Summon_toStormwind.jpg',
  '/images/Summon_toWinterspring.jpg',
  '/images/Recruiting_TophinDarkshire.jpg',
  '/images/Recruiting_TophInKharanos.jpg',
]

interface EvidenceImg {
  src: string
  caption: string
  pos: React.CSSProperties
  glow: 'summon' | 'recruit'
}

const Q3_EVIDENCE: EvidenceImg[] = [
  {
    src: '/images/Summon_toMaraudon2.jpg',
    caption: 'Summons to Maraudon at the portal purple side.',
    pos: { top: '7%', left: '2%' },
    glow: 'summon',
  },
  {
    src: '/images/Summon_toStormwind.jpg',
    caption: 'Summons to Stormwind when your hearthstone is set for questing but you need quick access to the Auction House or Bank.',
    pos: { top: '7%', right: '2%' },
    glow: 'summon',
  },
  {
    src: '/images/Summon_toWinterspring.jpg',
    caption: 'Get to the far north in Kalimdor quickly with summons to Winterspring.',
    pos: { bottom: '9%', right: '2%' },
    glow: 'summon',
  },
  {
    src: '/images/Summon_toBlastedLands.jpg',
    caption: 'Summons to the Dark Portal among 16 different locations our Warlock Summoning Army are standing by.',
    pos: { bottom: '9%', left: '2%' },
    glow: 'summon',
  },
]

const Q4_EVIDENCE: EvidenceImg[] = [
  {
    src: '/images/Recruiting_TophBagsFullofBags.jpg',
    caption: 'Recruiters Tøph, Ðjenna, Ðeerføx equipped with bags & tabards.',
    pos: { top: '12%', right: '1%' },
    glow: 'recruit',
  },
  {
    src: '/images/Recruiting_TophinDarkshire.jpg',
    caption: 'Recruiters Tøph, Ðjenna, Ðeerføx checking on progressing adventurers in Darkshire, Westfall, Redridge Mountains and Darkshore.',
    pos: { bottom: '8%', left: '4%' },
    glow: 'recruit',
  },
  {
    src: '/images/Recruiting_TophInKharanos.jpg',
    caption: 'Recruiters Tøph, Ðjenna, Ðeerføx traveling starting zones of Kharanos, Elwynn Forest, Teldrassil & Azuremyst Isle.',
    pos: { top: '12%', left: '1%' },
    glow: 'recruit',
  },
]

const GM_QUOTES = [
  "We are a casual guild with few expectations of you but ready to help & group up with you when you need!",
  "Let's keep it clean so my 10-year old daughter & your kids feel safe to log on sometimes.",
  "I have a summoning army of Warlocks with full bags of soul shards ready when you are!",
  "Our recruiters making the Call to Arms in the starting zones have bags full of...well...more bags!",
  "Haha you & I can be friends if you recognized that Southpark quote. XD",
  "Blådes Edge was my first ever guild in Vanilla WoW. I'm enjoying the homage & representing the name here again!",
]

const PERKS = [
  { title: 'Free Bags', desc: 'Four 10-slot bags, on the house, the moment you join.' },
  { title: 'Lock Summons', desc: 'Never run to a flight path again. Our locks have you.' },
  { title: 'GRATS Fam', desc: 'Helpful chat, real friends, zero toxicity.' },
  { title: 'Active Guild', desc: "Someone's always online for dungeons & groups." },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type BgMode = 'cycling' | 'summon' | 'perks' | 'shattrath'
type Screen = 'intro' | 'quiz' | 'result'

interface RawAnswer {
  t: string
  s: number
}

interface Question {
  eyebrow: string
  q: string
  a: RawAnswer[]
  background: BgMode
}

// ── Quiz data (exact wording from design) ────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    eyebrow: 'The Climb',
    q: 'What kind of leveling experience are you after in TBC?',
    a: [
      { t: 'Chill solo — with group help when I want it', s: 2 },
      { t: 'Social all the way — GRATS spam & guild chat', s: 2 },
      { t: 'Hardcore. Race to 70, no stops', s: 1 },
    ],
    background: 'cycling',
  },
  {
    eyebrow: 'The Hall',
    q: 'Guild chat should feel like…',
    a: [
      { t: 'Toxic tryhard energy', s: 0 },
      { t: 'Fam-friendly & always helpful', s: 2 },
      { t: 'Mostly quiet — leave me be', s: 1 },
    ],
    background: 'cycling',
  },
  {
    eyebrow: 'The Call',
    q: 'A guildmate needs a summon to a flight path. You…',
    a: [
      { t: '"Figure it out yourself, buddy."', s: 0 },
      { t: '"I got you — our locks are ready."', s: 2 },
    ],
    background: 'summon',
  },
  {
    eyebrow: 'The Spoils',
    q: "What's the biggest perk of a guild?",
    a: [
      { t: 'Free bags + mats, day one', s: 2 },
      { t: 'Dungeon groups & real friends', s: 2 },
      { t: 'Big, organized raids', s: 2 },
    ],
    background: 'perks',
  },
  {
    eyebrow: 'The Balance',
    q: 'Real life comes first?',
    a: [
      { t: 'Yes — casual is perfect. Real Life > WoW time.', s: 2 },
      { t: 'No — No life outside of WoW. "How do you kill, that which has no life?"', s: 1 },
    ],
    background: 'cycling',
  },
  {
    eyebrow: 'The Banner',
    q: 'Does the guild name tag matter to you?',
    a: [
      { t: 'Yes — I want to rep ⟨Blådes Edge⟩', s: 2 },
      { t: 'Not really, honestly (And no worries if you choose this!)', s: 1 },
    ],
    background: 'shattrath',
  },
]

// ── Result tiers (exact wording from design) ─────────────────────────────────

function getResult(score: number) {
  const ratio = score / MAX_SCORE
  if (ratio >= 0.78) return {
    tier: 'True Blade',
    name: 'Welcome Home.',
    body: [
      "You're one of us. The oath knows it — fam-",
      "friendly, helpful, here for the long haul. Grab",
      "your free bags and let's ride to 70 together.",
    ],
  }
  if (ratio >= 0.50) return {
    tier: 'Promising Edge',
    name: 'The Edge Is Calling.',
    body: [
      "You've got the spark. Sharpen it with the fam —",
      "we'll cover the bags, the summons, and the groups.",
      "You bring the good vibes.",
    ],
  }
  return {
    tier: 'Wandering Soul',
    name: 'Every Blade Was Once Unforged.',
    body: [
      "Maybe you've wandered Azeroth solo long enough.",
      "The hall is warm, the chat is kind, and the door",
      "is open whenever you're ready to belong.",
    ],
  }
}

// ── Ember helpers ─────────────────────────────────────────────────────────────

function makeEmbers(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i * 137.508) % 100
    const b = (i * 271.317) % 1
    const c = (i * 189.731) % 1
    return {
      id: i,
      left: `${a}%`,
      size: `${4 + b * 6}px`,
      delay: c * 8,
      duration: 8 + b * 6,
      emberX: `${(b - 0.5) * 120}px`,
    }
  })
}

// ── Main component ─────────────────────────────────────────────────────────────

export function RecruitPage() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [qIdx, setQIdx] = useState(0)
  const [scores, setScores] = useState<number[]>([])

  // Background cycling
  const [bgStep, setBgStep] = useState(0)
  const [showPrev, setShowPrev] = useState(false)

  // Evidence images (JS-driven, not CSS animations)
  const [evidenceCount, setEvidenceCount] = useState(0)

  // Two-phase result reveal
  const [phase, setPhase] = useState<'sealing' | 'reveal'>('sealing')
  const [barPct, setBarPct] = useState(0)
  const [avatarIdx, setAvatarIdx] = useState(0)

  const embers = useMemo(() => makeEmbers(26), [])

  const currentQ = QUESTIONS[qIdx]

  const bgMode: BgMode =
    screen === 'result' ? 'shattrath' :
    screen !== 'quiz' ? 'cycling' :
    (currentQ?.background ?? 'cycling')

  const isPinned = bgMode !== 'cycling'

  // Fix 2: Cycling timer 14000ms
  useEffect(() => {
    if (isPinned) return
    const id = setInterval(() => setBgStep(s => s + 1), 14000)
    return () => clearInterval(id)
  }, [isPinned])

  // Fix 2: Crossfade showPrev 3500ms
  useEffect(() => {
    if (bgStep === 0) return
    setShowPrev(true)
    const id = setTimeout(() => setShowPrev(false), 3500)
    return () => clearTimeout(id)
  }, [bgStep])

  // Evidence stagger: one image fades in at a time via is-on class
  useEffect(() => {
    const isEvidence = bgMode === 'summon' || bgMode === 'perks'
    if (!isEvidence) {
      setEvidenceCount(0)
      return
    }
    const total = bgMode === 'summon' ? Q3_EVIDENCE.length : Q4_EVIDENCE.length
    if (evidenceCount >= total) return
    const delay = evidenceCount === 0 ? 400 : 600
    const id = setTimeout(() => setEvidenceCount(c => c + 1), delay)
    return () => clearTimeout(id)
  }, [bgMode, evidenceCount])

  // Phase timer — sealing → reveal after 1500ms
  useEffect(() => {
    if (screen !== 'result') { setPhase('sealing'); return }
    const id = setTimeout(() => setPhase('reveal'), 2800)
    return () => clearTimeout(id)
  }, [screen])

  // Avatar cycling during quiz — reset on question change
  useEffect(() => {
    if (screen !== 'quiz') return
    setAvatarIdx(0)
    const t = setInterval(() => setAvatarIdx(i => (i + 1) % 5), 4000)
    return () => clearInterval(t)
  }, [qIdx, screen])

  // Match bar fills after reveal
  useEffect(() => {
    if (phase !== 'reveal') { setBarPct(0); return }
    const total = scores.reduce((s, v) => s + v, 0)
    const pct = Math.round((total / MAX_SCORE) * 100)
    const id = setTimeout(() => setBarPct(pct), 300)
    return () => clearTimeout(id)
  }, [phase, scores])

  function startQuiz() {
    setQIdx(0)
    setScores([])
    setScreen('quiz')
  }

  // Fix 8: Back function
  function back() {
    if (qIdx === 0) return
    setScores(s => s.slice(0, -1))
    setQIdx(i => i - 1)
  }

  function selectAnswer(score: number) {
    const next = [...scores, score]
    setScores(next)
    if (qIdx < QUESTIONS.length - 1) {
      setQIdx(i => i + 1)
    } else {
      setScreen('result')
    }
  }

  function retake() {
    setQIdx(0)
    setScores([])
    setPhase('sealing')
    setBarPct(0)
    setScreen('intro')
  }

  async function handleShare() {
    const total = scores.reduce((s, v) => s + v, 0)
    const pct = Math.round((total / MAX_SCORE) * 100)
    const res = getResult(total)
    const text = `I scored ${pct}% on the Blådes Edge Oath Quiz — ${res.tier}. ${res.name}`
    const url = window.location.href
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'Blådes Edge Oath Quiz', text, url }) } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(`${text} ${url}`) } catch { /* unavailable */ }
    }
  }

  const curCycleIdx = bgStep % CYCLING_IMAGES.length
  const prevCycleIdx = (bgStep - 1 + CYCLING_IMAGES.length) % CYCLING_IMAGES.length
  const totalScore = scores.reduce((s, v) => s + v, 0)
  const result = getResult(totalScore)

  return (
    <div className="rc-page">

      {/* ── Background ── */}
      <div className="rc-bg-layer">
        {bgMode === 'cycling' && (
          <>
            {showPrev && bgStep > 0 && (
              <div key={`prev-${bgStep}`} className="rc-bg-prev"
                style={{ backgroundImage: `url(${CYCLING_IMAGES[prevCycleIdx]})` }} />
            )}
            <div key={`cur-${bgStep}`} className="rc-bg-cur"
              style={{ backgroundImage: `url(${CYCLING_IMAGES[curCycleIdx]})` }} />
          </>
        )}
        {bgMode === 'summon' && (
          <div className="rc-bg-pinned" style={{ backgroundImage: 'url(/images/Summon_toBlastedLands.jpg)' }} />
        )}
        {bgMode === 'perks' && (
          <div className="rc-bg-pinned" style={{ backgroundImage: 'url(/images/guild-photo.jpg)' }} />
        )}
        {bgMode === 'shattrath' && (
          <div className="rc-bg-pinned" style={{ backgroundImage: 'url(/images/GuildiesInShattrath.jpg)' }} />
        )}
      </div>

      {/* ── Overlay ── */}
      <div className={`rc-overlay${screen === 'result' ? ' is-result' : ''}`} />

      {/* ── Embers ── */}
      <div className="rc-embers">
        {embers.map((e) => (
          <span
            key={e.id}
            style={{
              position: 'absolute',
              bottom: '-10px',
              left: e.left,
              width: e.size,
              height: e.size,
              borderRadius: '50%',
              backgroundColor: 'var(--be-gold)',
              boxShadow: '0 0 4px var(--be-gold)',
              animation: `be-ember-rise ${e.duration}s ease-in ${e.delay}s infinite both`,
              ['--ember-x' as string]: e.emberX,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ── Evidence: Q3 summon ── */}
      {bgMode === 'summon' && (
        <div className="rc-evidence-wrap">
          {Q3_EVIDENCE.map((img, i) => (
            <div key={i} className={`rc-evi rc-evi-summon${i < evidenceCount ? ' is-on' : ''}`} style={img.pos}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" />
              {img.caption && <p className="rc-evi-caption">{img.caption}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── Evidence: Q4 perks ── */}
      {bgMode === 'perks' && (
        <div className="rc-evidence-wrap">
          {Q4_EVIDENCE.map((img, i) => (
            <div key={i} className={`rc-evi rc-evi-recruit${i < evidenceCount ? ' is-on' : ''}`} style={img.pos}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" />
              {img.caption && <p className="rc-evi-caption">{img.caption}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ═══ INTRO ═══ */}
      {screen === 'intro' && (
        <div style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          overflowY: 'auto',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/guild-crest_Alpha.png" alt="Blådes Edge" style={{ width: 96, height: 96, marginBottom: 20, objectFit: 'contain' }} />

          <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.75rem', letterSpacing: '0.25em', color: 'var(--be-gold)', marginBottom: 16, display: 'block' }}>
            — BLÅDES EDGE · TBC CLASSIC —
          </span>

          <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 'clamp(3.5rem, 10vw, 7rem)', lineHeight: 1.0, color: '#f0e6c8', marginBottom: 24 }}>
            Answer<br />
            <span style={{ color: 'var(--be-gold)' }}>the</span><br />
            Call
          </h1>

          {/* Fix 1: forced 2-line break */}
          <p className="rc-sub">
            <span style={{ display: 'block' }}>Take the Oath. Six questions, sixty seconds.</span>
            <span style={{ display: 'block' }}>Find out if your blade belongs with ours.</span>
          </p>

          {/* Fix 12: 200px seal, dark red gradient, double pulse ring */}
          <button onClick={startQuiz} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 40 }}>
            <div className="rc-seal-wrap">
              <div className="rc-seal-circle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/guild-crest_Alpha.png" alt="" className="rc-crest-img rc-intro-crest" />
                <div className="rc-seal-pulse" />
                <div className="rc-seal-pulse rc-seal-pulse-2" />
              </div>
              {/* Fix 4: White bold labels */}
              <div className="rc-seal-label">BEGIN THE OATH</div>
              <div className="rc-seal-sublabel">PRESS THE SEAL</div>
            </div>
          </button>

          <div className="rc-meta-chip" style={{ marginTop: 32 }}>
            <b>~60 SEC</b> · 6 QUESTIONS · NO SIGNUP TO START
          </div>
        </div>
      )}

      {/* ═══ QUIZ ═══ */}
      {screen === 'quiz' && currentQ && (
        <>
          <div className="rc-quiz-content">
            <div className="rc-card">
              <div className="rc-progress-row">
                <div className="rc-progress">
                  {QUESTIONS.map((_, i) => (
                    <div key={i} className={`rc-progress-pip${i <= qIdx ? ' is-active' : ''}`} />
                  ))}
                </div>
                <span className="rc-q-count"><b>{qIdx + 1}</b>/{QUESTIONS.length}</span>
              </div>

              <span className="rc-q-eyebrow">{currentQ.eyebrow}</span>
              {qIdx === 0 ? (
                <h2 className="rc-question">
                  <span style={{ display: 'block' }}>What kind of leveling experience</span>
                  <span style={{ display: 'block' }}>are you after in TBC?</span>
                </h2>
              ) : (
                <h2 className="rc-question">{currentQ.q}</h2>
              )}

              <div className="rc-answers">
                {currentQ.a.map((ans, i) => (
                  <button key={i} className="rc-answer-btn" onClick={() => selectAnswer(ans.s)}>
                    <span className="rc-letter-badge">{LETTERS[i]}</span>
                    <span>{ans.t}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="rc-quiz-back"
                onClick={back}
                disabled={qIdx === 0}
              >
                ‹ Back
              </button>
            </div>
          </div>

          {/* Fix 4: GM quote + speaking image — bottom-right corner */}
          <div className="rc-gm-corner">
            <div className="rc-gm-images">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={avatarIdx}
                src={`/images/AvatarOdys_speaking${(avatarIdx % 5) + 1}.jpg`}
                className="rc-gm-img"
                alt=""
              />
            </div>
            <div className="rc-gm-quote-wrap">
              <blockquote className="rc-gm-quote">
                &ldquo;{GM_QUOTES[qIdx]}&rdquo;
              </blockquote>
              <div className="rc-gm-byline">
                <span className="rc-gm-name">Åvatarødys</span>
                <span className="rc-gm-title">Blådes Edge Guild Master</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ RESULT ═══ */}
      {screen === 'result' && (
        <>
          {/* Fix 1: Sealing phase — stamp + text center screen */}
          {phase === 'sealing' && (
            <div className="rc-sealing-wrap">
              <div className="rc-sealing-crest">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/guild-crest_Alpha.png" alt="" />
              </div>
              <p className="rc-sealing-text">Sealing your oath...</p>
            </div>
          )}

          {/* Fix 6: Seal slides to top at 75% when reveal starts */}
          {phase === 'reveal' && (
            <div className="rc-result-seal-wrap reveal">
              <div className="rc-result-seal-circle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/guild-crest_Alpha.png" alt="Blådes Edge" className="rc-crest-img rc-result-seal-img is-settled" />
              </div>
            </div>
          )}

          {/* Content fades in after seal slides up */}
          {phase === 'reveal' && (
            <div className="rc-result-content" style={{ animation: 'rc-fade-up 0.7s ease both' }}>
              <div className="rc-result-tier">— {result.tier} —</div>

              <h1 className="rc-result-name">{result.name}</h1>

              <p className="rc-result-body">
                {result.body.map((line, i) => (
                  <span key={i} className="rc-body-line">{line}</span>
                ))}
              </p>

              {/* Match bar */}
              <div style={{ width: '100%', maxWidth: 480, marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="rc-match-label">Guild Match</span>
                  <span className="rc-match-pct">{barPct}%</span>
                </div>
                <div className="rc-match-track">
                  <div className="rc-match-fill" style={{ width: `${barPct}%` }} />
                </div>
              </div>

              {/* Perks 2×2 */}
              <div className="rc-result-perks" style={{ maxWidth: 480, width: '100%' }}>
                {PERKS.map((p, i) => (
                  <div key={i} className="rc-perk-card">
                    <span className="rc-perk-name">{p.title}</span>
                    <span className="rc-perk-body">{p.desc}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="rc-cta-row" style={{ width: '100%', maxWidth: 480 }}>
                <a className="rc-cta-discord" href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                  <svg width="18" height="14" viewBox="0 0 24 18" fill="currentColor" aria-hidden="true">
                    <path d="M20.317 1.492A19.825 19.825 0 0 0 15.885.096a.074.074 0 0 0-.079.037c-.34.608-.72 1.4-.986 2.025a18.3 18.3 0 0 0-5.64 0 12.974 12.974 0 0 0-1-2.025.077.077 0 0 0-.079-.037 19.78 19.78 0 0 0-4.432 1.396.07.07 0 0 0-.032.027C.533 6.093-.32 10.56.099 14.97a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                  Join on Discord
                </a>
                <Link className="rc-cta-register" href={AUTH_URL}>
                  Register &amp; Claim Character
                </Link>
              </div>

              <p className="rc-recruiter-note">
                A recruiter will{' '}
                <strong style={{ color: 'var(--be-gold)', fontWeight: 700 }}>
                  invite you in-game
                </strong>
                . But feel free to register now so your spot is ready.
              </p>

              <div className="rc-tools-row">
                <button className="rc-tool-btn" onClick={handleShare}>⤳ Share my result</button>
                <button className="rc-tool-btn" onClick={retake}>↺ Retake the oath</button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  )
}
