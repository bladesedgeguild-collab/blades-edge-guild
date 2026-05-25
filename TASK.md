# TASK: Fix level input field + enhance oath cinematic character entrance

---

## Fix 1 — Level input field (new member onboarding)

Find the level input field in the new member onboarding form (Path B, Step 1).

The field is currently type="number" with a default value of 1. This causes
a UX bug: clicking into the field and typing "46" results in "146" because
the existing "1" is not replaced.

### Change:
- Remove type="number", min, max, and step attributes
- Change to type="text" with inputMode="numeric" and pattern="[0-9]*"
- Set defaultValue to "" (empty string) not 1
- Add placeholder="e.g. 46"
- Add validation: on submit, parse as integer, reject if not between 1-70,
  show inline error "Please enter a level between 1 and 70"
- Remove the up/down spinner arrows entirely with CSS:
  input[type=number]::-webkit-inner-spin-button { display: none; }
  (belt and suspenders in case type=number is kept anywhere)

---

## Fix 2 — Oath cinematic character entrance animation

Find the oath cinematic component where the character figure images are rendered
(left and right figures added in the previous task).

Currently each figure has a simple rise+float animation. Replace this entirely
with a three-layer depth burst entrance per side.

### Concept
Each character side renders THREE copies of the same image stacked:
- Layer 1 (ghost-large): ~250% scale, behind everything, bursts in then drifts
  outward and fades out
- Layer 2 (echo-mid): ~150% scale, horizontally flipped, bursts in slightly
  after Layer 1, also drifts outward and fades out  
- Layer 3 (hero): final display size (~65-70% viewport height), fades in last,
  STAYS visible until the user clicks Continue — no bounce, no float

### Implementation

For each side (left and right), render a container div with position: relative,
containing three absolutely-positioned img elements:

```tsx
<div className="figure-container figure-left">
  {/* Layer 1: ghost large */}
  <img src={leftFigure} className="figure-ghost-large" alt="" aria-hidden="true" />
  {/* Layer 2: echo mid flipped */}
  <img src={leftFigure} className="figure-echo-mid" alt="" aria-hidden="true" />
  {/* Layer 3: hero — the one that stays */}
  <img src={leftFigure} className="figure-hero" alt={`${character.race} ${character.class}`} />
</div>
```

For the RIGHT side container, Layer 2 echo is NOT flipped (it's already on the
right, flip would push it left — omit the scaleX flip on right side or mirror
the direction logic).

### CSS keyframes (add to globals.css)

All animations must use animation-fill-mode: both — never 'forwards'.

```css
/* Layer 1: large ghost bursts in from center, drifts out, fades */
@keyframes be-ghost-large-left {
  0%   { opacity: 0; transform: scale(2.5) translateX(0px); }
  15%  { opacity: 0.25; }
  60%  { opacity: 0.15; transform: scale(2.5) translateX(-60px); }
  100% { opacity: 0; transform: scale(2.5) translateX(-120px); }
}
@keyframes be-ghost-large-right {
  0%   { opacity: 0; transform: scale(2.5) translateX(0px); }
  15%  { opacity: 0.25; }
  60%  { opacity: 0.15; transform: scale(2.5) translateX(60px); }
  100% { opacity: 0; transform: scale(2.5) translateX(120px); }
}

/* Layer 2: medium echo, horizontally flipped on left side */
@keyframes be-echo-mid-left {
  0%   { opacity: 0; transform: scaleX(-1) scale(1.5) translateX(0px); }
  20%  { opacity: 0.2; }
  70%  { opacity: 0.1; transform: scaleX(-1) scale(1.5) translateX(-80px); }
  100% { opacity: 0; transform: scaleX(-1) scale(1.5) translateX(-160px); }
}
@keyframes be-echo-mid-right {
  0%   { opacity: 0; transform: scale(1.5) translateX(0px); }
  20%  { opacity: 0.2; }
  70%  { opacity: 0.1; transform: scale(1.5) translateX(80px); }
  100% { opacity: 0; transform: scale(1.5) translateX(160px); }
}

/* Layer 3: hero fades in and stays */
@keyframes be-hero-appear {
  0%   { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
```

### Animation timing

The character entrance fires AFTER the wax seal stamps. Add an overall delay
to all three layers (e.g. 0.8s after seal animation completes).

Within that, stagger the layers:
- Layer 1 ghost: delay + 0s, duration 1.8s
- Layer 2 echo: delay + 0.3s, duration 1.6s  
- Layer 3 hero: delay + 0.6s, duration 0.8s

```css
.figure-ghost-large { animation: be-ghost-large-left 1.8s ease-out 0.8s both; }
.figure-echo-mid    { animation: be-echo-mid-left 1.6s ease-out 1.1s both; }
.figure-hero        { animation: be-hero-appear 0.8s ease-out 1.4s both; }

/* Right side variants */
.figure-container.figure-right .figure-ghost-large {
  animation-name: be-ghost-large-right;
}
.figure-container.figure-right .figure-echo-mid {
  animation-name: be-echo-mid-right;
}
```

### Layer 3 ground glow effect

After Layer 3 (hero image), add a ground glow element:

```tsx
<div className="figure-ground-glow" />
```

```css
.figure-ground-glow {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 40px;
  background: radial-gradient(
    ellipse at center,
    rgba(201, 150, 26, 0.6) 0%,    /* --be-gold */
    rgba(201, 150, 26, 0.2) 50%,
    transparent 100%
  );
  filter: blur(12px);
  animation: be-hero-appear 0.8s ease-out 1.4s both; /* same timing as hero */
}
```

### Layer stacking
All three layers and the glow are position: absolute within the container.
They all share the same anchor point (bottom-aligned to the container base).
The container itself is position: relative with overflow: visible so the
ghost layers can drift outside the container bounds without clipping.

Make sure the ghost layers (Layer 1 and 2) have a lower z-index than the
central seal/text/button elements so they never obscure them even at 2.5x scale.
Use z-index: 0 on ghost layers, z-index: 1 on hero, z-index: 10 on seal/text.

---

## Verification

### Level field:
1. Click into level field — should be empty, no "1" pre-filled
2. Type "46" — should show "46" not "146"
3. No up/down spinner arrows visible
4. Submit with empty level — should show validation error
5. Submit with "999" — should show "Please enter a level between 1 and 70"

### Oath cinematic:
1. Go through new member onboarding as any race/class
2. Oath screen: ghost layers burst out from behind characters and fade while
   drifting outward — should feel like energy materializing
3. Hero figures settle into final position with no bounce
4. Ground glow visible at feet of each hero figure
5. Central elements (seal, name, class, Continue button) never obscured
6. Works on both Human Mage (plain pose) and Draenei Shaman (dramatic pose)
   — the animation should add drama to both

---

## Do not touch
- be-stamp keyframe — do not modify
- Ember particle effect — do not modify  
- animation-fill-mode: both on ALL existing animations
- Any page outside onboarding
