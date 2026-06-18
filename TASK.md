# TASK: LFG placement fixes + nav click feedback

---

## Fix 1 — /dungeons: 3-column 2-row grid, restore original card style

The Active LFG Calls on the Dungeons page must use the ORIGINAL
detailed card style (dungeon name, role + name, needs, time, View →)
arranged in a 3-column grid capped at 2 visible rows.

```css
.df-lfg-sidebar .lfg-mini-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  max-height: calc(2 * 140px + 0.75rem);
  overflow-y: auto;
}

@media (max-width: 900px) {
  .df-lfg-sidebar .lfg-mini-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

Each mini card uses the original detailed layout:
```tsx
<div
  className="lfg-mini-card"
  style={{ cursor: 'pointer' }}
  onMouseEnter={(e) => handleLFGHover(e, post.id)}
  onMouseLeave={() => setHoveredLFG(null)}
  onClick={() => router.push(`/dungeons/${post.dungeon_slug}?lfg=${post.id}`)}
>
  <span className="lfg-mini-dungeon">
    {formatDungeonName(post.dungeon_slug)}
  </span>
  <span className="lfg-mini-caller">
    {post.role} {post.character_name}
  </span>
  <span className="lfg-mini-needs">
    {getNeedsText(post.current_group)}
  </span>
  {formatWindow(post) && (
    <span className="lfg-mini-window">{formatWindow(post)}</span>
  )}
  <span className="lfg-mini-view">View →</span>
</div>
```

```css
.lfg-mini-card {
  background: var(--be-bg-2);
  border: 1px solid rgba(201,150,26,0.2);
  border-radius: 8px;
  padding: 0.75rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  transition: border-color 150ms ease;
}
.lfg-mini-card:hover {
  border-color: rgba(201,150,26,0.5);
}
.lfg-mini-dungeon {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.82rem;
  color: var(--be-gold);
}
.lfg-mini-caller {
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  color: var(--be-ink);
  font-weight: 600;
}
.lfg-mini-needs {
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  color: #ff8c00;
  font-weight: 700;
}
.lfg-mini-window {
  font-family: 'Spectral', serif;
  font-style: italic;
  font-size: 0.75rem;
  color: var(--be-muted);
}
.lfg-mini-view {
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  color: var(--be-portal);
  letter-spacing: 0.08em;
  margin-top: 0.2rem;
}
```

The sidebar box sits to the right of the dungeon grid heading area,
NOT as a standalone wide block. Keep its current position.

---

## Fix 2 — Hall page: move LFG block BELOW the Upcoming section

Currently the Active LFG block appears above or beside Upcoming.
Move it to appear BELOW the Upcoming calendar block.

In app/(member)/dashboard/page.tsx, find the JSX order:
1. Campaign tile + stat tiles row (left and right columns)
2. Hall Feed (left) + Upcoming (right)
3. [PUT LFG BLOCK HERE — full width below both columns]

```tsx
{/* Two-column row: Hall Feed left, Upcoming right */}
<div className="hall-two-col">
  <HallFeed entries={feedItems} />
  <Upcoming events={events} />
</div>

{/* LFG block — full width BELOW the two-column row */}
{activeLFG && activeLFG.length > 0 && (
  <ActiveLFGCalls posts={activeLFG} variant="hall" />
)}
```

The LFG block here uses the 3-column grid of detailed mini cards
(same as Fix 1 style), capped at 2 rows with internal scroll.
The block only renders when activeLFG.length > 0.

---

## Fix 3 — My Roster: 1-row 4-5 column strip between YOUR MAIN and vitals

Place a slim LFG strip between the "YOUR MAIN" hero section and the
CHARACTER VITALS / ALTS content below it.

Only renders when activeLFG.length > 0. When empty, takes up zero space.

```tsx
{activeLFG && activeLFG.length > 0 && (
  <div className="roster-lfg-strip">
    <span className="roster-lfg-label">Active Dungeon Calls</span>
    <div className="roster-lfg-row">
      {activeLFG.slice(0, 5).map(post => (
        <LFGMiniCard
          key={post.id}
          post={post}
          onHover={handleLFGHover}
          onClick={() => router.push(`/dungeons/${post.dungeon_slug}?lfg=${post.id}`)}
        />
      ))}
    </div>
  </div>
)}
```

```css
.roster-lfg-strip {
  margin: 1rem 0;
  padding: 0.75rem 1rem;
  background: rgba(201,150,26,0.05);
  border: 1px solid rgba(201,150,26,0.2);
  border-radius: 10px;
}

.roster-lfg-label {
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--be-muted);
  display: block;
  margin-bottom: 0.6rem;
}

.roster-lfg-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.6rem;
}

@media (max-width: 900px) {
  .roster-lfg-row { grid-template-columns: repeat(3, 1fr); }
}
```

Shows max 5 cards (slice(0, 5)) to fit 1 row.
Cards use LFGMiniCard component — same style as Fix 1.

---

## Fix 4 — Hover popups ONLY on small blocks, not on large cards

Remove onMouseEnter / onMouseLeave from large LFG cards.
Large cards at bottom of Hall and My Roster already show all details
— no hover needed.

Add hover only to:
- LFGMiniCard (used in all small/compact locations)
- The sidebar cards on /dungeons

Remove hover from:
- .lfg-big-card elements in the full grid at bottom of pages
- Any large card that already shows Tank/Healer/DPS inline

All users (owner or not) see all cards. Owner sees Edit and Cancel.
Others see the card but no Edit or Cancel buttons.

---

## Fix 5 — Navbar click feedback

When a nav link is clicked, provide immediate visual feedback so
the user knows the navigation registered before the page loads.

Two parts:

### A — Active link highlight on click
When a nav item is clicked, immediately add an 'is-loading' class:
```tsx
const handleNavClick = (href: string) => {
  setLoadingNav(href);
};

<Link
  href="/hall"
  className={`nav-link ${loadingNav === '/hall' ? 'nav-loading' : ''}`}
  onClick={() => handleNavClick('/hall')}
>
  Hall
</Link>
```

```css
.nav-loading {
  opacity: 0.6;
  position: relative;
}

.nav-loading::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--be-gold);
  animation: nav-load-bar 0.8s ease-in-out infinite;
  animation-fill-mode: both;
}

@keyframes nav-load-bar {
  0%   { transform: scaleX(0); transform-origin: left; }
  50%  { transform: scaleX(1); transform-origin: left; }
  51%  { transform-origin: right; }
  100% { transform: scaleX(0); transform-origin: right; }
}
```

### B — Use Next.js router events to clear loading state
```tsx
const router = useRouter();
const pathname = usePathname();

useEffect(() => {
  setLoadingNav(null);
}, [pathname]);
```

This clears the loading state as soon as the new page loads.

---

## Verification

1. /dungeons: Active LFG Calls in 3-column 2-row grid with detailed cards
2. Hall page: LFG block sits BELOW the Hall Feed / Upcoming row
3. LFG block on Hall only shows when posts exist, hidden otherwise
4. My Roster: slim 1-row 5-column strip between YOUR MAIN and vitals
5. My Roster LFG strip hidden when no active posts
6. Hover popup works on small cards (all three locations)
7. No hover popup on large cards at bottom of Hall and My Roster
8. All users see all LFG cards; only owners see Edit and Cancel
9. Clicking a nav item immediately shows a gold loading bar underneath it
10. Loading bar disappears when new page finishes loading

## Do not touch
- /recruit page
- Oath cinematic
- animation-fill-mode: both on all animations
