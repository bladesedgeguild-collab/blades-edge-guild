# TASK: Build /recruit page — Answer the Call Oath Quiz

## Overview
Port the Claude Design "Answer the Call" quiz into the Next.js site as a
proper page at /recruit. All logic, questions, scoring, and component
structure is provided below — adapt from the handoff JSX.

The handoff code lives at:
- /tmp/recruiting_handoff/blades-edge-recruiting-hype-quiz/project/recruit-app.jsx
- /tmp/recruiting_handoff/blades-edge-recruiting-hype-quiz/project/recruit-quiz.jsx

Read both files fully before building. They contain the complete component
tree, quiz data, scoring logic, and background behavior. Port them to TSX.

---

## File structure to create

```
app/(public)/recruit/
  page.tsx          ← server component, metadata, imports RecruitPage
  RecruitPage.tsx   ← 'use client' — full quiz app
  recruit.css       ← all quiz-specific styles (import in RecruitPage.tsx)
```

---

## Image paths

All images are in /public/images/. Update every asset path from
`assets/filename.png` to `/images/filename.jpg` or `.png` as appropriate.

Image filename mapping (handoff name → actual file in /public/images/):
```
art-summon-blastedlands  → Summon_toBlastedLands.jpg
art-summon-maraudon      → Summon_toMaraudon.jpg
art-summon-maraudon2     → Summon_toMaraudon2.jpg
art-summon-stormwind     → Summon_toStormwind.jpg
art-summon-winterspring  → Summon_toWinterspring.jpg
art-shattrath            → GuildiesInShattrath.jpg
art-bags                 → Recruiting_TophBagsFullofBags.jpg
art-toph-darkshire       → Recruiting_TophinDarkshire.jpg
art-toph-kharanos        → Recruiting_TophInKharanos.jpg
art-guildies             → guild-photo.jpg
guild-crest              → guild-crest.png
hero-portal              → hero-portal.png
```

---

## Background slideshow behavior (IMPORTANT — differs from handoff)

### Default cycling (Intro, Q1, Q2, Q5)
Cycle through these images in order, starting with Blasted Lands:
1. /images/Summon_toBlastedLands.jpg
2. /images/Summon_toMaraudon.jpg
3. /images/Summon_toMaraudon2.jpg
4. /images/Summon_toStormwind.jpg
5. /images/Summon_toWinterspring.jpg
6. /images/Recruiting_TophinDarkshire.jpg
7. /images/Recruiting_TophInKharanos.jpg

Each image uses Ken Burns effect: slow zoom from 100% → 108% scale
over the display duration (8s), with a fade transition between images.
Duration per image: 8s visible + 1.5s crossfade.

### Q3 — Summon question
Pin /images/Summon_toBlastedLands.jpg as full background.
Floating evidence images fade in one by one at clock positions:
Order: Summon_toMaraudon2.jpg, Summon_toStormwind.jpg,
       Summon_toBlastedLands.jpg, Summon_toWinterspring.jpg,
       Summon_toMaraudon.jpg
Border glow color: #1aff6e (portal green)
Images stay on screen until user answers (do not cycle out).

### Q4 — Guild perks question
Pin /images/guild-photo.jpg as full background.
Floating evidence images fade in one by one at clock positions:
Order (start with bags first):
  Recruiting_TophBagsFullofBags.jpg, Recruiting_TophinDarkshire.jpg,
  Recruiting_TophInKharanos.jpg, GuildiesInShattrath.jpg
Border glow color: #c9961a (gold)
Images stay on screen until user answers.

### Q6 — Guild name tag question
Pin /images/GuildiesInShattrath.jpg as full background only.
No floating evidence images.

### Background overlay
Use a warm dark overlay: rgba(10, 6, 2, 0.52) — dark enough to read
text but light enough to enjoy the images underneath.

### Ember particles
Always present over the background, same as oath cinematic.
Use the EmberField component from the handoff (26 embers).
Embers appear on top of background images but behind the quiz card.

---

## Real URLs (replace handoff placeholders)

```ts
const DISCORD_URL = 'https://discord.gg/B9fEz7AC6T'; // use real invite link if known, 
const AUTH_URL = '/login';  // links to the site login/onboarding
```

---

## Quiz card styling

The quiz card (question box) sits centered on screen.
Background: rgba(10, 6, 2, 0.88) — nearly opaque dark
Border: 1px solid rgba(201, 150, 26, 0.35) — gold tint
Border radius: 12px
Max width: 560px
Padding: 2rem 2.5rem

Progress bar at top: gold filled segments, one per question.
Question eyebrow: Cinzel, small caps, --be-muted color
Question text: Cinzel Decorative or Cinzel, 1.4rem, --be-ink
Answer buttons: full width, dark bg, gold border on hover,
  letter badge (A/B/C) in gold circle on left.

---

## Wax seal component

Use the guild-crest.png in a styled circular container with:
- Pulsing ring animation on the start button
- Stamp-in animation on the result screen (same be-stamp style as oath cinematic)
- animation-fill-mode: both on all keyframe animations (NEVER 'forwards')

---

## Scoring and results (from handoff — use exactly)

MAX_SCORE = sum of max answer score per question = 12

True Blade:    score/MAX >= 0.78  → "Welcome home."
Promising Edge: score/MAX >= 0.50 → "The edge is calling."
Wandering Soul: score/MAX < 0.50  → "Every blade was once unforged."

Match % shown as animated fill bar on result screen.

Perks shown on ALL results:
1. Free welcome bags — Four 10-slot bags, on the house, the moment you join.
2. Lock summons anywhere — Never run to a flight path again. Our locks have you.
3. GRATS-friendly fam — Helpful chat, real friends, zero toxicity.
4. Big, active guild — Someone's always online for dungeons & groups.

---

## Result screen CTAs

Primary button (Discord blue #5865F2): "Join on Discord" → DISCORD_URL
Secondary button (gold border): "Register & Claim Character" → AUTH_URL
Note below: "A recruiter will invite you in-game — register now so your spot is ready."
Tools row: "⤳ Share my result" (web share API or clipboard) | "↺ Retake the oath"

---

## Also: replace guild-photo.png with guild-photo.jpg on landing page

The handoff includes guild-photo.jpg (1.1MB vs 3.37MB PNG).
Copy /public/images/guild-photo.jpg to replace guild-photo.png
and update the landing page image src from guild-photo.png to guild-photo.jpg.

---

## Navbar / accessibility

Add a "Join" or "Recruit" link to the public navbar (landing page nav)
pointing to /recruit. This page is public — no auth required.

---

## Mobile

Quiz card: full width with 1rem padding on mobile
Answer buttons: minimum 48px height, large touch targets
Floating evidence images: hide on mobile (< 768px) — too crowded
Background images: still visible, Ken Burns still active

---

## CSS notes

Port all .rc-* and .be-* classes from the handoff into recruit.css.
The .be-ember class already exists in globals.css — reuse it.
The be-stamp keyframe already exists — reuse it for result seal animation.
DO NOT duplicate existing global CSS. Import recruit.css locally.

---

## Verification

1. /recruit loads — shows "ANSWER THE CALL" hero with wax seal button
2. Clicking the seal starts quiz at Q1
3. Background cycles through summon + toph images with Ken Burns
4. Q3 shows pinned Blasted Lands BG + summon images fading in around card
5. Q4 shows guild-photo.jpg BG + recruiting images fading in, bags FIRST
6. Q6 shows only GuildiesInShattrath.jpg
7. Completing quiz shows result with wax seal stamp animation
8. Match % bar animates in
9. Discord and Register buttons work
10. Share button uses web share or copies to clipboard
11. Retake works
12. Ember particles visible on background at all times
13. Mobile: quiz playable, evidence images hidden
14. Landing page guild-photo.png → .jpg (smaller file, same look)

## Do not touch
- Oath cinematic (be-stamp keyframe — reuse but never modify)
- animation-fill-mode: both on ALL animations — never 'forwards'
- Existing global CSS beyond the guild-photo filename change
- Any other existing pages
