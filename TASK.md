# TASK: /recruit — evidence image positions, guild crest alpha, results fixes

---

## Fix 1 — Q3 and Q4 evidence images: clock positions, larger size

Evidence images use `position: fixed` coordinates relative to viewport.
Make them LARGER: `clamp(380px, 42vw, 640px)` wide.

### Q4 clock positions (viewport %)
Images fade in one at a time in this order, each at its clock position,
staying on screen until the question is answered:

1. **Recruiting_TophBagsFullofBags.jpg** — 2–3 o'clock (top right mid)
   `top: 12%, right: 1%`

2. **Recruiting_TophinDarkshire.jpg** — 6 o'clock (bottom center)
   `bottom: 3%, left: 50%, transform: translateX(-50%)`

3. **Recruiting_TophInKharanos.jpg** — 10 o'clock (top left)
   `top: 12%, left: 1%`

4. **GuildiesInShattrath.jpg** — just left of noon (top, slightly left of center)
   `top: 2%, left: 22%`

### Q3 clock positions (same approach, summon images)
Keep same clock positions as previously designed but also apply the
larger size `clamp(380px, 42vw, 640px)`.

### CSS
```css
.rc-evi {
  position: fixed;
  width: clamp(380px, 42vw, 640px);
  border-radius: 10px;
  overflow: hidden;
  opacity: 0;
  transition: opacity 1.6s ease;
  pointer-events: none;
  z-index: 5;
}
.rc-evi.is-on { opacity: 1; }
.rc-evi img { width: 100%; height: auto; display: block; }

/* Q3 glow */
.rc-evi-summon {
  box-shadow: 0 0 0 3px #1aff6e, 0 0 28px rgba(26,255,110,0.45);
}

/* Q4 glow */
.rc-evi-recruit {
  box-shadow: 0 0 0 3px #c9961a, 0 0 28px rgba(201,150,26,0.5);
}

@media (max-width: 768px) {
  .rc-evi { display: none; }
}
```

Each evidence div gets its clock position via inline style per image.

---

## Fix 2 — Prevent orphan word on Q4 question text

Q4 question: "What's the biggest perk of a guild?"
"guild?" orphans on its own line at some screen widths.

Apply `text-wrap: balance` (modern) with a fallback:
```css
.rc-q-text {
  text-wrap: balance;
  max-width: 480px;
  margin: 0 auto 1.5rem;
}
```

`text-wrap: balance` distributes words more evenly across lines,
preventing single-word orphans. Supported in all modern browsers.
No content change needed.

---

## Fix 3 — Guild crest: remove black square background

The guild-crest.png file has a background that appears as a black square
when rendered outside the oath cinematic's circular amber container.

### Step A — Check what's happening
Find every place guild-crest.png is rendered on /recruit.
Check if any parent element or the img itself has:
- background: black or #000 or #1a1208
- A CSS class applying a background
- A box-shadow creating a dark square effect

### Step B — Use mix-blend-mode to knock out the dark bg
If the PNG truly has a dark/black background (not transparency),
apply CSS to knock it out:
```css
.rc-crest-img {
  mix-blend-mode: screen;  /* knocks out black, keeps the gold crest */
  filter: brightness(1.1);
}
```

This makes black areas transparent via CSS without needing a new PNG file.

### Step C — Increase crest size
Make the crest larger everywhere on the recruit page:

Intro seal crest: 160px × 160px (inside the 220px amber circle)
Result seal: 240px × 240px 

```css
.rc-intro-crest { width: 160px; height: 160px; }
.rc-result-crest { width: 240px; height: 240px; }
```

---

## Fix 4 — Results overlay: increase opacity for text legibility

Find the dark overlay on the result screen background.
The quiz questions use ~0.52 opacity. Results need darker:

```css
/* Results phase overlay */
.rc-hero-overlay.is-result {
  background: rgba(8, 4, 1, 0.72);  /* was 0.52 — darker for text legibility */
}
```

If the overlay is a single element for all phases, apply a class
toggle when the result phase begins so only results get the darker overlay.

---

## Fix 5 — Result body text: tighter max-width to avoid short last line

The "True Blade" body text currently has "let's ride to 70 together."
alone on the last line. Tighten max-width so the final line reads
"your free bags and let's ride to 70 together."

```css
.rc-result-body {
  max-width: 360px;   /* tighter than current — forces better line breaks */
  margin: 0 auto 1.5rem;
  text-wrap: balance;
  line-height: 1.75;
}
```

Adjust value between 320px–400px to find the break that gives
"your free bags and let's ride to 70 together." as the last line.

---

## Verification

1. Q4: Bags image appears top-right (~2 o'clock), Darkshire bottom center
   (~6 o'clock), Kharanos top-left (~10 o'clock), Shattrath top near noon-left
2. All Q4 evidence images are noticeably larger (~42vw on desktop)
3. Q4 question text "biggest perk of a guild?" stays on 2 balanced lines
4. Guild crest has no visible black or dark square behind it anywhere
5. Guild crest is 160px in intro, 240px in results
6. Results background overlay is visibly darker than during quiz questions
7. Result body text last line reads "your free bags and let's ride to 70 together."
8. Q3 images also larger with their clock positions maintained

## Do not touch
- Questions, answers, scoring logic
- BG slide order and Ken Burns
- Discord URL and AUTH_URL
- Progress pips behavior
- animation-fill-mode: both on all animations
