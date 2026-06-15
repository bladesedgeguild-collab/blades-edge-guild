# TASK: /recruit page — landing, questions, evidence images, results overhaul

---

## Fix 1 — Landing page: remove container, restore Claude Design style

The intro screen must have NO card/container box around it.
Everything sits directly over the full-bleed background image.

```tsx
// Remove any wrapper div with background, border, borderRadius, padding
// The layout should be just: centered flex column over the bg image

<div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '2rem 1.5rem',
  textAlign: 'center',
  position: 'relative',
  zIndex: 1,
}}>
  {/* Guild crest top */}
  <img src="/images/guild-crest.png" style={{ width: 96, height: 96, marginBottom: 20 }} />

  {/* Eyebrow */}
  <span style={{
    fontFamily: 'Cinzel, serif',
    fontSize: '0.75rem',
    letterSpacing: '0.25em',
    color: 'var(--be-gold)',
    marginBottom: 16,
  }}>
    — BLÅDES EDGE · TBC CLASSIC —
  </span>

  {/* Big title */}
  <h1 style={{
    fontFamily: 'Cinzel Decorative, serif',
    fontSize: 'clamp(3.5rem, 10vw, 7rem)',
    lineHeight: 1.0,
    color: '#f0e6c8',
    marginBottom: 24,
  }}>
    Answer<br/>
    <span style={{ color: 'var(--be-gold)' }}>the</span><br/>
    Call
  </h1>

  {/* Sub */}
  <p style={{
    fontFamily: 'Spectral, serif',
    fontStyle: 'italic',
    fontSize: '1.1rem',
    color: 'rgba(240,230,200,0.85)',
    maxWidth: 360,
    lineHeight: 1.6,
    marginBottom: 40,
  }}>
    Take the Oath. Six questions, sixty seconds — and find out if your blade belongs with ours.
  </p>

  {/* Wax seal button */}
  <button onClick={onStart} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
    <div className="rc-seal-wrap">
      {/* guild crest in amber/red circle with pulse ring */}
      <div className="rc-seal-circle">
        <img src="/images/guild-crest.png" className="rc-seal-crest" />
        <div className="rc-seal-pulse" />
      </div>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.9rem', letterSpacing: '0.2em', color: 'var(--be-gold)', marginTop: 12 }}>
        BEGIN THE OATH
      </div>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(201,150,26,0.6)', marginTop: 4 }}>
        PRESS THE SEAL
      </div>
    </div>
  </button>

  {/* Meta chip */}
  <div className="rc-meta-chip" style={{ marginTop: 32 }}>
    <b>~60 SEC</b> · 6 QUESTIONS · NO SIGNUP TO START
  </div>
</div>
```

---

## Fix 2 — Restore exact questions and answers

Replace ALL questions with these exact values. Do not change wording.

```ts
const QUESTIONS = [
  {
    eyebrow: 'The Climb',
    q: 'What kind of leveling experience are you after in TBC?',
    a: [
      { t: 'Chill solo — with group help when I want it', s: 2 },
      { t: 'Social all the way — GRATS spam & guild chat', s: 2 },
      { t: 'Hardcore. Race to 70, no stops', s: 1 },
    ],
  },
  {
    eyebrow: 'The Hall',
    q: 'Guild chat should feel like…',
    a: [
      { t: 'Toxic tryhard energy', s: 0 },
      { t: 'Fam-friendly & always helpful', s: 2 },
      { t: 'Mostly quiet — leave me be', s: 1 },
    ],
  },
  {
    eyebrow: 'The Call',
    q: 'A guildmate needs a summon to a flight path. You…',
    a: [
      { t: '"Figure it out yourself, buddy."', s: 0 },
      { t: '"I got you — our locks are ready."', s: 2 },
    ],
  },
  {
    eyebrow: 'The Spoils',
    q: "What's the biggest perk of a guild?",
    a: [
      { t: 'Free bags + mats, day one', s: 2 },
      { t: 'Dungeon groups & real friends', s: 2 },
      { t: 'Big, organized raids', s: 2 },
    ],
  },
  {
    eyebrow: 'The Balance',
    q: 'Real life comes first?',
    a: [
      { t: 'Yes — casual is perfect. Real Life > WoW time.', s: 2 },
      { t: 'No — No life outside of WoW. "How do you kill, that which has no life?"', s: 1 },
    ],
  },
  {
    eyebrow: 'The Banner',
    q: 'Does the guild name tag matter to you?',
    a: [
      { t: 'Yes — I want to rep ⟨Blådes Edge⟩', s: 2 },
      { t: 'Not really, honestly (And no worries if you choose this!)', s: 1 },
    ],
  },
];
```

---

## Fix 3 — Question layout: eyebrow label + 1/6 counter

The question card shows:
- Top row: progress pips (left) + "1/6" counter (right)
- Below: eyebrow label ("THE CLIMB") in small gold Cinzel caps
- Below: question text in larger Cinzel
- Below: answer buttons

"THE CLIMB" eyebrow styling:
```css
.rc-q-eyebrow {
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  color: var(--be-gold);
  text-transform: uppercase;
  margin-bottom: 0.75rem;
  opacity: 0.8;
}
```

Counter shows "1/6" not "Question 1 of 6":
```tsx
<span className="rc-q-count"><b>{idx + 1}</b>/{QUESTIONS.length}</span>
```

---

## Fix 4 — Evidence images: much larger

On Q3 and Q4, the floating evidence images must be significantly larger.
They are currently too small to read.

```css
.rc-evi {
  position: absolute;
  width: clamp(280px, 28vw, 480px);   /* was too small — much bigger now */
  border-radius: 8px;
  overflow: hidden;
  opacity: 0;
  transition: opacity 1.2s ease;
  pointer-events: none;
}
.rc-evi.is-on { opacity: 1; }
.rc-evi img {
  width: 100%;
  height: auto;
  display: block;
}
.rc-evi-summon { box-shadow: 0 0 0 3px #1aff6e, 0 0 24px rgba(26,255,110,0.4); }
.rc-evi-recruit { box-shadow: 0 0 0 3px #c9961a, 0 0 24px rgba(201,150,26,0.4); }
```

On mobile (< 768px): hide evidence images entirely.
On tablet (768–1199px): clamp(160px, 20vw, 280px)
On desktop (1200px+): clamp(280px, 28vw, 480px)

---

## Fix 5 — Results: no container, cinematic reveal, text over bg

### Remove the result card container
Same approach as the intro — no box, no border, text directly over bg.

### Cinematic seal reveal
When the result phase starts:
1. Show only the wax seal (guild crest in amber circle) centered, large (140px)
2. Play the be-stamp animation (scale from 0 → 1 with rotation, same as oath cinematic)
3. After 1.2s, fade in the result text below the seal
4. The background for results uses the last question's background

```tsx
const [sealDone, setSealDone] = useState(false);
useEffect(() => {
  const t = setTimeout(() => setSealDone(true), 1400);
  return () => clearTimeout(t);
}, []);
```

### Result layout (no box)
```tsx
<div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: '100vh',
  padding: '4rem 1.5rem 3rem',
  textAlign: 'center',
  position: 'relative',
  zIndex: 1,
}}>
  {/* Seal — always visible, stamps in */}
  <div className="rc-result-seal" style={{ animation: 'be-stamp 0.6s cubic-bezier(.17,.67,.35,1.2) both' }}>
    <img src="/images/guild-crest.png" style={{ width: 120, height: 120 }} />
  </div>

  {/* Everything below fades in after seal */}
  <div style={{ opacity: sealDone ? 1 : 0, transition: 'opacity 0.8s ease', marginTop: 24 }}>
    <div style={{
      fontFamily: 'Cinzel, serif',
      fontSize: '0.75rem',
      letterSpacing: '0.25em',
      color: 'var(--be-gold)',
      marginBottom: 12,
    }}>
      — {res.tier} —
    </div>

    <h1 style={{
      fontFamily: 'Cinzel Decorative, serif',
      fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
      color: '#f0e6c8',
      marginBottom: 20,
      lineHeight: 1.1,
    }}>
      {res.name}
    </h1>

    <p style={{
      fontFamily: 'Spectral, serif',
      fontStyle: 'italic',
      fontSize: '1.1rem',
      color: 'rgba(240,230,200,0.85)',
      maxWidth: 480,
      lineHeight: 1.7,
      marginBottom: 24,
    }}>
      {res.body}
    </p>

    {/* Match bar */}
    <div className="rc-result-match">...</div>

    {/* Perks — 2x2 grid, semi-transparent cards, no heavy box */}
    <div className="rc-perks">...</div>

    {/* CTAs */}
    ...
  </div>
</div>
```

### Result text (use these exact strings)

True Blade (>= 78%):
- tier: "True Blade"
- name: "Welcome Home."
- body: "You're one of us. The oath knows it — fam-friendly, helpful, here for the long haul. Grab your free bags and let's ride to 70 together."

Promising Edge (>= 50%):
- tier: "Promising Edge"
- name: "The Edge Is Calling."
- body: "You've got the spark. Sharpen it with the fam — we'll cover the bags, the summons, and the groups. You bring the good vibes."

Wandering Soul (< 50%):
- tier: "Wandering Soul"
- name: "Every Blade Was Once Unforged."
- body: "Maybe you've wandered Azeroth solo long enough. The hall is warm, the chat is kind, and the door is open whenever you're ready to belong."

---

## Verification

1. Landing: no container box, title and seal over full bg image directly
2. "PRESS THE SEAL" text under Begin the Oath button
3. "~60 SEC · 6 QUESTIONS · NO SIGNUP TO START" chip visible
4. Q1 shows "THE CLIMB" eyebrow + correct question text + correct 3 answers
5. Q5 answer B includes the no-life quote
6. Q6 answer B includes "(And no worries if you choose this!)"
7. Counter shows "1/6" style not "Question 1 of 6"
8. Q3 evidence images are much larger (~28vw)
9. Q4 evidence images are much larger (~28vw)
10. Results: seal stamps in first, then text fades in below it
11. Results: no container box, text over bg image
12. "Welcome Home." result text matches exactly
13. animation-fill-mode: both on ALL animations — never 'forwards'

## Do not touch
- Background slideshow logic and Ken Burns effect
- Evidence image clock positions and fade-in order
- Discord URL and Register URL
- Ember particles
- animation-fill-mode: both on existing oath cinematic keyframes
