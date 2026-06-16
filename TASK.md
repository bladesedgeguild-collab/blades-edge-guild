# TASK: /recruit — 12 visual tweaks

---

## Fix 1 — Use alpha guild crest (no square background)

The guild-crest.png already has a transparent background.
Ensure no parent element has a square background color/image behind it.
On the intro seal button, the crest sits inside the amber circle —
the circle itself provides the bg, not the image.
On the result screen and eyebrow, render the crest directly on
transparent/semi-transparent backgrounds.

If a different file is being used, switch to /images/guild-crest.png
which is the same file used in the oath cinematic.

---

## Fix 2 — Slower BG crossfade transitions

Find the CSS transition on background slide elements.
Change crossfade from current value to 3 seconds:

```css
.rc-hero-slide {
  transition: opacity 3s ease-in-out;  /* was 1.5s — much slower */
}
```

Also increase Ken Burns duration:
```css
@keyframes rc-kenburns {
  from { transform: scale(1.0); }
  to   { transform: scale(1.1); }  /* slightly more zoom */
}
.rc-hero-slide.is-active {
  animation: rc-kenburns 14s ease-in-out forwards;  /* was 9.5s */
}
```

---

## Fix 3 — Subtitle: remove em dash, larger font

Find the subtitle text on the intro screen:
"Take the Oath. Six questions, sixty seconds — and find out if your blade belongs with ours."

Change to:
"Take the Oath. Six questions, sixty seconds. Find out if your blade belongs with ours."

Increase font size:
```css
.rc-sub {
  font-size: clamp(1.1rem, 2.2vw, 1.4rem);  /* was smaller */
  line-height: 1.7;
}
```

---

## Fix 4 — BEGIN THE OATH + PRESS THE SEAL text: white, bolder, larger

```css
.rc-seal-label {
  color: #ffffff;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;        /* larger */
  font-weight: 700;          /* bold */
  letter-spacing: 0.2em;
  margin-top: 14px;
}

.rc-seal-sublabel {
  color: rgba(255, 255, 255, 0.75);
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;         /* larger than before */
  letter-spacing: 0.18em;
  margin-top: 4px;
}
```

Meta chip (~60 SEC etc):
```css
.rc-meta-chip {
  font-size: 0.85rem;        /* larger */
  color: rgba(255, 255, 255, 0.8);  /* white-ish */
  border-color: rgba(255, 255, 255, 0.25);
  letter-spacing: 0.12em;
  padding: 0.45rem 1.1rem;
}
```

---

## Fix 5 — Center question/label text, larger fonts

```css
.rc-quiz {
  text-align: center;
}

.rc-q-eyebrow {
  text-align: center;
  font-size: 0.8rem;         /* keep */
  letter-spacing: 0.22em;
}

.rc-q-text {
  text-align: center;
  font-size: clamp(1.3rem, 2.8vw, 1.8rem);  /* larger */
  line-height: 1.35;
  margin-bottom: 1.5rem;
}

.rc-answer-text {
  font-size: 1rem;           /* larger than before */
  line-height: 1.4;
}

.rc-q-count {
  font-size: 1rem;           /* larger */
  font-family: 'Cinzel', serif;
}

.rc-q-count b {
  font-size: 1.3rem;
  color: var(--be-gold);
}
```

---

## Fix 6 — Answer buttons: gradient background

```css
.rc-answer {
  background: linear-gradient(
    135deg,
    rgba(42, 28, 10, 0.92) 0%,
    rgba(26, 18, 8, 0.88) 100%
  );
  border: 1px solid rgba(201, 150, 26, 0.3);
  border-radius: 8px;
  padding: 0.9rem 1.25rem;
  transition: all 160ms ease;
  cursor: pointer;
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.6rem;
}

.rc-answer:hover {
  background: linear-gradient(
    135deg,
    rgba(60, 40, 10, 0.95) 0%,
    rgba(42, 28, 8, 0.92) 100%
  );
  border-color: rgba(201, 150, 26, 0.7);
  box-shadow: 0 0 12px rgba(201, 150, 26, 0.15);
  transform: translateX(3px);
}

.rc-answer.is-picked {
  background: linear-gradient(
    135deg,
    rgba(201, 150, 26, 0.25) 0%,
    rgba(201, 150, 26, 0.12) 100%
  );
  border-color: var(--be-gold);
}
```

---

## Fix 7 — Progress bar: gold glow shows CURRENT question (1 pip for Q1)

The progress pips show how many questions you ARE ON, not completed.
On Q1: 1 gold pip. On Q4: 4 gold pips. On Q6: 6 gold pips (all lit).

```tsx
{QUESTIONS.map((_, i) => (
  <span
    key={i}
    className={`rc-progress-pip ${i <= idx ? 'is-active' : ''}`}
  />
))}
```

```css
.rc-progress-pip {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: rgba(201, 150, 26, 0.2);
  transition: all 400ms ease;
}

.rc-progress-pip.is-active {
  background: var(--be-gold);
  box-shadow: 0 0 8px rgba(201, 150, 26, 0.8), 0 0 16px rgba(201, 150, 26, 0.4);
}
```

---

## Fix 8 — Back button (already exists but confirm it works)

The back button must be visible on all questions (disabled but visible on Q1).

```tsx
<button
  type="button"
  className="rc-quiz-back"
  onClick={back}
  disabled={idx === 0}
>
  ‹ Back
</button>
```

```css
.rc-quiz-back {
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  color: rgba(201, 150, 26, 0.6);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem 1rem;
  margin-top: 1rem;
  transition: color 150ms ease;
}
.rc-quiz-back:hover:not(:disabled) { color: var(--be-gold); }
.rc-quiz-back:disabled { opacity: 0.25; cursor: default; }
```

---

## Fix 9 — Q3/Q4 evidence images: double size, can overlap

```css
.rc-evi {
  position: fixed;  /* fixed so it overlaps everything including quiz card */
  width: clamp(320px, 38vw, 580px);  /* doubled from previous */
  border-radius: 10px;
  overflow: hidden;
  opacity: 0;
  transition: opacity 1.4s ease;
  pointer-events: none;
  z-index: 5;  /* above bg, below quiz card (quiz card should be z-index: 10) */
}
.rc-evi.is-on { opacity: 1; }

/* Quiz card must be above evidence images */
.rc-quiz {
  position: relative;
  z-index: 10;
}

@media (max-width: 768px) {
  .rc-evi { display: none; }
}
```

---

## Fix 10 — Result: seal stamps center screen, then slides up

Two-phase animation:
Phase 1: Seal appears centered on screen, stamps in (scale 0 → 1)
Phase 2: After 1.4s, seal slides up toward top, result text fades in below

```tsx
const [phase, setPhase] = useState<'seal' | 'reveal'>('seal');
useEffect(() => {
  const t = setTimeout(() => setPhase('reveal'), 1500);
  return () => clearTimeout(t);
}, []);
```

```tsx
<div className={`rc-result-seal-wrap ${phase}`}>
  <div className="rc-result-seal-circle">
    <img src="/images/guild-crest.png" />
  </div>
</div>

{phase === 'reveal' && (
  <div className="rc-result-content" style={{ animation: 'rc-fade-up 0.7s ease both' }}>
    {/* tier, name, body, match bar, perks, CTAs */}
  </div>
)}
```

```css
@keyframes rc-seal-stamp {
  0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
  60%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
  80%  { transform: scale(0.95) rotate(-1deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes rc-seal-slide-up {
  from { transform: translateY(0) scale(1.2); }
  to   { transform: translateY(-30vh) scale(0.85); }
}

@keyframes rc-fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.rc-result-seal-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  transition: all 0.8s ease;
}

.rc-result-seal-wrap.seal {
  animation: rc-seal-stamp 0.7s cubic-bezier(.17,.67,.35,1.3) both;
}

.rc-result-seal-wrap.reveal {
  animation: rc-seal-slide-up 0.8s ease forwards;
  animation-fill-mode: both;
}

.rc-result-seal-circle img {
  width: 180px;
  height: 180px;
}
```

---

## Fix 11 — Larger fonts throughout

```css
/* Result page */
.rc-result-tier {
  font-size: 0.9rem;
  letter-spacing: 0.25em;
}
.rc-result-name {
  font-size: clamp(3rem, 7vw, 5.5rem);
}
.rc-result-body {
  font-size: clamp(1.1rem, 2vw, 1.35rem);
}

/* General */
.rc-eyebrow {
  font-size: 0.85rem;
  letter-spacing: 0.22em;
}
```

---

## Fix 12 — Intro seal: bigger, stronger glow, obvious hover

```css
.rc-seal-circle {
  width: 200px;          /* was ~168px */
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, #7a2a0a 0%, #3d1205 60%, #1a0800 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 200ms ease, box-shadow 200ms ease;
  box-shadow:
    0 0 30px rgba(201, 150, 26, 0.4),
    0 0 60px rgba(201, 150, 26, 0.2),
    0 0 100px rgba(201, 150, 26, 0.1);
}

.rc-seal-circle:hover {
  transform: scale(1.06);
  box-shadow:
    0 0 40px rgba(201, 150, 26, 0.7),
    0 0 80px rgba(201, 150, 26, 0.4),
    0 0 120px rgba(201, 150, 26, 0.2);
  cursor: pointer;
}

.rc-seal-circle img {
  width: 130px;   /* larger crest inside */
  height: 130px;
}

/* Pulse ring: bigger, slower */
.rc-seal-pulse {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px solid rgba(201, 150, 26, 0.5);
  animation: rc-pulse 2.2s ease-out infinite;
  animation-fill-mode: both;
}

@keyframes rc-pulse {
  0%   { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.35); opacity: 0; }
}

/* Second pulse ring offset */
.rc-seal-pulse-2 {
  animation-delay: 1.1s;
}
```

Add a second pulse ring element next to the first for a layered pulse effect.

---

## Verification

1. Guild crest has no square bg anywhere on the page
2. BG transitions take 3s to crossfade, Ken Burns runs 14s
3. Subtitle has no em dash, larger font
4. BEGIN THE OATH is white bold, PRESS THE SEAL is white smaller, chip is legible
5. Question text is centered, larger (~1.8rem at desktop)
6. Answer buttons have warm dark gradient bg, gold glow on hover
7. Q1 shows 1 gold pip, Q4 shows 4 gold pips (not completed — current)
8. Back button visible on all questions, disabled on Q1
9. Evidence images on Q3/Q4 are ~38vw, float over quiz card
10. Result: seal stamps in center screen, slides up, text fades in below
11. All fonts notably larger across the page
12. Seal button is 200px, double pulse ring, glows on hover

## Do not touch
- Question text and answers (just fixed)
- Background slide order and logic
- Discord URL and AUTH URL
- animation-fill-mode: both everywhere
