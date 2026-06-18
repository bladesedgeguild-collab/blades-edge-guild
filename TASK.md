# TASK: GM corner larger + byline repositioned + calendar badge hover size

---

## Fix 1 — GM corner: larger overall, byline moves to left triangle

### Make the entire corner bigger
```css
.rc-gm-corner {
  position: fixed;
  bottom: 0;
  right: 0;
  width: clamp(400px, 38vw, 580px);  /* was ~320px — larger */
  pointer-events: none;
  z-index: 6;
}

.rc-gm-corner-img {
  width: 100%;
  height: auto;
  display: block;
}
```

### Reposition byline and quote

The withScroll PNG has two visible regions:
- LEFT dark triangle (black area, lower-left): space for the name/title
- RIGHT narrow parchment column: space for the quote text

Move the byline (name + title) into the LEFT dark triangle area,
and keep the quote in the RIGHT parchment column.

The overlay container covers the whole image with absolute positioning.
Split into two named zones:

```tsx
<div className="rc-gm-corner" style={{ position: 'fixed', bottom: 0, right: 0 }}>
  <img src={avatarImg} className="rc-gm-corner-img" alt="Åvatarødys" />

  {/* Byline in the LEFT dark triangle area */}
  <div className="rc-gm-byline-left">
    <span className="rc-gm-name">Åvatarødys</span>
    <span className="rc-gm-title">Blådes Edge Guild Master</span>
  </div>

  {/* Quote in the RIGHT narrow parchment column */}
  <div className="rc-gm-quote-right">
    <blockquote className="rc-gm-quote">
      "{GM_MESSAGE}"
    </blockquote>
  </div>
</div>
```

```css
/* Left dark triangle — name and title */
.rc-gm-byline-left {
  position: absolute;
  /* Lower-left of the image, in the dark triangular region */
  bottom: 18%;
  left: 6%;
  width: 30%;   /* fits in the dark triangle left of the character */
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rc-gm-name {
  font-family: 'Cinzel', serif;
  font-size: clamp(0.75rem, 1.1vw, 1rem);
  color: var(--be-gold);
  letter-spacing: 0.08em;
  display: block;
}

.rc-gm-title {
  font-family: 'Cinzel', serif;
  font-size: clamp(0.6rem, 0.85vw, 0.78rem);
  color: rgba(201,150,26,0.65);
  letter-spacing: 0.06em;
  display: block;
}

/* Right parchment column — quote */
.rc-gm-quote-right {
  position: absolute;
  /* Right column of the parchment area */
  bottom: 14%;
  right: 5%;
  width: 28%;   /* narrow right column of the scroll */
  text-align: right;
}

.rc-gm-quote {
  font-family: 'Spectral', serif;
  font-style: italic;
  font-size: clamp(0.72rem, 1vw, 0.92rem);
  color: rgba(240, 220, 170, 0.95);
  line-height: 1.55;
  margin: 0;
  quotes: none;
}
```

### Fine-tuning note for Claude Code
The exact percentage positions for the two zones may need small
adjustments after seeing the rendered result. The left zone
sits in the dark triangular black area to the left of the character.
The right zone sits in the narrow parchment strip on the right edge.
Adjust bottom/left/right/width values by ±5% if text overlaps
the character or falls outside the parchment.

---

## Fix 2 — Calendar badge: much larger on hover

The calendar badge (gold day pill + countdown pill) on LFG cards
needs to be significantly larger when the hover card is visible.

In the hover popup card, increase the badge size:

```css
/* Normal badge on mini/full cards */
.lfg-cal-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}

.lfg-cal-day {
  font-size: 0.68rem;
  padding: 0.18rem 0.45rem;
}

.lfg-cal-countdown {
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
}

/* LARGER version inside the hover popup */
.lfg-hover-card .lfg-cal-badge {
  top: 1rem;
  right: 1rem;
}

.lfg-hover-card .lfg-cal-day {
  font-size: 1.1rem;      /* was 0.68rem — much larger */
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  letter-spacing: 0.1em;
}

.lfg-hover-card .lfg-cal-countdown {
  font-size: 0.9rem;      /* was 0.65rem — much larger */
  padding: 0.25rem 0.7rem;
  border-radius: 6px;
  text-align: center;
}
```

---

## Verification

1. GM corner is visibly larger (clamp 400-580px)
2. "Åvatarødys" and "Blådes Edge Guild Master" appear in the dark
   left triangle area, left of the character
3. Quote text fits cleanly in the right parchment column
4. Neither text overlaps the character image
5. Hovering any LFG mini card shows a large "MON 22" badge (~1.1rem)
6. Countdown pill is clearly readable at ~0.9rem in the hover card
7. Normal cards retain the smaller badge size

## Do not touch
- /recruit page GM corner (leave as is)
- Oath cinematic
- animation-fill-mode: both on all animations

---

## Fix 3 — Calendar badge: show all days, countdown to soonest only

When a post has multiple days (e.g. Tue, Mon, Sun), the badge must
show all of them while the countdown targets only the soonest one.

### Badge layout with multiple days

```tsx
<div className="lfg-cal-badge">
  {/* All selected days as small pills */}
  <div className="lfg-cal-days-row">
    {daysAvailable.map(day => (
      <span key={day} className="lfg-cal-day-pill">{day.toUpperCase()}</span>
    ))}
  </div>
  {/* Countdown to the soonest day only */}
  {countdown && (
    <div className="lfg-cal-countdown">{countdown}</div>
  )}
</div>
```

```css
.lfg-cal-days-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem;
  justify-content: flex-end;
  max-width: 120px;
}

.lfg-cal-day-pill {
  background: var(--be-gold);
  color: #1a1208;
  font-family: 'Cinzel', serif;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
  white-space: nowrap;
}
```

For single-day posts the existing "TUE 23" format stays fine.
For multiple days, show each day abbreviation as a small pill
stacked/wrapped, then the countdown below.

In the hover card, the larger badge also wraps multiple day pills
at the bigger size.

