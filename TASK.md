# TASK: /recruit — 9 final polish fixes

---

## Fix 1 — Intro subtitle: forced 2-line break

Find the subtitle text on the intro/landing screen.
Replace with two explicit line blocks:

```tsx
<p className="rc-sub">
  <span style={{ display: 'block' }}>
    Take the Oath. Six questions, sixty seconds.
  </span>
  <span style={{ display: 'block' }}>
    Find out if your blade belongs with ours.
  </span>
</p>
```

---

## Fix 2 — Q1 question: wider card + forced 2-line break

Increase the quiz card max-width from current value to 640px:
```css
.rc-quiz-card {
  max-width: 640px;
}
```

Also wrap Q1 question text in explicit line blocks:
```tsx
// In QUESTIONS array for Q1, change q to a JSX element or use a separate render:
// When rendering the question text for Q1 (idx === 0):
<h2 className="rc-q-text">
  <span style={{ display: 'block' }}>What kind of leveling experience</span>
  <span style={{ display: 'block' }}>are you after in TBC?</span>
</h2>

// For all other questions, render normally (no forced breaks needed)
```

---

## Fix 3 — AvatarOdys speaking images: fix path + double font size

### Step A — Ensure images are in place
```bash
ls public/images/AvatarOdys_speaking*.jpg
```
If any are missing, copy from /mnt/user-data/uploads/:
```bash
cp /mnt/user-data/uploads/AvatarOdys_speaking*.jpg public/images/
```

### Step B — Fix image path and ensure component renders
In the GM corner component, verify the img src uses the correct path:
```tsx
src={`/images/AvatarOdys_speaking${(avatarIdx % 5) + 1}.jpg`}
```

The image must be rendered. Add a console.log to confirm avatarIdx
is cycling. If the component is returning null or display:none,
fix the condition that hides it.

### Step C — Double all font sizes in the GM corner

```css
.rc-gm-quote {
  font-size: clamp(0.9rem, 1.5vw, 1.15rem);   /* doubled from 0.75/0.9 */
  line-height: 1.6;
  padding-left: 1rem;
}

.rc-gm-name {
  font-size: 1rem;          /* doubled from 0.75rem */
  letter-spacing: 0.1em;
}

.rc-gm-title {
  font-size: 0.82rem;       /* doubled from 0.62rem */
}

/* Also increase character image size */
.rc-gm-images {
  width: 280px;
  height: 400px;
}
```

---

## Fix 4 — Image caption tags for Q3 summon images

Under each floating evidence image on Q3, add italic gold caption text.

In the evidence image component, add a caption below the img:

```tsx
<div className="rc-evi">
  <img src={img.src} alt="" />
  {img.caption && (
    <p className="rc-evi-caption">{img.caption}</p>
  )}
</div>
```

```css
.rc-evi-caption {
  font-family: 'Spectral', serif;
  font-style: italic;
  font-size: 0.78rem;
  color: rgba(201, 150, 26, 0.9);
  text-align: center;
  padding: 0.4rem 0.6rem;
  background: rgba(10, 6, 2, 0.75);
  margin: 0;
  line-height: 1.4;
}
```

Q3 summon image captions (add `caption` field to each):
```ts
// Q3 evidence images with captions:
[
  {
    src: '/images/Summon_toMaraudon2.jpg',
    caption: 'Summons to Maraudon at the portal purple side.',
    pos: { /* clock position */ },
    glow: 'summon',
  },
  {
    src: '/images/Summon_toStormwind.jpg',
    caption: 'Summons to Stormwind when your hearthstone is set for questing but you need quick access to the Auction House or Bank.',
    pos: { /* clock position */ },
    glow: 'summon',
  },
  {
    src: '/images/Summon_toWinterspring.jpg',
    caption: 'Get to the far north in Kalimdor quickly with summons to Winterspring.',
    pos: { /* clock position */ },
    glow: 'summon',
  },
  {
    src: '/images/Summon_toBlastedLands.jpg',
    caption: 'Summons to the Dark Portal among 16 different locations our Warlock Summoning Army are standing by.',
    pos: { /* clock position */ },
    glow: 'summon',
  },
]
```

---

## Fix 5 — Image caption tags for Q4 recruiting images

Q4 recruiting image captions:
```ts
[
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
```

---

## Fix 6 — Result body text: hard 3-line break with span blocks

The body text MUST use three explicit span blocks.
No text-wrap:balance, no max-width tricks — only span blocks work reliably.

```tsx
// True Blade body:
<p className="rc-result-body">
  <span style={{ display: 'block' }}>
    You're one of us. The oath knows it — fam-
  </span>
  <span style={{ display: 'block' }}>
    friendly, helpful, here for the long haul. Grab
  </span>
  <span style={{ display: 'block' }}>
    your free bags and let's ride to 70 together.
  </span>
</p>

// Promising Edge body:
<p className="rc-result-body">
  <span style={{ display: 'block' }}>
    You've got the spark. Sharpen it with the fam —
  </span>
  <span style={{ display: 'block' }}>
    we'll cover the bags, the summons, and the groups.
  </span>
  <span style={{ display: 'block' }}>
    You bring the good vibes.
  </span>
</p>

// Wandering Soul body:
<p className="rc-result-body">
  <span style={{ display: 'block' }}>
    Maybe you've wandered Azeroth solo long enough.
  </span>
  <span style={{ display: 'block' }}>
    The hall is warm, the chat is kind, and the door
  </span>
  <span style={{ display: 'block' }}>
    is open whenever you're ready to belong.
  </span>
</p>
```

```css
.rc-result-body {
  text-align: center;
  font-family: 'Spectral', serif;
  font-style: italic;
  font-size: clamp(0.95rem, 1.6vw, 1.2rem);
  color: rgba(240, 230, 200, 0.92);
  line-height: 1.8;
  margin: 0 auto 1.5rem;
}
```

---

## Fix 7 — Perk cards: pop-out on hover

```css
.rc-perk-card {
  transition: transform 200ms ease, box-shadow 200ms ease,
              background 200ms ease;
  cursor: default;
}

.rc-perk-card:hover {
  transform: scale(1.08);
  background: rgba(28, 16, 4, 0.95);
  box-shadow: 0 8px 32px rgba(0,0,0,0.5),
              0 0 20px rgba(201,150,26,0.15);
  z-index: 2;
  position: relative;
}

.rc-perk-card:hover .rc-perk-title {
  color: var(--be-gold);
  font-size: 0.88rem;
}

.rc-perk-card:hover .rc-perk-body {
  color: rgba(240, 230, 200, 0.95);
  font-size: 0.98rem;
}
```

---

## Fix 8 — Bottom recruiter text: new wording + bold gold phrase

Find the text:
"A recruiter will invite you in-game — register now so your spot is ready."

Replace with:
```tsx
<p className="rc-recruiter-note">
  A recruiter will{' '}
  <strong style={{ color: 'var(--be-gold)', fontWeight: 700 }}>
    invite you in-game
  </strong>
  . But feel free to register now so your spot is ready.
</p>
```

---

## Fix 9 — Use guild-crest_Alpha.png, remove red circle, extend sealing

### A — Switch to alpha PNG everywhere on /recruit
Find every reference to guild-crest.png in the recruit page/component.
Replace ALL of them with guild-crest_Alpha.png:
```
/images/guild-crest.png → /images/guild-crest_Alpha.png
```

### B — Remove the red/amber circular container
The circular amber/red container (background: radial-gradient with
#7a2a0a / #3d1205 colors) was added as a workaround for the black
square. Now that we have a proper alpha PNG, remove this container.

The crest should render directly on the page background with no
circular colored container behind it.

Find and remove any element with:
- background containing #7a2a0a, #3d1205, or similar amber/red radial gradient
- border-radius: 50% that serves as a crest background container
- The "rc-seal-circle" or similar class if it has a background applied

### C — Extend "Sealing your oath..." duration
The sealing phase currently transitions too quickly to results.
Increase the delay before results reveal from current value to 2800ms:

```ts
// In the sealing phase timeout:
const t = setTimeout(() => setPhase('reveal'), 2800);  // was shorter
```

### D — Remove mix-blend-mode: screen from crest images
Since the alpha PNG has proper transparency, remove any
`mixBlendMode: 'screen'` or `mix-blend-mode: screen` from
the guild crest img elements. It is no longer needed.

---

## Verification

1. Intro subtitle: exactly 2 clean lines, no orphan words
2. Q1 question: exactly 2 lines as specified
3. AvatarOdys speaking images visible bottom-right, rotating every 4s
4. GM quote text is 2x larger and easily readable
5. Q3 images each have italic gold caption beneath them
6. Q4 images each have italic gold caption beneath them
7. True Blade result body: exactly 3 lines with "fam-" at end of line 1
8. Perk cards pop out 8% larger on hover with brighter text
9. "invite you in-game" appears in bold gold
10. Recruiter note text matches new wording exactly
11. Guild crest shows with clean alpha — no red circle, no square
12. Sealing screen stays visible for ~2.8 seconds before results appear
13. guild-crest_Alpha.png is used everywhere, no mix-blend-mode needed

## Do not touch
- Scoring logic
- Background slides and Ken Burns
- Progress pips
- Discord/Auth URLs
- animation-fill-mode: both on ALL animations — never 'forwards'
