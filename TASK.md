# TASK: LFG system — 8 fixes

---

## Fix 1 — "Your Level" note: add dismiss instruction

Find the text that shows when showOnlyMyLevel is true:
"Showing only dungeons for level {effectiveLevel}."

Change to:
"Showing only dungeons for level {effectiveLevel}. Click Your Level again to see all dungeons."

---

## Fix 2 — LFG hover card: attach handlers to existing cards

The hover cards were built but never attached to the card elements.
Find every place an LFG post card is rendered in:
- components/ActiveLFGCalls.tsx
- app/(member)/dashboard/page.tsx
- app/(member)/my-roster/page.tsx
- app/(public)/dungeons/DungeonsClient.tsx

Add onMouseEnter and onMouseLeave to each card element:
```tsx
<div
  className="lfg-big-card"
  onMouseEnter={(e) => handleLFGHover(e, post.id)}
  onMouseLeave={() => setHoveredLFG(null)}
>
```

The hover state (hoveredLFG, hoverPos) and the hover card JSX must be
in the same component. If ActiveLFGCalls.tsx is a server component,
convert it to a client component ('use client') so it can hold state.

The hover card renders fixed above the hovered card and shows:
- Dungeon name (large)
- Role filled/need status
- Note field if present
- Window/time

---

## Fix 3 — Cancel, edit, and auto-expiry for LFG posts

### Cancel button
Every LFG card shows a Cancel button to the creator.
Admin can cancel any post.

```tsx
{isOwner && (
  <button className="lfg-cancel-btn" onClick={() => handleCancel(post.id)}>
    Cancel Request
  </button>
)}
```

DELETE /api/dungeons/lfg/[id] already exists — wire the button to it.
After cancel, refresh the list.

### Edit button
Creator can edit their post. Opens an inline edit form on the card
with current values pre-filled:

```tsx
{isOwner && (
  <button className="lfg-edit-btn" onClick={() => setEditingId(post.id)}>
    Edit
  </button>
)}

{editingId === post.id && (
  <LFGEditForm post={post} onSave={handleSave} onCancel={() => setEditingId(null)} />
)}
```

Edit saves via PATCH /api/dungeons/lfg/[id]:
```ts
export async function PATCH(req, { params }) {
  const body = await req.json();
  // Update days_available, time_start, time_end, notes, available_window
  await supabaseAdmin.from('dungeon_lfg').update(body).eq('id', params.id);
  return Response.json({ success: true });
}
```

### Auto-expiry based on user's time window
When a post is created, set expires_at based on the selected day + time_end.

If the user selected specific days and a time_end, calculate the next
occurrence of that day+time and use it as expires_at.

If no specific time, default to 24 hours from now.

```ts
const calculateExpiry = (days: string[], timeEnd: string): Date => {
  if (!days.length || !timeEnd) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h default
  }
  // Find next occurrence of the last day in the list at timeEnd in MT
  // For simplicity: set to end of today at timeEnd MT, or +7 days max
  const endDate = new Date();
  // Parse timeEnd as Mountain Time
  // Set expires_at to that time today (or tomorrow if already past)
  return endDate; // implement with proper MT timezone parsing
};
```

---

## Fix 4 — FORCE LFG block onto Hall AND My Roster (THIRD ATTEMPT)

This has been requested repeatedly. The following is mandatory.

### Step A — Make ActiveLFGCalls a client component
The component needs useState for hover. Add 'use client' at top.

Fetch data via an API route instead of directly in the component:
Create GET /api/dungeons/lfg/active:
```ts
export async function GET() {
  const { data } = await supabaseAdmin
    .from('dungeon_lfg')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  return Response.json(data ?? []);
}
```

The component fetches on mount:
```tsx
'use client';
export default function ActiveLFGCalls() {
  const [posts, setPosts] = useState<LFGPost[]>([]);
  useEffect(() => {
    fetch('/api/dungeons/lfg/active')
      .then(r => r.json())
      .then(setPosts);
  }, []);

  return (
    <section className="active-lfg-section">
      <h2 className="active-lfg-heading">Active Dungeon Calls</h2>
      {posts.length === 0
        ? <p className="active-lfg-empty">No active calls right now.</p>
        : posts.map(post => <LFGCard key={post.id} post={post} />)
      }
    </section>
  );
}
```

### Step B — Add to dashboard
In app/(member)/dashboard/page.tsx:
1. Add import at top: `import ActiveLFGCalls from '@/components/ActiveLFGCalls'`
2. Place in JSX directly below the stat tiles section.

### Step C — Add to my-roster
In app/(member)/my-roster/page.tsx:
1. Add import at top: `import ActiveLFGCalls from '@/components/ActiveLFGCalls'`
2. Place in JSX at the bottom of the page.

### Step D — Mandatory grep verification
```bash
grep -n "ActiveLFGCalls" app/\(member\)/dashboard/page.tsx
grep -n "ActiveLFGCalls" app/\(member\)/my-roster/page.tsx
```
Both must return results. If either does not, add it. Do not commit until both pass.

---

## Fix 5 — Timezone info text: much larger and bold

Find the timezone comparison line in the LFG form.
Change its CSS:

```css
.lfg-timezone {
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--be-gold);
  background: rgba(201,150,26,0.08);
  border: 1px solid rgba(201,150,26,0.3);
  border-radius: 8px;
  padding: 0.85rem 1.1rem;
  margin: 0.75rem 0;
  line-height: 1.6;
}

.lfg-tz-equiv {
  display: block;
  font-size: 1.2rem;
  color: var(--be-ink);
  margin-top: 0.25rem;
}
```

---

## Fix 6 — LFG form: larger fonts and bigger click targets

All form elements in the LFG form need larger sizing:

```css
/* Day checkboxes */
.lfg-day-chip {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid rgba(201,150,26,0.3);
  min-width: 56px;
  text-align: center;
  user-select: none;
}

.lfg-day-chip input[type="checkbox"] {
  display: none; /* hide native checkbox, style the label */
}

.lfg-day-chip.checked {
  background: rgba(201,150,26,0.2);
  border-color: var(--be-gold);
  color: var(--be-gold);
}

/* Time dropdowns */
.lfg-time-select {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  padding: 0.6rem 0.85rem;
  min-height: 48px;
  background: var(--be-bg-2);
  border: 1px solid rgba(201,150,26,0.3);
  color: var(--be-ink);
  border-radius: 8px;
}

/* Role select */
.lfg-role-select {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  padding: 0.6rem 0.85rem;
  min-height: 48px;
}

/* Field labels */
.lfg-field-label {
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  color: var(--be-gold);
  display: block;
  margin-bottom: 0.4rem;
}

/* Submit button */
.df-lfg-btn {
  font-size: 1.1rem;
  padding: 0.85rem 2rem;
  min-height: 52px;
}
```

---

## Fix 7 — Note field on hover card

The note field from the LFG post must appear in the hover card.

In the hover card JSX, add after the role blocks:
```tsx
{hoveredPost.notes && (
  <div className="lfg-hover-note">
    <span className="lfg-hover-note-label">Note:</span>
    <p className="lfg-hover-note-text">{hoveredPost.notes}</p>
  </div>
)}
```

```css
.lfg-hover-note {
  border-top: 1px solid rgba(201,150,26,0.15);
  padding-top: 0.75rem;
  margin-top: 0.25rem;
}

.lfg-hover-note-label {
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  color: var(--be-gold);
  text-transform: uppercase;
  display: block;
  margin-bottom: 0.25rem;
}

.lfg-hover-note-text {
  font-family: 'Spectral', serif;
  font-style: italic;
  font-size: 0.95rem;
  color: var(--be-ink);
  line-height: 1.5;
  margin: 0;
}
```

---

## Fix 8 — Clicking LFG card goes to dungeon page with LFG featured at top

When a user clicks anywhere on an LFG card, navigate to:
/dungeons/[slug]?lfg=[post-id]

```tsx
<div
  className="lfg-big-card"
  style={{ cursor: 'pointer' }}
  onClick={() => router.push(`/dungeons/${post.dungeon_slug}?lfg=${post.id}`)}
  onMouseEnter={(e) => handleLFGHover(e, post.id)}
  onMouseLeave={() => setHoveredLFG(null)}
>
```

On the dungeon page (app/(public)/dungeons/[slug]/page.tsx):
Read the lfg search param. If present, fetch that specific LFG post
and render it prominently at the TOP of the page above all other content.

```tsx
// In page.tsx or client component:
const searchParams = useSearchParams();
const lfgId = searchParams.get('lfg');
const { data: featuredLFG } = lfgId
  ? await supabaseAdmin.from('dungeon_lfg').select('*').eq('id', lfgId).single()
  : { data: null };
```

When featuredLFG exists, show at top:
```tsx
{featuredLFG && (
  <div className="dungeon-featured-lfg">
    <h2 className="dungeon-featured-title">Active Call for This Dungeon</h2>
    {/* Full LFG card with names, roles, note, window */}
    <LFGBigCard post={featuredLFG} />
    <button
      className="dungeon-join-btn"
      onClick={() => setShowJoinForm(true)}
    >
      Answer the Call
    </button>
  </div>
)}
```

Hide the normal "Raise the Banner" form section by default when
lfgId is present. Replace it with:
```tsx
{!showJoinForm && (
  <button
    className="dungeon-own-run-btn"
    onClick={() => setShowJoinForm(true)}
  >
    Schedule your own run instead?
  </button>
)}
{showJoinForm && <RaiseTheBannerForm dungeonSlug={dungeon.id} />}
```

```css
.dungeon-featured-lfg {
  background: rgba(201,150,26,0.07);
  border: 2px solid rgba(201,150,26,0.4);
  border-radius: 14px;
  padding: 2rem;
  margin-bottom: 2.5rem;
}

.dungeon-featured-title {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--be-gold);
  margin-bottom: 1.25rem;
}

.dungeon-join-btn {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  letter-spacing: 0.1em;
  background: var(--be-gold);
  color: #1a1208;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 2rem;
  cursor: pointer;
  margin-top: 1rem;
  display: block;
  width: 100%;
  text-align: center;
}

.dungeon-own-run-btn {
  font-family: 'Spectral', serif;
  font-style: italic;
  font-size: 0.9rem;
  color: var(--be-muted);
  background: none;
  border: 1px solid rgba(138,122,90,0.3);
  border-radius: 8px;
  padding: 0.6rem 1.25rem;
  cursor: pointer;
  transition: color 150ms ease;
}

.dungeon-own-run-btn:hover {
  color: var(--be-gold);
  border-color: rgba(201,150,26,0.4);
}
```

---

## Verification

1. "Your Level" note reads "Click Your Level again to see all dungeons."
2. Hovering any LFG card on any page shows the large hover card
3. Hover card includes note field if present
4. Cancel button on cards lets creator remove the post
5. Edit button opens inline form with current values
6. Expiry is calculated from user's time_end selection
7. ActiveLFGCalls visible on /dashboard and /my-roster after page load
8. Timezone text is large, bold, gold and impossible to miss
9. Day checkboxes and time dropdowns are large with easy click targets
10. Clicking an LFG card navigates to /dungeons/[slug]?lfg=[id]
11. That URL shows the LFG post at top of dungeon page
12. "Raise the Banner" form hidden by default, revealed by "Schedule your own run" button

## Do not touch
- /recruit page
- Oath cinematic
- animation-fill-mode: both on all animations
