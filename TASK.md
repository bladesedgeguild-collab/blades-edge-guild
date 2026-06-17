# TASK: /recruit — Ken Burns fix, text wrapping, AvatarOdys, glow ring, perk hover images

---

## Fix 1 — Intro subtitle: 2 clean lines, narrower font on mobile

The subtitle wraps badly on narrow screens. Use span blocks AND
reduce font size to ensure 2 clean lines at any width:

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

```css
.rc-sub {
  font-size: clamp(0.85rem, 1.8vw, 1.2rem);  /* smaller so lines fit */
  max-width: 500px;
  text-align: center;
  line-height: 1.8;
}
```

---

## Fix 2 — Ken Burns snap-back: rewrite the slideshow animation

The current implementation snaps the image back to its original scale
just before transitioning. This happens because the Ken Burns animation
resets when the is-active class is removed.

### Root cause
When a slide loses `is-active`, its animation stops and transform
resets to scale(1) briefly before opacity reaches 0.

### Fix: keep Ken Burns running continuously using a different approach

Instead of restarting the animation per slide, pre-apply the zoom
to a continuous transform that never resets:

```css
/* Each slide image gets an infinite slow zoom — never stops or resets */
.rc-hero-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: rc-kenburns-inf 20s ease-in-out infinite alternate;
  animation-fill-mode: both;
  /* Offset each slide so they're at different points in zoom */
}

/* Stagger starting points per slide index via nth-child */
.rc-hero-slide:nth-child(1) img { animation-delay: 0s; }
.rc-hero-slide:nth-child(2) img { animation-delay: -5s; }
.rc-hero-slide:nth-child(3) img { animation-delay: -10s; }
.rc-hero-slide:nth-child(4) img { animation-delay: -3s; }
.rc-hero-slide:nth-child(5) img { animation-delay: -8s; }
.rc-hero-slide:nth-child(6) img { animation-delay: -13s; }
.rc-hero-slide:nth-child(7) img { animation-delay: -2s; }

@keyframes rc-kenburns-inf {
  0%   { transform: scale(1.0) translate(0%, 0%); }
  50%  { transform: scale(1.06) translate(-1%, 0.5%); }
  100% { transform: scale(1.1) translate(0.5%, -1%); }
}

/* Fade control is ONLY on opacity — never touches transform */
.rc-hero-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 3s ease-in-out;  /* slow crossfade only */
}

.rc-hero-slide.is-active {
  opacity: 1;
}
```

This separates the Ken Burns zoom (always running, never resets)
from the crossfade (opacity only). No snap-back possible.

---

## Fix 3 — AvatarOdys: one static image per question, fix black bg

### One image per question (no rotation)
```ts
const AVATAR_PER_Q = [
  '/images/AvatarOdys_speaking1.jpg',  // Q1
  '/images/AvatarOdys_speaking4.jpg',  // Q2
  '/images/AvatarOdys_speaking2.jpg',  // Q3
  '/images/AvatarOdys_speaking5.jpg',  // Q4
  '/images/AvatarOdys_speaking3.jpg',  // Q5
  '/images/AvatarOdys_speaking4.jpg',  // Q6
];
```

Remove ALL rotation logic (setInterval, avatarIdx state, multiple img elements).
Render a single img per question:

```tsx
<div className="rc-gm-images">
  <img
    key={idx}  // key change triggers React re-render/fade
    src={AVATAR_PER_Q[idx]}
    className="rc-gm-img"
    alt=""
  />
</div>
```

```css
.rc-gm-img {
  width: 100%;
  height: auto;
  object-fit: contain;
  mix-blend-mode: screen;
  filter: brightness(1.15) contrast(1.05);
  animation: rc-fade-in 0.8s ease both;
  animation-fill-mode: both;
}
```

The `mix-blend-mode: screen` removes the black background.
The `key={idx}` forces a fresh fade-in each question change.
No looping, no snap-back, no rotation.

---

## Fix 4 — Q1 question: force exactly 2 lines

```tsx
// When rendering idx === 0, use this instead of the normal q string:
{idx === 0 ? (
  <h2 className="rc-q-text">
    <span style={{ display: 'block' }}>What kind of leveling experience</span>
    <span style={{ display: 'block' }}>are you after in TBC?</span>
  </h2>
) : (
  <h2 className="rc-q-text">{QUESTIONS[idx].q}</h2>
)}
```

Also increase quiz card width:
```css
.rc-quiz-card {
  max-width: 680px;  /* wider to fit Q1 on 2 lines at desktop */
  width: min(680px, 92vw);
}

.rc-q-text {
  font-size: clamp(1.1rem, 2.2vw, 1.6rem);
}
```

---

## Fix 5 — Q4 image captions: updated text

Update the caption strings in the Q4 evidence images array:

```ts
// Q4 evidence images:
[
  {
    src: '/images/Recruiting_TophBagsFullofBags.jpg',
    caption: 'Recruiters Tøph, Ðjenna & Ðeerføx are equipped with bags & tabards.',
  },
  {
    src: '/images/Recruiting_TophInKharanos.jpg',
    caption: 'Recruiter Ðeerføx traveling starting zones like Kharanos, Elwynn Forest, Teldrassil & Azuremyst Isle.',
  },
  {
    src: '/images/Recruiting_TophinDarkshire.jpg',
    caption: 'Recruiter Ðjenna checking on advancing tier adventurers in Darkshire, Westfall, Redridge Mountains & Darkshore.',
  },
]
```

---

## Fix 6 — Q5 answer B text

In the QUESTIONS array, find Q5 (idx 4, "Real life comes first?").
Change answer B text to:
```
No. There is no life outside of WoW. "How do you kill, that which has no life?"
```

---

## Fix 7 — Glow ring: fit the alpha crest asset

The pulse ring is too large relative to the alpha crest image.
The ring should hug the crest artwork closely.

Find the rc-seal-pulse and related ring elements.
The crest image (guild-crest_Alpha.png) is roughly square.
Set the ring to match the image size exactly, not a larger container:

```css
/* Intro seal */
.rc-seal-pulse-ring {
  position: absolute;
  /* Size matches the crest image dimensions exactly */
  inset: -8px;  /* just 8px outside the image edge */
  border-radius: 50%;
  border: 1.5px solid rgba(201, 150, 26, 0.6);
  animation: rc-pulse 2.4s ease-out infinite;
  animation-fill-mode: both;
  pointer-events: none;
}

@keyframes rc-pulse {
  0%   { transform: scale(1);    opacity: 0.7; }
  100% { transform: scale(1.25); opacity: 0; }
}
```

Remove any fixed pixel size on the ring wrapper that was sized
for the old container. The ring must be sized relative to the
img element itself, not a parent container.

On the results screen, apply the same fix to the result crest ring.

---

## Fix 8 — Perk card hover: show large image above the card

On hover of each perk card, show a large preview image floating
above the card.

```tsx
const PERK_IMAGES = {
  bags:     '/images/Recruiting_TophBagsFullofBags.jpg',
  summons:  '/images/Summon_toMaraudon2.jpg',
  fam:      '/images/GuildiesInShattrath.jpg',
  guild:    '/images/hero-portal.png',
};

const [hoveredPerk, setHoveredPerk] = useState<string | null>(null);
const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

const handlePerkEnter = (e: React.MouseEvent, key: string) => {
  const rect = e.currentTarget.getBoundingClientRect();
  setHoverPos({ x: rect.left + rect.width / 2, y: rect.top });
  setHoveredPerk(key);
};
```

```tsx
{/* Perk hover image — rendered at root level */}
{hoveredPerk && (
  <div
    style={{
      position: 'fixed',
      left: hoverPos.x,
      top: hoverPos.y - 16,
      transform: 'translate(-50%, -100%)',
      zIndex: 9999,
      pointerEvents: 'none',
      width: 'clamp(320px, 42vw, 600px)',
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
      border: '1px solid rgba(201,150,26,0.4)',
      animation: 'rc-fade-in 0.2s ease both',
      animationFillMode: 'both',
    }}
  >
    <img
      src={PERK_IMAGES[hoveredPerk]}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      alt=""
    />
  </div>
)}

{/* Each perk card */}
<div
  className="rc-perk-card"
  onMouseEnter={(e) => handlePerkEnter(e, 'bags')}
  onMouseLeave={() => setHoveredPerk(null)}
>
  {/* Free Bags card content */}
</div>
{/* etc for summons (key='summons'), fam (key='fam'), guild (key='guild') */}
```

---

## Verification

1. Intro subtitle: 2 clean lines, no orphan words at any screen width
2. BG slides: smooth slow crossfade, NO snap-back to original zoom
3. AvatarOdys: one specific image per question, black bg gone via mix-blend-mode
4. Q1: exactly 2 lines
5. Q4 captions updated with new text for all 3 images
6. Q5 answer B updated with new text
7. Glow pulse ring hugs crest asset closely — not floating wide of it
8. Same ring fix on results crest
9. Hovering "Free Bags" shows Toph bags image large above the card
10. Hovering "Lock Summons" shows Maraudon2 image
11. Hovering "GRATS Fam" shows GuildiesInShattrath image
12. Hovering "Active Guild" shows hero-portal image

## Do not touch
- Scoring logic
- Background slide order
- Discord/Auth URLs
- Progress pip behavior
- animation-fill-mode: both on ALL animations — never 'forwards'
