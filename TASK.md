# TASK: /recruit — crest ring fix, withScroll images, Q3 position, result hover size

---

## Fix 1 — Pulse ring: hug the crest image tightly

The pulse ring is too large. It must wrap tightly around the guild
crest image itself, not a parent container.

Find the element creating the pulse ring animation on the intro screen.

### The fix
The ring must be a sibling or child of the img element, sized to match
the img dimensions exactly with only a small inset:

```tsx
<div style={{ position: 'relative', display: 'inline-block' }}>
  <img
    src="/images/guild-crest_Alpha.png"
    className="rc-intro-crest"
    style={{ width: 140, height: 140, display: 'block' }}
  />
  {/* Ring wraps the img — not a larger parent */}
  <div className="rc-seal-ring rc-seal-ring-1" />
  <div className="rc-seal-ring rc-seal-ring-2" />
</div>
```

```css
.rc-seal-ring {
  position: absolute;
  inset: -6px;           /* only 6px outside the image edge */
  border-radius: 50%;
  border: 1.5px solid rgba(201, 150, 26, 0.55);
  animation: rc-pulse 2.5s ease-out infinite;
  animation-fill-mode: both;
  pointer-events: none;
}

.rc-seal-ring-2 {
  animation-delay: 1.25s;
  border-color: rgba(201, 150, 26, 0.3);
}

@keyframes rc-pulse {
  0%   { transform: scale(1);    opacity: 0.7; }
  100% { transform: scale(1.3);  opacity: 0; }
}
```

Remove any existing ring or glow element that is sized independently
of the img element (e.g. a fixed 200px or 300px circle container).

Apply the same tight-ring fix to the results crest.

---

## Fix 2 — AvatarOdys: switch to withScroll PNG files

The new withScroll PNGs have proper backgrounds — no mix-blend-mode needed.

### Step A — Copy new files
```bash
cp /mnt/user-data/uploads/AvatarOdys_speaking*_withScroll.png public/images/
```

### Step B — Update image paths and remove blend mode

```ts
const AVATAR_PER_Q = [
  '/images/AvatarOdys_speaking1_withScroll.png',  // Q1
  '/images/AvatarOdys_speaking4_withScroll.png',  // Q2
  '/images/AvatarOdys_speaking2_withScroll.png',  // Q3
  '/images/AvatarOdys_speaking5_withScroll.png',  // Q4
  '/images/AvatarOdys_speaking3_withScroll.png',  // Q5
  '/images/AvatarOdys_speaking4_withScroll.png',  // Q6
];
```

```tsx
<img
  key={AVATAR_PER_Q[idx]}
  src={AVATAR_PER_Q[idx]}
  className="rc-gm-img"
  alt=""
/>
```

```css
.rc-gm-img {
  width: 100%;
  height: auto;
  object-fit: contain;
  /* NO mix-blend-mode — new PNGs have proper background */
  animation: rc-fade-in 0.6s ease both;
  animation-fill-mode: both;
}
```

### Step C — Size the GM corner for the scroll image
The withScroll PNG is square with a triangular scroll design.
Display it large enough to fill the bottom-right corner well:

```css
.rc-gm-images {
  width: clamp(220px, 22vw, 340px);
  height: auto;
  flex-shrink: 0;
}
```

---

## Fix 3 — Q3 Winterspring image: move to top center

In the Q3 evidence images array, find Summon_toWinterspring.jpg.
Change its position to top center:

```ts
{
  src: '/images/Summon_toWinterspring.jpg',
  caption: 'Get to the far north in Kalimdor quickly with summons to Winterspring.',
  pos: { top: '2%', left: '50%', transform: 'translateX(-50%)' },
  glow: 'summon',
}
```

---

## Fix 4 — Result hover images: triple size, fixed center screen

The perk card hover images are too small and follow the mouse.
Replace with large fixed-center images that appear in the same
spot regardless of mouse position.

Each card gets a predefined image that appears centered on screen,
covering most of the viewport, when hovered:

```tsx
const PERK_IMAGES: Record<string, string> = {
  bags:    '/images/Recruiting_TophBagsFullofBags.jpg',
  summons: '/images/Summon_toMaraudon2.jpg',
  fam:     '/images/GuildiesInShattrath.jpg',
  guild:   '/images/hero-portal.png',
};

const [hoveredPerk, setHoveredPerk] = useState<string | null>(null);
```

```tsx
{/* Full-screen overlay image — fixed center, not mouse-tracked */}
{hoveredPerk && (
  <div
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9999,
      pointerEvents: 'none',
      width: 'min(85vw, 85vh)',  /* large square-ish, most of viewport */
      maxWidth: 960,
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 24px 80px rgba(0,0,0,0.85)',
      border: '2px solid rgba(201,150,26,0.5)',
      animation: 'rc-fade-in 0.15s ease both',
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
```

Each perk card's mouse events:
```tsx
<div
  className="rc-perk-card"
  onMouseEnter={() => setHoveredPerk('bags')}
  onMouseLeave={() => setHoveredPerk(null)}
>
```

Map each card to its key:
- Free Bags card → key 'bags'
- Lock Summons card → key 'summons'
- GRATS Fam card → key 'fam'
- Active Guild card → key 'guild'

The image appears centered on the screen, always in the same position,
changes instantly when moving between cards, disappears on mouse leave.

---

## Verification

1. Intro crest pulse ring: hugs the crest image closely (≤6px gap)
2. Results crest ring: same tight fit
3. AvatarOdys shows withScroll PNG images — proper background, no black
4. AvatarOdys changes per question as specified
5. Q3: Winterspring image appears at top center of screen
6. Hovering "Free Bags": large image centered on screen, ~85vw wide
7. Hovering "Lock Summons": Maraudon2 image large and centered
8. Hovering "GRATS Fam": GuildiesInShattrath large and centered
9. Hovering "Active Guild": hero-portal large and centered
10. Hover image stays in same fixed spot regardless of mouse position
11. Hover image disappears cleanly on mouse leave

## Do not touch
- Questions, answers, scoring
- Background slideshow and Ken Burns
- Progress pips
- Discord/Auth URLs
- animation-fill-mode: both on ALL animations
