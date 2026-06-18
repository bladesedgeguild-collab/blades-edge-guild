# TASK: LFG layout overhaul + Hall Feed limit + card sizing

---

## Fix 1 — Hall Feed: cap at 8 most recent entries

Find the Hall Feed query. Add `.limit(8)`:

```ts
const { data: feedItems } = await supabase
  .from('characters')
  .select('name, class, status, created_at')
  .eq('status', 'returned')
  .order('created_at', { ascending: false })
  .limit(8);
```

Only the 8 most recent entries. No more infinite growth.

---

## Fix 2 — LFG card layout: 2 columns (Tank+Healer left, DPS right)

Change the role blocks grid from 3 equal columns to 2 columns.
Left column: Tank on top, Healer below (stacked).
Right column: All 3 DPS slots.

```tsx
<div className="lfg-roles-2col">

  {/* Left column */}
  <div className="lfg-roles-left">
    <div className="lfg-role-block">
      <div className="lfg-role-header">
        <TankIcon size={28} />
        <span className="lfg-role-label">Tank</span>
      </div>
      {group.tank?.[0]
        ? <span className="lfg-slot-name">{group.tank[0]}</span>
        : <span className="lfg-slot-need">NEED</span>
      }
    </div>

    <div className="lfg-role-block">
      <div className="lfg-role-header">
        <HealerIcon size={28} />
        <span className="lfg-role-label">Healer</span>
      </div>
      {group.healer?.[0]
        ? <span className="lfg-slot-name">{group.healer[0]}</span>
        : <span className="lfg-slot-need">NEED</span>
      }
    </div>
  </div>

  {/* Right column */}
  <div className="lfg-role-block lfg-role-block--dps">
    <div className="lfg-role-header">
      <DPSIcon size={28} />
      <span className="lfg-role-label">DPS</span>
    </div>
    {[0,1,2].map(i => (
      <div key={i} className="lfg-role-slot">
        <span className="lfg-dps-label">DPS {i+1}:</span>
        {group.dps?.[i]
          ? <span className="lfg-slot-name">{group.dps[i]}</span>
          : <span className="lfg-slot-need">NEED</span>
        }
      </div>
    ))}
  </div>

</div>
```

```css
.lfg-roles-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.lfg-roles-left {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
```

Apply this same 2-column layout to the hover card as well.

---

## Fix 3 — Full LFG cards (Hall/My Roster/bottom of Dungeons)

Reduce from very large full-width blocks to a 3-column grid.
Target size: roughly the same as the hover card popup (420-480px wide).

```css
.active-lfg-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

@media (max-width: 1100px) {
  .active-lfg-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 700px) {
  .active-lfg-grid { grid-template-columns: 1fr; }
}
```

Dungeon name on each card: large Cinzel Decorative, gold, links to
/dungeons/[slug] on click:

```tsx
<Link
  href={`/dungeons/${post.dungeon_slug}`}
  className="lfg-card-dungeon-link"
  onClick={e => e.stopPropagation()}
>
  {formatDungeonName(post.dungeon_slug)}
</Link>
```

```css
.lfg-card-dungeon-link {
  font-family: 'Cinzel Decorative', serif;
  font-size: 1.3rem;
  color: var(--be-gold);
  text-decoration: none;
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 150ms ease, color 150ms ease;
}

.lfg-card-dungeon-link:hover {
  background: var(--be-gold);
  color: #1a1208;
}
```

Clicking the REST of the card (not the dungeon name) scrolls down to
its full card if on a page with full cards below, OR navigates to
/dungeons/[slug]?lfg=[id]:

```tsx
<div
  className="lfg-mini-card"
  onClick={() => {
    const el = document.getElementById(`lfg-full-${post.id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else router.push(`/dungeons/${post.dungeon_slug}?lfg=${post.id}`);
  }}
>
```

---

## Fix 4 — Mini LFG cards in the reference box locations

Two locations get a compact LFG summary box:
1. Hall page: right side, below the stat tiles (where the wireframe shows it)
2. Dungeons page: top-right sidebar

These show MINI cards. On hover: show the full popup card.
On click: scroll to full card below.

Mini card design:
```tsx
<div
  className="lfg-mini-card"
  onMouseEnter={(e) => handleLFGHover(e, post.id)}
  onMouseLeave={() => setHoveredLFG(null)}
  onClick={() => scrollToFullCard(post.id)}
>
  <span className="lfg-mini-dungeon">
    {formatDungeonName(post.dungeon_slug)}
  </span>
  <span className="lfg-mini-meta">
    {post.role} {post.character_name}
  </span>
  <span className="lfg-mini-needs">
    {getNeedsText(post.current_group)}
  </span>
</div>
```

```css
.lfg-mini-box {
  background: rgba(201,150,26,0.07);
  border: 1px solid rgba(201,150,26,0.35);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  max-height: 280px;
  overflow-y: auto;
}

.lfg-mini-box-title {
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--be-gold);
  margin-bottom: 0.6rem;
}

.lfg-mini-card {
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid rgba(201,150,26,0.1);
  cursor: pointer;
  border-radius: 6px;
  transition: background 150ms ease;
}

.lfg-mini-card:hover {
  background: rgba(201,150,26,0.08);
}

.lfg-mini-dungeon {
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  color: var(--be-gold);
  display: block;
}

.lfg-mini-meta {
  font-family: 'Spectral', serif;
  font-size: 0.78rem;
  color: var(--be-muted);
  font-style: italic;
  display: block;
}

.lfg-mini-needs {
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  color: #ff8c00;
  font-weight: 700;
  display: block;
}
```

On Hall page, place this mini box in the right column alongside
the stat tiles. The full-size 3-column grid of cards goes below the
Hall Feed and Upcoming panels, full width.

---

## Fix 5 — Each full card gets an anchor ID for scroll-to

```tsx
<div
  id={`lfg-full-${post.id}`}
  className="lfg-big-card"
  ...
>
```

The mini card click uses:
```ts
const scrollToFullCard = (postId: string) => {
  const el = document.getElementById(`lfg-full-${postId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('lfg-card-highlight');
    setTimeout(() => el.classList.remove('lfg-card-highlight'), 1500);
  }
};
```

```css
.lfg-card-highlight {
  animation: lfg-pulse-border 1.5s ease both;
  animation-fill-mode: both;
}

@keyframes lfg-pulse-border {
  0%   { border-color: rgba(201,150,26,0.4); }
  50%  { border-color: rgba(201,150,26,1); box-shadow: 0 0 20px rgba(201,150,26,0.3); }
  100% { border-color: rgba(201,150,26,0.4); }
}
```

---

## Verification

1. Hall Feed shows exactly 8 entries, no more
2. LFG role layout is 2 columns: Tank+Healer stacked left, DPS right
3. Same 2-column layout in hover popup
4. Full LFG cards are in a 3-column grid, not a single tall column
5. Mini LFG box on Hall right column shows compact cards
6. Mini LFG box on Dungeons page sidebar shows compact cards
7. Clicking mini card scrolls to full card below with gold highlight flash
8. Dungeon name on card is a link: gold text, hover shows gold background
9. Clicking dungeon name goes to /dungeons/[slug] (not ?lfg= URL)
10. Clicking anywhere else on card scrolls to or navigates with LFG context

## Do not touch
- /recruit page
- Oath cinematic
- animation-fill-mode: both on all animations

---

## Fix 6 — Active LFG sidebar on Dungeon Finder: hover + click anywhere

The mini cards in the "Active LFG Calls" box on the right of the
Dungeon Finder page must:

### A — Make the ENTIRE card clickable (not just "View →")
Replace the "View →" text link with a full-card click handler:

```tsx
<div
  className="lfg-mini-card"
  style={{ cursor: 'pointer' }}
  onMouseEnter={(e) => handleLFGHover(e, post.id)}
  onMouseLeave={() => setHoveredLFG(null)}
  onClick={() => router.push(`/dungeons/${post.dungeon_slug}?lfg=${post.id}`)}
>
  <span className="lfg-mini-dungeon">{formatDungeonName(post.dungeon_slug)}</span>
  <span className="lfg-mini-meta">{post.role} {post.character_name}</span>
  <span className="lfg-mini-needs">{getNeedsText(post.current_group)}</span>
  <span className="lfg-mini-window">{formatWindow(post)}</span>
</div>
```

Remove the separate "View →" link — the whole card IS the button.

### B — Hover popup on the sidebar cards
The same hover popup used on the full cards must work on the mini
sidebar cards. The hoveredLFG state and popup JSX must be in the
same component as the sidebar. If DungeonsClient.tsx renders the
sidebar, the hover state lives there.

### C — Dungeon page with ?lfg= shows Cancel/Edit at the top
When /dungeons/[slug]?lfg=[id] loads, fetch the LFG post and render
it at the TOP of the page with:
- Full 2-column role layout (Tank+Healer left, DPS right)
- Note field if present
- Time window
- Cancel button (for post owner and admins)
- Edit button (for post owner)
- "Answer the Call" button for other users

```tsx
{featuredLFG && (
  <div className="dungeon-featured-lfg">
    <div className="dungeon-featured-header">
      <h2 className="dungeon-featured-title">Active Call for This Dungeon</h2>
      <div className="dungeon-featured-actions">
        {isOwner && (
          <>
            <button className="lfg-edit-btn" onClick={() => setEditing(true)}>Edit</button>
            <button className="lfg-cancel-btn" onClick={() => handleCancel(featuredLFG.id)}>Cancel Request</button>
          </>
        )}
      </div>
    </div>

    <p className="lfg-big-meta">
      <strong>{featuredLFG.role} {featuredLFG.character_name}</strong> is seeking more.{' '}
      <span className="lfg-needs-text">{getNeedsText(featuredLFG.current_group)}</span>
    </p>

    {/* 2-column role layout */}
    <div className="lfg-roles-2col">
      {/* Tank + Healer stacked left, DPS right */}
    </div>

    {featuredLFG.notes && (
      <div className="lfg-hover-note">
        <span className="lfg-hover-note-label">Note</span>
        <p className="lfg-hover-note-text">{featuredLFG.notes}</p>
      </div>
    )}

    {!isOwner && (
      <button className="dungeon-join-btn">Answer the Call</button>
    )}
  </div>
)}
```

---

## Fix 7 — Full LFG card grid: 3 columns, 2 rows visible then scroll

The full cards at the bottom of the pages (Hall, My Roster, Dungeons)
must NOT grow into a single infinite column.

```css
.active-lfg-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  max-height: calc(2 * 280px + 1.25rem); /* 2 rows max visible */
  overflow-y: auto;
  padding-right: 0.25rem; /* room for scrollbar */
}

/* Custom scrollbar to match dark theme */
.active-lfg-grid::-webkit-scrollbar {
  width: 6px;
}
.active-lfg-grid::-webkit-scrollbar-track {
  background: var(--be-bg-2);
  border-radius: 3px;
}
.active-lfg-grid::-webkit-scrollbar-thumb {
  background: rgba(201,150,26,0.4);
  border-radius: 3px;
}

@media (max-width: 1100px) {
  .active-lfg-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 700px) {
  .active-lfg-grid { grid-template-columns: 1fr; }
}
```

Each card height should be roughly consistent so 2 rows = a predictable
container height. If a card's content is taller, clip with
`overflow: hidden` and rely on the hover card for full details.

---

## Fix 8 — The Dungeon Finder sidebar mini cards ARE the template

The mini cards in the "Active LFG Calls" sidebar on the Dungeon Finder
page are the correct size and style for ALL compact LFG displays.

The mini cards on:
- Hall page right column
- My Roster page

Should use the EXACT same component and styling as the Dungeon Finder
sidebar cards. Extract into a shared component:

```
components/LFGMiniCard.tsx
```

Import and use this component in all three locations. No location
should have its own unique mini card style.

