# TASK: /recruit — remove duplicate crest, fix corner graphic, fix hover image position

---

## Fix 1 — Intro page: one crest only, make button obvious

There are currently TWO guild crest images on the intro screen.
One at the top (decorative) and one as the "Begin the Oath" button.

### Remove the decorative top crest
Find and delete the img element rendering guild-crest_Alpha.png
that is NOT the button. The button crest is the one with the
onClick handler to start the quiz. The decorative one has no click
handler. Delete the decorative one.

### Make the button crest obviously clickable
The button crest needs a stronger glow and hover state:

```css
.rc-seal-btn {
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  transition: transform 200ms ease;
}

.rc-seal-btn:hover {
  transform: scale(1.08);
}

.rc-seal-btn:hover .rc-seal-crest {
  filter: drop-shadow(0 0 24px rgba(201,150,26,0.9))
          drop-shadow(0 0 48px rgba(201,150,26,0.5));
}

.rc-seal-crest {
  width: 160px;
  height: 160px;
  filter: drop-shadow(0 0 12px rgba(201,150,26,0.5))
          drop-shadow(0 0 24px rgba(201,150,26,0.25));
  transition: filter 200ms ease;
}
```

The pulse rings sit around the crest image itself (inset: -8px).

---

## Fix 2 — AvatarOdys corner: PNG fills entire bottom-right corner

The withScroll PNG is a right-triangle corner piece. It must be
anchored flush to the bottom-right corner of the viewport.
The quote text overlays the parchment area INSIDE the image.

```tsx
<div className="rc-gm-corner">
  {/* The PNG IS the corner — flush to bottom-right, no container */}
  <img
    src={AVATAR_PER_Q[idx]}
    className="rc-gm-corner-img"
    alt=""
  />

  {/* Quote text sits on top of the parchment area of the PNG */}
  {/* Parchment area is roughly the right 55% and bottom 60% of the image */}
  <div className="rc-gm-quote-overlay">
    <blockquote className="rc-gm-quote">
      "{GM_QUOTES[idx]}"
    </blockquote>
    <div className="rc-gm-byline">
      <span className="rc-gm-name">Åvatarødys</span>
      <span className="rc-gm-title">Blådes Edge Guild Master</span>
    </div>
  </div>
</div>
```

```css
.rc-gm-corner {
  position: fixed;
  bottom: 0;
  right: 0;
  width: clamp(320px, 30vw, 480px);  /* fills corner proportionally */
  pointer-events: none;
  z-index: 6;
}

.rc-gm-corner-img {
  width: 100%;
  height: auto;
  display: block;
  /* NO mix-blend-mode — proper background */
}

/* Quote overlay sits on the parchment area (lower-right triangle) */
.rc-gm-quote-overlay {
  position: absolute;
  /* Parchment occupies bottom-right triangle of the image.
     Position the text in the center of that parchment area. */
  bottom: 12%;
  right: 6%;
  width: 52%;
  text-align: right;
}

.rc-gm-quote {
  font-family: 'Spectral', serif;
  font-style: italic;
  font-size: clamp(0.7rem, 1.1vw, 0.9rem);
  color: rgba(240, 220, 170, 0.95);
  line-height: 1.55;
  margin: 0 0 0.4rem;
  quotes: none;
}

.rc-gm-name {
  display: block;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.65rem, 0.9vw, 0.8rem);
  color: #c9961a;
  letter-spacing: 0.08em;
}

.rc-gm-title {
  display: block;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.55rem, 0.75vw, 0.68rem);
  color: rgba(201,150,26,0.65);
  letter-spacing: 0.06em;
}

@media (max-width: 900px) {
  .rc-gm-corner { display: none; }
}
```

---

## Fix 3 — Result hover images: centered above the perk grid, large

The images must appear CENTERED above the four perk cards,
overlapping everything above them (header, body text, meter, crest).

The perk grid sits in the lower portion of the results page.
The hover image should appear centered horizontally and positioned
to cover the upper portion of the page — above the cards.

```tsx
{hoveredPerk && (
  <div
    style={{
      position: 'fixed',
      left: '50%',
      top: '8%',           /* near the top, above the cards */
      transform: 'translateX(-50%)',
      zIndex: 9999,
      pointerEvents: 'none',
      width: 'min(80vw, 700px)',
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

Fixed at `top: 8%`, centered horizontally. Does not follow the mouse.
Changes instantly when hovering different cards.
Disappears on mouse leave.

`min(80vw, 700px)` — 700px wide max, but shrinks on small screens.

---

## Verification

1. Intro screen has ONLY ONE guild crest — the button
2. Button crest glows gold on hover, scales up slightly
3. No decorative top crest visible anywhere on intro
4. AvatarOdys corner PNG fills bottom-right corner flush — no gap,
   no extra container, image touches viewport edges
5. Quote text appears on the parchment area inside the PNG
6. Åvatarødys name and title visible inside the parchment
7. Hover image on results: appears near top of screen, centered
8. Hover image is ~700px wide, covers header/title area
9. Same fixed position for all 4 cards (doesn't follow mouse)

## Do not touch
- Questions, answers, scoring
- Background slideshow
- Progress pips
- Ken Burns behavior
- Discord/Auth URLs
- animation-fill-mode: both on ALL animations
