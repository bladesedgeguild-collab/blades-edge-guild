# TASK: Mobile Fix Round 2 — 6 Issues

---

## Fix 1: Landing page hero text visible on mobile

The "Blådes Edge" hero heading and the recruit quiz CTA link are not visible
on mobile. They are likely rendering behind the hero image or with insufficient
contrast.

Find the hero section in `app/(public)/page.tsx` or its child component.

- Ensure the hero text container has a high enough `zIndex` to sit above the
  background image (at least z-10)
- Add a dark overlay/gradient behind the text if needed so it's readable:
  ```css
  background: linear-gradient(to bottom, rgba(26,18,8,0.7) 0%, transparent 60%)
  ```
- The "Join the Recruit Quiz" link/button must be visible — ensure it renders
  below the heading with enough contrast
- On mobile the heading font size should be `clamp(2rem, 8vw, 4rem)` so it
  scales without overflowing

---

## Fix 2: LFG — no hover on mobile, tap for quiz results images

### LFG cards — remove hover behavior on mobile
The LFG cards should not attempt hover states on mobile. Any `onMouseEnter`/
`onMouseLeave` on LFG cards should be suppressed on touch devices.

Use the `useIsMobile()` hook (already created):
```tsx
const isMobile = useIsMobile()
// Only attach hover handlers if not mobile
onMouseEnter={!isMobile ? handleMouseEnter : undefined}
onMouseLeave={!isMobile ? handleMouseLeave : undefined}
```

### Recruit quiz results — tap to show perk images on mobile
The perk card hover images currently use `onMouseEnter`/`onMouseLeave`.
On mobile, convert to tap toggle:

```tsx
const isMobile = useIsMobile()

// On the perk card:
onClick={isMobile ? () => setHoveredPerk(hoveredPerk === perk.id ? null : perk.id) : undefined}
onMouseEnter={!isMobile ? () => setHoveredPerk(perk.id) : undefined}
onMouseLeave={!isMobile ? () => setHoveredPerk(null) : undefined}
```

On mobile the image overlay should render differently — not fixed-position
center screen (which may be off-screen), but instead as an absolutely positioned
element ABOVE the tapped card, or as a modal:

```tsx
{isMobile && hoveredPerk && (
  <div
    onClick={() => setHoveredPerk(null)}
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      background: 'rgba(26,18,8,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}
  >
    <img
      src={PERK_IMAGES[hoveredPerk]}
      alt=""
      style={{
        maxWidth: '90vw',
        maxHeight: '70vh',
        objectFit: 'contain',
        borderRadius: '8px',
        boxShadow: '0 0 40px rgba(201,150,26,0.4)',
      }}
    />
    <div style={{
      position: 'absolute',
      top: 24,
      right: 24,
      color: '#f0e6c8',
      fontSize: '1.5rem',
      cursor: 'pointer',
    }}>✕</div>
  </div>
)}
```

Tap the image or the ✕ to dismiss.

---

## Fix 3: Campaign banner text not fully visible

Find the current campaign / Hall Feed banner component in the Hall/dashboard.
The text is overflowing or being clipped on mobile.

- Remove any fixed height on the campaign text container
- Set `overflow: visible` or `overflow-y: auto`
- Ensure padding of at least 16px on all sides on mobile
- If the banner has a background image with text overlaid, ensure the text
  container has enough height to show all content:
  ```css
  @media (max-width: 767px) {
    .campaign-banner { min-height: auto; height: auto; }
    .campaign-text { overflow: visible; max-height: none; }
  }
  ```

---

## Fix 4: Discord OAuth — don't fire "returned" event for existing users

When a user logs in via Discord OAuth, the auth callback fires a Hall Feed post
saying they "answered the call and returned." This should only fire for users
who are genuinely new OR genuinely returning after a long absence — NOT for
existing users simply re-authenticating.

Find `app/auth/callback/route.ts` (or equivalent).

Find where the "answered the call" / "returned" Hall Feed post is created.
It will be something like:

```ts
await supabase.from('notifications').insert({
  type: 'member_returned',
  ...
})
```

Add a guard: only fire this event if the user has NO prior `claimed_character_id`
AND this is their first login (check `created_at` vs `updated_at` or a
`first_login` boolean, or check if `has_completed_onboarding` was already true).

```ts
// Only post the "returned" announcement if this is a genuinely new claim
const isReturningSession = existingUser?.claimed_character_id !== null
  && existingUser?.has_completed_onboarding === true

if (!isReturningSession) {
  // fire the Hall Feed post
}
// If they already have a claimed character and completed onboarding,
// this is just a re-auth — skip the announcement entirely
```

---

## Fix 5: LFG card — date pills not overlapping dungeon title

From the screenshot, the date pill (e.g. "WED 24") is overlapping the dungeon
name text on the LFG card. This happens because both are positioned in the same
row without enough space on mobile.

Find the LFG card component. On mobile, reflow the header area so the date pills
sit on their OWN row above the dungeon title:

```tsx
// Mobile layout for LFG card header:
<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
  {/* Date pills row */}
  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
    {days.map(day => <DayPill key={day} day={day} />)}
  </div>
  {/* Dungeon name below */}
  <div className="dungeon-title">{dungeonName}</div>
</div>
```

On desktop the existing layout can stay as-is. Use the `useIsMobile()` hook or
a CSS media query to apply the column layout only on mobile.

---

## Fix 6: Recruit quiz results page — enable scrolling

The results page perk cards are not all visible on mobile — the container is
cutting off at the bottom.

Find the results section/container in the recruit quiz. It likely has a fixed
height or `overflow: hidden`.

```css
@media (max-width: 767px) {
  .results-container,
  .perk-cards-container {
    overflow-y: auto;
    max-height: none;
    height: auto;
    padding-bottom: 80px; /* space for any fixed bottom elements */
  }
}
```

Also ensure the page body itself can scroll on the results screen — the quiz
may be locking `overflow: hidden` on the body during the cinematic that never
gets re-enabled. Find any `document.body.style.overflow = 'hidden'` and make
sure it gets reset to `''` when the results phase begins.

---

## Build and deploy

```bash
npm run build
git add -A
git commit -m "fix: mobile round 2 — hero text, LFG tap, campaign text, auth duplicate post, date pills, results scroll"
git push origin main
```

## Verification checklist
- [ ] Landing page hero: "Blådes Edge" title visible on mobile
- [ ] Landing page hero: recruit quiz link visible and tappable
- [ ] LFG cards: no hover behavior on mobile
- [ ] Recruit results: tap perk card shows fullscreen modal image, tap to dismiss
- [ ] Campaign banner: all text visible, no clipping
- [ ] Discord re-auth: no duplicate "answered the call" Hall Feed post
- [ ] LFG card header: date pills on own row, not overlapping dungeon title
- [ ] Recruit results: all perk cards scrollable on mobile
- [ ] Body scroll re-enabled after oath cinematic
- [ ] `npm run build` passes with zero errors
