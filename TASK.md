# TASK: Full mobile responsive overhaul

## Breakpoints to use throughout
- Mobile: < 768px
- Tablet: 768px–1024px  
- Desktop: > 1024px

All existing desktop layouts must remain unchanged.
All changes are additive media queries only.

---

## 1 — Navbar: hamburger menu on mobile

On mobile, collapse the nav links into a hamburger menu.

```tsx
// Add hamburger state
const [menuOpen, setMenuOpen] = useState(false);
```

Desktop nav (> 768px): unchanged — horizontal links + user dropdown.

Mobile nav (< 768px):
- Show guild name/logo on left
- Show hamburger icon (3 lines) on right
- Tapping hamburger opens a full-width dropdown panel below the navbar
- Panel shows all nav links stacked vertically + user dropdown items
- Tapping any link closes the menu
- Tapping outside closes the menu

```css
@media (max-width: 768px) {
  .nav-links { display: none; }
  .nav-user-dropdown { display: none; }
  .nav-hamburger { display: flex; }
  
  .nav-mobile-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--be-bg-1);
    border-bottom: 1px solid rgba(201, 150, 26, 0.2);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0;
    z-index: 100;
  }
  
  .nav-mobile-link {
    font-family: 'Cinzel', serif;
    font-size: 1rem;
    color: var(--be-ink);
    padding: 0.85rem 1rem;
    border-bottom: 1px solid rgba(201, 150, 26, 0.08);
    text-decoration: none;
    display: block;
  }
  
  .nav-mobile-link:last-child { border-bottom: none; }
  
  .nav-mobile-user {
    padding: 0.75rem 1rem;
    color: var(--be-gold);
    font-family: 'Cinzel', serif;
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    border-top: 1px solid rgba(201, 150, 26, 0.15);
    margin-top: 0.5rem;
  }
}
```

Hamburger icon: three gold lines, 24px, tapping toggles open/close.
Show an X icon when open.

---

## 2 — Onboarding: fits on screen without scrolling

### Search step
```css
@media (max-width: 768px) {
  .onboarding-panel {
    min-height: 100svh;
    padding: 1.5rem 1.25rem;
    border-radius: 0;
    margin: 0;
    width: 100%;
  }
  
  .onboarding-guild-crest {
    width: 64px;
    height: 64px;
    margin-bottom: 1rem;
  }
}
```

### New character form
Stack all form fields vertically, full width.
Race and Class dropdowns full width.
Level input full width.

```css
@media (max-width: 768px) {
  .new-char-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .new-char-form select,
  .new-char-form input {
    width: 100%;
    font-size: 1rem; /* prevent iOS zoom on focus */
    padding: 0.75rem 1rem;
  }
}
```

### Character confirm card
Full width, compact padding.

### Step indicator dots
Keep centered, same size.

---

## 3 — Oath cinematic: mobile layout

```css
@media (max-width: 768px) {
  .figure-column { display: none; }
  .oath-center-content {
    width: 100%;
    padding: 1.5rem 1.25rem;
  }
  
  .oath-name {
    font-size: clamp(2rem, 8vw, 3.5rem);
  }
  
  .oath-button-slot {
    padding-bottom: 2rem;
  }
}
```

Seal centered, name centered, class line centered, Continue button full width.
No character art on mobile.

---

## 4 — Hall page: stacked columns

```css
@media (max-width: 768px) {
  /* Main content grid: campaign banner + stats */
  .hall-main-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  /* Campaign banner full width */
  .hall-campaign-banner {
    width: 100%;
    border-radius: 8px;
  }
  
  /* Stats tiles side by side on mobile */
  .hall-stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  /* Hall feed + Upcoming stack vertically */
  .hall-bottom-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem 1rem;
  }
  
  /* Welcome greeting */
  .hall-greeting-name {
    font-size: clamp(2rem, 7vw, 3rem);
  }
  
  .hall-greeting-sub {
    font-size: 0.85rem;
  }
}
```

---

## 5 — My Roster page: stacked mobile layout

### Hero section
```css
@media (max-width: 768px) {
  .roster-hero {
    position: relative;
    padding: 1.25rem;
    min-height: auto;
    overflow: hidden;
  }
  
  /* Character art: smaller, behind text, bottom-right */
  .roster-hero-art {
    position: absolute;
    right: 0;
    bottom: 0;
    opacity: 0.25;  /* ghost behind text on mobile */
    pointer-events: none;
  }
  
  .roster-hero-fig {
    height: 120px;
  }
  
  /* Name scales with viewport */
  .roster-hero-name {
    font-size: clamp(1.8rem, 7vw, 3rem);
    position: relative;
    z-index: 1;
  }
  
  .roster-hero-class {
    font-size: 0.85rem;
    position: relative;
    z-index: 1;
  }
}
```

### Vitals + Alts: stack vertically
```css
@media (max-width: 768px) {
  .roster-body {
    grid-template-columns: 1fr;  /* override the 2-col desktop grid */
    padding: 1rem;
    gap: 1rem;
  }
}
```

### Add Alt button: full width on mobile
```css
@media (max-width: 768px) {
  .add-alt-btn {
    max-width: 100%;
    width: 100%;
    border-radius: 8px;
  }
  
  /* Scale figures down slightly */
  .alt-fig-1 { height: 90px; }
  .alt-fig-2 { height: 118px; }
  .alt-fig-3 { height: 145px; }
  .alt-fig-4 { height: 128px; }
  .alt-fig-5 { height: 96px; }
  
  .alt-btn-figures { height: 155px; }
}
```

---

## 6 — Settings page: mobile

```css
@media (max-width: 768px) {
  .settings-section {
    padding: 1.25rem;
    border-radius: 8px;
  }
  
  .settings-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .settings-btn-secondary,
  .settings-btn-discord,
  .settings-btn-danger {
    width: 100%;
    padding: 0.75rem;
    text-align: center;
  }
}
```

---

## 7 — Global mobile typography + spacing

```css
@media (max-width: 768px) {
  /* Prevent horizontal scroll */
  body {
    overflow-x: hidden;
  }
  
  /* Base font size slightly larger for readability */
  body {
    font-size: 16px;
  }
  
  /* All inputs 16px minimum to prevent iOS auto-zoom */
  input, select, textarea {
    font-size: 16px !important;
  }
  
  /* Page container padding tighter on mobile */
  .page-container {
    padding: 0 1rem;
    max-width: 100%;
  }
  
  /* Headings scale down */
  h1 { font-size: clamp(1.8rem, 6vw, 2.5rem); }
  h2 { font-size: clamp(1.4rem, 5vw, 2rem); }
}
```

---

## 8 — Landing page: basic mobile check

The landing page has its own full-bleed design. Check these specific items:
- Hero text readable on small screen
- Return meter full width
- Login CTA buttons stack vertically on mobile
- Roster scrolling rows still animate (may need reduced speed on mobile)
- Guild photo section stacks sensibly

If any of these are clearly broken, fix them. If they already work acceptably, leave them.

---

## Verification — test on 390px wide (iPhone) and 768px (tablet)

1. Navbar shows hamburger, tapping opens menu with all links
2. Tapping a link closes the menu
3. Onboarding search screen fits without scrolling
4. New character form fields are full width and usable
5. Oath cinematic: seal centered, no character art, name fits
6. Hall page: stats side by side, feed and upcoming stacked
7. My Roster: hero name readable, character art ghosted behind text
8. Vitals and alts stack vertically
9. Add Alt button full width with scaled figures
10. Settings rows stack vertically with full-width buttons
11. No horizontal scroll on any page
12. No text overflowing containers

## Do not touch
- All desktop layouts (> 768px) — media queries are additive only
- Oath cinematic desktop animation — only hide figures on mobile
- animation-fill-mode: both on all animations
- Any API routes or data fetching
