# TASK: GM corner text positioning + new noVertBar images

---

## Fix 1 — Switch to new noVertBar images

The AvatarOdys speaking images have been updated without the vertical
bar inside the graphic. Update all references to use the new filenames:

```ts
const AVATAR_IMAGES = [
  '/images/AvatarOdys_speaking1_withScroll_noVertBar.png',
  '/images/AvatarOdys_speaking2_withScroll_noVertBar.png',
  '/images/AvatarOdys_speaking3_withScroll_noVertBar.png',
  '/images/AvatarOdys_speaking4_withScroll_noVertBar.png',
  '/images/AvatarOdys_speaking5_withScroll_noVertBar.png',
];
```

Update this array everywhere it appears:
- Hall/dashboard page GM corner
- Landing page GM corner
- /recruit page (if it also uses withScroll images)

---

## Fix 2 — Byline: anchored 100px from bottom, three lines

The byline ("Åvatarødys / Blådes Edge / Guild Master") must sit
inside the scroll at the bottom, anchored 100px up from the
bottom edge of the image element.

```css
.rc-gm-byline-left {
  position: absolute;
  bottom: 100px;       /* 100px up from bottom of image */
  left: 6%;
  width: 32%;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
```

Three separate lines:
```tsx
<div className="rc-gm-byline-left">
  <span className="rc-gm-name">Åvatarødys</span>
  <span className="rc-gm-guild">Blådes Edge</span>
  <span className="rc-gm-title">Guild Master</span>
</div>
```

```css
.rc-gm-name {
  font-family: 'Cinzel', serif;
  font-size: clamp(0.75rem, 1.1vw, 1rem);
  color: var(--be-gold);
  letter-spacing: 0.08em;
  display: block;
}

.rc-gm-guild {
  font-family: 'Cinzel', serif;
  font-size: clamp(0.65rem, 0.9vw, 0.82rem);
  color: rgba(240, 220, 170, 0.85);
  letter-spacing: 0.06em;
  display: block;
}

.rc-gm-title {
  font-family: 'Cinzel', serif;
  font-size: clamp(0.6rem, 0.85vw, 0.78rem);
  color: rgba(201,150,26,0.65);
  letter-spacing: 0.06em;
  display: block;
}
```

---

## Fix 3 — Quote text: move left 25px and up 300px

The quote currently sits in the right column. Adjust its position
to shift left 25px and up 300px from its current location.

Find the `.rc-gm-quote-right` CSS (or inline style) and update:

```css
.rc-gm-quote-right {
  position: absolute;
  /* Shift: 25px more to the left, 300px higher than current */
  /* Current was approximately bottom: 14%, right: 5% */
  /* With the noVertBar image, more horizontal space is available */
  bottom: calc(14% + 300px);   /* 300px higher */
  right: calc(5% + 25px);      /* 25px more to the left */
  width: 32%;
  text-align: right;
}
```

If bottom is defined in px rather than %, add 300 to the current value.
If right is in px, add 25 to the current value.

---

## Verification

1. Images load from the new _noVertBar filenames
2. Byline shows three lines: Åvatarødys / Blådes Edge / Guild Master
3. Byline sits 100px from the bottom of the corner image
4. Quote text is visibly higher and further left than before
5. Neither text overlaps the AvatarOdys character in the image

## Do not touch
- Oath cinematic
- /recruit page quiz question images (separate images from GM corner)
- animation-fill-mode: both on all animations
