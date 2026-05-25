# TASK: Fix oath cinematic character figures — positioning broken

## Problem
After the depth burst cinematic task, character figures are not visible.
A gold glow appears at the bottom-left corner, indicating the images are
loading but positioned off-screen. The figure containers are not anchored
correctly within the oath screen layout.

## Diagnosis to run first
Add a temporary red border to the figure containers to see where they are:
```css
.figure-container { border: 2px solid red; }
```
Remove after diagnosing.

## Root cause (likely)
The figure containers are position: absolute children escaping their parent,
or the parent layout is not giving them a defined space to sit in.

## Fix — figure container layout

The oath cinematic screen should have a three-column layout:
- Left column: left figure (25-30% width)
- Center column: seal + text + button (40-50% width)  
- Right column: right figure (25-30% width)

Replace the current figure positioning with this explicit flex layout:

```tsx
<div style={{
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  width: '100%',
  minHeight: '100vh',
  position: 'relative',
}}>
  {/* Left figure column */}
  <div className="figure-column figure-column-left">
    <div className="figure-container figure-left">
      <img src={leftFigure} className="figure-ghost-large" alt="" aria-hidden="true" />
      <img src={leftFigure} className="figure-echo-mid" alt="" aria-hidden="true" />
      <img src={leftFigure} className="figure-hero" alt="" />
      <div className="figure-ground-glow" />
    </div>
  </div>

  {/* Center content column — seal, name, class, button */}
  <div className="oath-center-content">
    {/* existing seal + text + button */}
  </div>

  {/* Right figure column */}
  <div className="figure-column figure-column-right">
    <div className="figure-container figure-right">
      <img src={rightFigure} className="figure-ghost-large" alt="" aria-hidden="true" />
      <img src={rightFigure} className="figure-echo-mid" alt="" aria-hidden="true" />
      <img src={rightFigure} className="figure-hero" alt="" />
      <div className="figure-ground-glow" />
    </div>
  </div>
</div>
```

## Fix — figure CSS (replace existing figure styles in globals.css)

```css
/* Column layout */
.figure-column {
  width: 28%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 70vh;
  flex-shrink: 0;
}

.oath-center-content {
  width: 44%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  z-index: 10;
  flex-shrink: 0;
}

/* Container holds all 3 layers stacked */
.figure-container {
  position: relative;
  width: 100%;
  height: 70vh;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: visible;
}

/* All layers share base positioning */
.figure-container img,
.figure-ground-glow {
  position: absolute;
  bottom: 0;
}

/* Layer 3 hero — base size, stays visible */
.figure-hero {
  width: auto;
  height: 65vh;
  max-width: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  animation: be-hero-appear 0.8s ease-out 1.4s both;
}

/* Layer 1 ghost large */
.figure-ghost-large {
  width: auto;
  height: 65vh;
  left: 50%;
  transform: translateX(-50%) scale(2.5);
  transform-origin: bottom center;
  z-index: 0;
  pointer-events: none;
}
.figure-left .figure-ghost-large {
  animation: be-ghost-large-left 1.8s ease-out 0.8s both;
}
.figure-right .figure-ghost-large {
  animation: be-ghost-large-right 1.8s ease-out 0.8s both;
}

/* Layer 2 echo mid */
.figure-echo-mid {
  width: auto;
  height: 65vh;
  left: 50%;
  transform-origin: bottom center;
  z-index: 0;
  pointer-events: none;
}
.figure-left .figure-echo-mid {
  transform: translateX(-50%) scaleX(-1) scale(1.5);
  animation: be-echo-mid-left 1.6s ease-out 1.1s both;
}
.figure-right .figure-echo-mid {
  transform: translateX(-50%) scale(1.5);
  animation: be-echo-mid-right 1.6s ease-out 1.1s both;
}

/* Ground glow */
.figure-ground-glow {
  left: 50%;
  transform: translateX(-50%);
  width: 160px;
  height: 50px;
  background: radial-gradient(
    ellipse at center,
    rgba(201, 150, 26, 0.7) 0%,
    rgba(201, 150, 26, 0.25) 50%,
    transparent 100%
  );
  filter: blur(14px);
  z-index: 2;
  animation: be-hero-appear 0.8s ease-out 1.4s both;
}

/* Hide figures on mobile */
@media (max-width: 768px) {
  .figure-column { display: none; }
  .oath-center-content { width: 100%; }
}
```

## Keyframes (keep from previous task, just ensure these exist in globals.css)

```css
@keyframes be-hero-appear {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
@keyframes be-ghost-large-left {
  0%   { opacity: 0;    transform: translateX(-50%) scale(2.5) translateX(0px); }
  15%  { opacity: 0.22; }
  60%  { opacity: 0.12; transform: translateX(-50%) scale(2.5) translateX(-80px); }
  100% { opacity: 0;    transform: translateX(-50%) scale(2.5) translateX(-160px); }
}
@keyframes be-ghost-large-right {
  0%   { opacity: 0;    transform: translateX(-50%) scale(2.5) translateX(0px); }
  15%  { opacity: 0.22; }
  60%  { opacity: 0.12; transform: translateX(-50%) scale(2.5) translateX(80px); }
  100% { opacity: 0;    transform: translateX(-50%) scale(2.5) translateX(160px); }
}
@keyframes be-echo-mid-left {
  0%   { opacity: 0;    transform: translateX(-50%) scaleX(-1) scale(1.5) translateX(0px); }
  20%  { opacity: 0.18; }
  70%  { opacity: 0.08; transform: translateX(-50%) scaleX(-1) scale(1.5) translateX(-100px); }
  100% { opacity: 0;    transform: translateX(-50%) scaleX(-1) scale(1.5) translateX(-200px); }
}
@keyframes be-echo-mid-right {
  0%   { opacity: 0;    transform: translateX(-50%) scale(1.5) translateX(0px); }
  20%  { opacity: 0.18; }
  70%  { opacity: 0.08; transform: translateX(-50%) scale(1.5) translateX(100px); }
  100% { opacity: 0;    transform: translateX(-50%) scale(1.5) translateX(200px); }
}
```

## Verification
1. Go through new member onboarding
2. Oath screen: both character figures visible on left and right
3. Ghost layers burst outward from behind figures and fade
4. Hero figures stay planted at bottom of their columns
5. Ground glow visible at feet
6. Seal, name, class line, and Continue button never obscured
7. Mobile: figures hidden, center content full width

## Do not touch
- be-stamp keyframe
- Ember particles
- animation-fill-mode: both on all animations — never 'forwards'
- Level input fix from previous task — leave as-is
