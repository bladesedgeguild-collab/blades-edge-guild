'use client'

import './recruit.css'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

// ── Constants ────────────────────────────────────────────────────────────────

const DISCORD_URL = 'https://discord.gg/B9fEz7AC6T'
const AUTH_URL = '/login'
const MAX_SCORE = 12

const CYCLING_IMAGES = [
  '/images/Summon_toBlastedLands.jpg',
  '/images/Summon_toMaraudon.jpg',
  '/images/Summon_toMaraudon2.jpg',
  '/images/Summon_toStormwind.jpg',
  '/images/Summon_toWinterspring.jpg',
  '/images/Recruiting_TophinDarkshire.jpg',
  '/images/Recruiting_TophInKharanos.jpg',
]

const Q3_EVIDENCE = [
  '/images/Summon_toMaraudon2.jpg',
  '/images/Summon_toStormwind.jpg',
  '/images/Summon_toBlastedLands.jpg',
  '/images/Summon_toWinterspring.jpg',
  '/images/Summon_toMaraudon.jpg',
]

const Q4_EVIDENCE = [
  '/images/Recruiting_TophBagsFullofBags.jpg',
  '/images/Recruiting_TophinDarkshire.jpg',
  '/images/Recruiting_TophInKharanos.jpg',
  '/images/GuildiesInShattrath.jpg',
]

const PERKS = [
  { icon: '✦', bold: 'Free welcome bags', desc: ' — Four 10-slot bags, on the house, the moment you join.' },
  { icon: '✦', bold: 'Lock summons anywhere', desc: ' — Never run to a flight path again. Our locks have you.' },
  { icon: '✦', bold: 'GRATS-friendly fam', desc: ' — Helpful chat, real friends, zero toxicity.' },
  { icon: '✦', bold: 'Big, active guild', desc: " — Someone's always online for dungeons & groups." },
]

// ── Types ────────────────────────────────────────────────────────────────────

type BgMode = 'cycling' | 'summon' | 'perks' | 'shattrath'
type Screen = 'intro' | 'quiz' | 'result'
type Letter = 'A' | 'B' | 'C'

interface Answer {
  letter: Letter
  text: string
  score: number
}

interface Question {
  id: number
  eyebrow: string
  text: string
  answers: Answer[]
  background: BgMode
}

// ── Quiz data ─────────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    id: 1,
    eyebrow: 'Question 1 of 6',
    text: 'What calls you back to Azeroth?',
    answers: [
      { letter: 'A', text: "My old guild fam — I heard they're rebuilding and I had to answer the call.", score: 2 },
      { letter: 'B', text: 'The world, the lore, the rush of Classic. I\'m hooked again.', score: 1 },
      { letter: 'C', text: "My roommate started playing and now I'm reinstalling at midnight.", score: 0 },
    ],
    background: 'cycling',
  },
  {
    id: 2,
    eyebrow: 'Question 2 of 6',
    text: 'You finally hit 70. First thing you do?',
    answers: [
      { letter: 'A', text: "Check guild chat — see who needs a dungeon run. Community first.", score: 2 },
      { letter: 'B', text: "Max professions, sort my gear, then I'm ready for anything.", score: 1 },
      { letter: 'C', text: 'Log off immediately and celebrate. The journey was the destination.', score: 0 },
    ],
    background: 'cycling',
  },
  {
    id: 3,
    eyebrow: 'Question 3 of 6',
    text: "Your guild warlock opens a ritual. You're in Winterspring.",
    answers: [
      { letter: 'A', text: "Already clicking Accept before they finish casting. Locks are sacred.", score: 2 },
      { letter: 'B', text: "Accept gratefully — every summon saves a 10-minute flight.", score: 1 },
      { letter: 'C', text: "Decline politely. You don't want to trouble anyone. You'll fly.", score: 0 },
    ],
    background: 'summon',
  },
  {
    id: 4,
    eyebrow: 'Question 4 of 6',
    text: 'A guildie just dropped free 10-slot bags in the bank for everyone.',
    answers: [
      { letter: 'A', text: 'Grab the bags + spam GRATS in guild chat. This is guild life.', score: 2 },
      { letter: 'B', text: 'Quietly take one and whisper them a sincere thank-you.', score: 1 },
      { letter: 'C', text: 'Leave them for someone who needs them more.', score: 0 },
    ],
    background: 'perks',
  },
  {
    id: 5,
    eyebrow: 'Question 5 of 6',
    text: 'Someone in guild chat asks a question you know the answer to.',
    answers: [
      { letter: 'A', text: 'Type out the full walkthrough — bonus tips included. You love this.', score: 2 },
      { letter: 'B', text: 'Drop a quick answer and a Wowhead link. Done.', score: 1 },
      { letter: 'C', text: 'Stay quiet. Someone else will get it.', score: 0 },
    ],
    background: 'cycling',
  },
  {
    id: 6,
    eyebrow: 'Question 6 of 6',
    text: 'A stranger in Shattrath City notices your <Blådes Edge> tag.',
    answers: [
      { letter: 'A', text: 'You light up. You pitch the guild. You might just recruit them.', score: 2 },
      { letter: 'B', text: '"Great guild, great people. Worth checking out."', score: 1 },
      { letter: 'C', text: '"Some guild lol." You let your gear do the talking.', score: 0 },
    ],
    background: 'shattrath',
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function getTier(score: number) {
  const ratio = score / MAX_SCORE
  if (ratio >= 0.78) return { label: 'True Blade', tagline: 'Welcome home.', color: '#c9961a' }
  if (ratio >= 0.50) return { label: 'Promising Edge', tagline: 'The edge is calling.', color: '#aad372' }
  return { label: 'Wandering Soul', tagline: 'Every blade was once unforged.', color: '#8a7a5a' }
}

// ── Main component ────────────────────────────────────────────────────────────

export function RecruitPage() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [qIdx, setQIdx] = useState(0)
  const [scores, setScores] = useState<number[]>([])

  // Background cycling
  const [bgStep, setBgStep] = useState(0)
  const [showPrev, setShowPrev] = useState(false)

  // Result match bar
  const [barPct, setBarPct] = useState(0)

  const embers = useMemo(() => makeEmbers(26), [])

  const currentQ = QUESTIONS[qIdx]
  const bgMode: BgMode = screen !== 'quiz' ? 'cycling' : (currentQ?.background ?? 'cycling')
  const isPinned = bgMode !== 'cycling'

  // Cycling timer — pauses when pinned
  useEffect(() => {
    if (isPinned) return
    const id = setInterval(() => setBgStep(s => s + 1), 9500)
    return () => clearInterval(id)
  }, [isPinned])

  // Show previous image briefly after step change (for crossfade)
  useEffect(() => {
    if (bgStep === 0) return
    setShowPrev(true)
    const id = setTimeout(() => setShowPrev(false), 1800)
    return () => clearTimeout(id)
  }, [bgStep])

  // Animate match bar after result screen mounts
  useEffect(() => {
    if (screen !== 'result') { setBarPct(0); return }
    const totalScore = scores.reduce((s, v) => s + v, 0)
    const pct = Math.round((totalScore / MAX_SCORE) * 100)
    const id = setTimeout(() => setBarPct(pct), 120)
    return () => clearTimeout(id)
  }, [screen, scores])

  function startQuiz() {
    setQIdx(0)
    setScores([])
    setScreen('quiz')
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
    setBarPct(0)
    setScreen('intro')
  }

  async function handleShare() {
    const totalScore = scores.reduce((s, v) => s + v, 0)
    const pct = Math.round((totalScore / MAX_SCORE) * 100)
    const tier = getTier(totalScore)
    const text = `I scored ${pct}% on the Blådes Edge Oath Quiz — ${tier.label}! ${tier.tagline}`
    const url = window.location.href
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Blådes Edge Oath Quiz', text, url })
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`)
      } catch {
        // Clipboard unavailable
      }
    }
  }

  // Derived background indices
  const curCycleIdx = bgStep % CYCLING_IMAGES.length
  const prevCycleIdx = (bgStep - 1 + CYCLING_IMAGES.length) % CYCLING_IMAGES.length

  // Result values
  const totalScore = scores.reduce((s, v) => s + v, 0)
  const tier = getTier(totalScore)

  return (
    <div className="rc-page">

      {/* ── Background layer ── */}
      <div className="rc-bg-layer">
        {bgMode === 'cycling' && (
          <>
            {showPrev && bgStep > 0 && (
              <div
                key={`prev-${bgStep}`}
                className="rc-bg-prev"
                style={{ backgroundImage: `url(${CYCLING_IMAGES[prevCycleIdx]})` }}
              />
            )}
            <div
              key={`cur-${bgStep}`}
              className="rc-bg-cur"
              style={{ backgroundImage: `url(${CYCLING_IMAGES[curCycleIdx]})` }}
            />
          </>
        )}
        {bgMode === 'summon' && (
          <div
            className="rc-bg-pinned"
            style={{ backgroundImage: `url(/images/Summon_toBlastedLands.jpg)` }}
          />
        )}
        {bgMode === 'perks' && (
          <div
            className="rc-bg-pinned"
            style={{ backgroundImage: `url(/images/guild-photo.jpg)` }}
          />
        )}
        {bgMode === 'shattrath' && (
          <div
            className="rc-bg-pinned"
            style={{ backgroundImage: `url(/images/GuildiesInShattrath.jpg)` }}
          />
        )}
      </div>

      {/* ── Overlay ── */}
      <div className="rc-overlay" />

      {/* ── Ember particles ── */}
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

      {/* ── Evidence images (Q3 — summon) ── */}
      {bgMode === 'summon' && (
        <div key="evidence-summon" className="rc-evidence-wrap">
          {Q3_EVIDENCE.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              className={`rc-evidence-img rc-ev-green rc-ev-pos-${i} rc-ev-in-${i}`}
            />
          ))}
        </div>
      )}

      {/* ── Evidence images (Q4 — perks) ── */}
      {bgMode === 'perks' && (
        <div key="evidence-perks" className="rc-evidence-wrap">
          {Q4_EVIDENCE.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              className={`rc-evidence-img rc-ev-gold rc-ev-pos-${i} rc-ev-in-${i}`}
            />
          ))}
        </div>
      )}

      {/* ── Content ── */}
      <div className="rc-content">

        {/* ═══ INTRO SCREEN ═══ */}
        {screen === 'intro' && (
          <div className="rc-card">
            <span className="rc-intro-eyebrow">Oath Quiz</span>
            <h1 className="rc-intro-title">Answer the Call</h1>
            <p className="rc-intro-desc">
              Blådes Edge is reforming on Dreamscythe. The veterans are returning.
              The call has gone out. Six questions stand between you and your place in the ranks.
              Are you Blådes Edge material? Let&apos;s find out.
            </p>
            <div className="rc-seal-wrap">
              <div className="rc-seal-ring-wrap">
                <div className="rc-seal-ring" />
                <div className="rc-seal-ring-2" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/guild-crest.png" alt="Blådes Edge crest" className="rc-seal-img" />
              </div>
              <button className="rc-begin-btn" onClick={startQuiz}>
                Begin the Oath
              </button>
            </div>
          </div>
        )}

        {/* ═══ QUIZ SCREEN ═══ */}
        {screen === 'quiz' && currentQ && (
          <div className="rc-card">
            {/* Progress bar */}
            <div className="rc-progress">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`rc-progress-seg${i < qIdx ? ' rc-progress-filled' : ''}`}
                />
              ))}
            </div>

            <span className="rc-eyebrow">{currentQ.eyebrow}</span>
            <h2 className="rc-question">{currentQ.text}</h2>

            <div className="rc-answers">
              {currentQ.answers.map((ans) => (
                <button
                  key={ans.letter}
                  className="rc-answer-btn"
                  onClick={() => selectAnswer(ans.score)}
                >
                  <span className="rc-letter-badge">{ans.letter}</span>
                  <span>{ans.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ RESULT SCREEN ═══ */}
        {screen === 'result' && (
          <div className="rc-card">
            {/* Wax seal stamp */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/guild-crest.png" alt="Blådes Edge crest" className="rc-seal-img-result" />

            {/* Tier + tagline */}
            <div className="rc-result-header">
              <div className="rc-result-tier" style={{ color: tier.color }}>{tier.label}</div>
              <div className="rc-result-tagline">{tier.tagline}</div>
            </div>

            {/* Match bar */}
            <div className="rc-match-wrap">
              <div className="rc-match-label-row">
                <span className="rc-match-label">Guild Match</span>
                <span className="rc-match-pct">{barPct}%</span>
              </div>
              <div className="rc-match-track">
                <div className="rc-match-fill" style={{ width: `${barPct}%` }} />
              </div>
            </div>

            {/* Perks */}
            <div className="rc-perks">
              {PERKS.map((p, i) => (
                <div key={i} className="rc-perk">
                  <span className="rc-perk-bullet">{p.icon}</span>
                  <span>
                    <strong style={{ color: '#c9961a' }}>{p.bold}</strong>
                    {p.desc}
                  </span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="rc-cta-row">
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

            <p className="rc-cta-note">
              A recruiter will invite you in-game — register now so your spot is ready.
            </p>

            <div className="rc-tools-row">
              <button className="rc-tool-btn" onClick={handleShare}>
                ⤳ Share my result
              </button>
              <button className="rc-tool-btn" onClick={retake}>
                ↺ Retake the oath
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
