# TASK: LFG fixes — delete post, needs text, force render on dashboard + my-roster, bigger shield

---

## Fix 1 — Shield icon: bigger, more clearly a shield

Find the TankIcon SVG component. Replace with a larger, more distinct
shield shape. The shield should be immediately recognizable:

```tsx
const TankIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2L3 6.5v6C3 17.5 7 21.5 12 23c5-1.5 9-5.5 9-10.5v-6L12 2z"
      fill="rgba(201,150,26,0.25)"
      stroke="#c9961a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M12 7v10M8 12h8"
      stroke="#c9961a"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
```

Render TankIcon at size={32} in the role blocks (was 20).
Render HealerIcon at size={32}.
Render DPSIcon at size={32}.

---

## Fix 2 — Delete LFG post: creator or admin

### API route: DELETE /api/dungeons/lfg/[id]
```ts
// app/api/dungeons/lfg/[id]/route.ts
export async function DELETE(req, { params }) {
  const supabase = createServerClient(/* auth */);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const post = await supabaseAdmin
    .from('dungeon_lfg').select('user_id').eq('id', params.id).single();

  const userRecord = await supabaseAdmin
    .from('users').select('role').eq('id', user.id).single();

  const isOwner = post.data?.user_id === user.id;
  const isAdmin = ['admin','officer','gm'].includes(userRecord.data?.role);

  if (!isOwner && !isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  await supabaseAdmin.from('dungeon_lfg').delete().eq('id', params.id);
  return Response.json({ success: true });
}
```

### Delete button on each LFG card
Show the delete button only if the viewer is the creator or an admin:

```tsx
{(isOwner || isAdmin) && (
  <button
    className="lfg-delete-btn"
    onClick={() => handleDelete(post.id)}
    title="Remove this LFG post"
  >
    ✕ Remove
  </button>
)}
```

```css
.lfg-delete-btn {
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: rgba(255,80,50,0.7);
  background: none;
  border: 1px solid rgba(255,80,50,0.3);
  border-radius: 6px;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  transition: all 150ms ease;
  margin-top: 0.5rem;
}
.lfg-delete-btn:hover {
  color: #ff5032;
  border-color: rgba(255,80,50,0.7);
}
```

After delete, refresh the LFG list.

---

## Fix 3 — LFG post text: role first, then needs

Change "NAME is seeking more as DPS" to the new format.

### Needs calculation function
```ts
const getNeedsText = (group: { tank: string[]; healer: string[]; dps: string[] }) => {
  const needsTank = !group.tank || group.tank.length === 0;
  const needsHealer = !group.healer || group.healer.length === 0;
  const needsDPS = !group.dps || group.dps.length < 3;

  if (!needsTank && !needsHealer && !needsDPS) return 'Group is Full!';

  const needs: string[] = [];
  if (needsTank) needs.push('Tank');
  if (needsHealer) needs.push('Heals');
  if (needsDPS) needs.push('DPS');

  if (needs.length === 3) return 'Needs All.';
  if (needs.length === 1) return `Needs ${needs[0]} then Good To Go.`;
  return `Needs ${needs[0]} and ${needs[1]}.`;
};
```

### New display format
```tsx
<div className="lfg-big-meta">
  <strong>{post.role} {post.character_name}</strong> is seeking more.{' '}
  <span className="lfg-needs-text">{getNeedsText(post.current_group)}</span>
</div>
```

```css
.lfg-needs-text {
  color: #ff8c00;
  font-weight: 700;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  letter-spacing: 0.05em;
}
```

Apply this text format everywhere LFG posts are displayed:
Hall page, My Roster, Dungeons page sidebar, and the top banner.

---

## Fix 4 — FORCE ActiveLFGCalls onto dashboard and my-roster

This has been requested multiple times and not appeared.
The following steps are MANDATORY. Do not skip any.

### Step A — Verify the component exists
```bash
find . -name "ActiveLFGCalls*" -not -path "*/node_modules/*"
```

If the file does NOT exist, create it at:
`components/ActiveLFGCalls.tsx`

If it DOES exist, print its full contents and verify it:
- Has a default export
- Actually fetches from dungeon_lfg table
- Renders visible content when posts exist AND when empty

### Step B — Component must show even when empty
The component must ALWAYS render a visible container, not return null:

```tsx
export default function ActiveLFGCalls({ posts }: { posts: LFGPost[] }) {
  return (
    <section className="active-lfg-section">
      <h2 className="active-lfg-heading">Active Dungeon Calls</h2>
      {posts.length === 0 ? (
        <p className="active-lfg-empty">
          No active dungeon calls right now. Be the first to Raise the Banner.
        </p>
      ) : (
        posts.map(post => <LFGBigCard key={post.id} post={post} />)
      )}
    </section>
  );
}
```

### Step C — Import and render on dashboard
Open app/(member)/dashboard/page.tsx.

1. At the top, import: `import ActiveLFGCalls from '@/components/ActiveLFGCalls'`
2. In the server component, fetch LFG data:
```ts
const { data: activeLFG } = await supabaseAdmin
  .from('dungeon_lfg')
  .select('*')
  .gt('expires_at', new Date().toISOString())
  .order('created_at', { ascending: false });
```
3. In the JSX, place the component directly below the stat tiles:
```tsx
{/* Stat tiles row */}
<div className="hall-stats-row">
  {/* Your Characters tile */}
  {/* Guildies on Site tile */}
</div>

{/* Active LFG — MUST appear here */}
<ActiveLFGCalls posts={activeLFG ?? []} />
```

### Step D — Import and render on my-roster
Open app/(member)/my-roster/page.tsx.

1. At the top, import: `import ActiveLFGCalls from '@/components/ActiveLFGCalls'`
2. Fetch LFG data same as above.
3. In the JSX, place the component at the bottom of the page,
   below the alts grid:
```tsx
<ActiveLFGCalls posts={activeLFG ?? []} />
```

### Step E — Verify with grep before committing
```bash
grep -n "ActiveLFGCalls" app/\(member\)/dashboard/page.tsx
grep -n "ActiveLFGCalls" app/\(member\)/my-roster/page.tsx
```

Both grep commands MUST return at least one result.
If either returns nothing, the component was not added. Add it before committing.

### Step F — Commit message must confirm
The commit message must include:
"ActiveLFGCalls confirmed in dashboard (line X) and my-roster (line X)"

---

## Verification

1. TankIcon is large (32px) and looks like a shield immediately
2. Delete button appears on LFG cards for creator and admins
3. Clicking delete removes the post and refreshes the list
4. LFG text reads "DPS Åvatarødys is seeking more. Needs All."
5. Needs text updates as slots fill: "Needs Heals then Good To Go."
6. Full group shows "Group is Full!"
7. dashboard page at /dashboard shows Active Dungeon Calls section
8. my-roster page shows Active Dungeon Calls section
9. Both show "No active dungeon calls right now." when empty
10. Both show actual posts when the dungeon_lfg table has active rows

## Do not touch
- /recruit page
- Oath cinematic
- animation-fill-mode: both on all animations

---

## Fix 5 — Dungeon grid: "Your Level" filter button

Add a "Your Level" button to the continent filter tab row.
When active, it hides all grayed-out dungeons and shows only
dungeons where the player's effective level is in range.

```tsx
const [showOnlyMyLevel, setShowOnlyMyLevel] = useState(false);

// Add to the existing filter logic:
const filtered = dungeons
  .filter(d => continentFilter === 'All' || d.continent === continentFilter)
  .filter(d => {
    if (!showOnlyMyLevel) return true;
    return getDungeonStatus(d, effectiveLevel) === 'active';
  });
```

Button sits at the end of the continent tab row:
```tsx
<div className="df-tabs">
  <button className={...}>All</button>
  <button className={...}>Eastern Kingdoms</button>
  <button className={...}>Kalimdor</button>
  <button className={...}>Outland</button>

  {/* Separator */}
  <span className="df-tabs-divider" />

  <button
    className={`df-tab df-tab-recommended ${showOnlyMyLevel ? 'active' : ''}`}
    onClick={() => setShowOnlyMyLevel(v => !v)}
  >
    ★ Your Level
  </button>
</div>
```

```css
.df-tabs-divider {
  width: 1px;
  background: rgba(201,150,26,0.2);
  margin: 0 0.25rem;
  align-self: stretch;
}

.df-tab-recommended {
  color: var(--be-portal);
  border-color: rgba(26,255,110,0.3);
}

.df-tab-recommended.active {
  background: rgba(26,255,110,0.12);
  border-color: var(--be-portal);
  color: var(--be-portal);
}
```

When active, the button glows portal green. A subtle label updates
below the sort bar:
```tsx
{showOnlyMyLevel && (
  <p className="df-level-note">
    Showing only dungeons for level {effectiveLevel}.
  </p>
)}
```

---

## Fix 6 — Active LFG card: large hover expansion

When hovering an Active LFG card, expand it to a much larger
overlay showing the full role breakdown clearly.

Use the same `position: fixed` + `getBoundingClientRect()` pattern
used elsewhere on the site so it escapes overflow containers.

```tsx
const [hoveredLFG, setHoveredLFG] = useState<string | null>(null);
const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

const handleLFGHover = (e: React.MouseEvent, postId: string) => {
  const rect = e.currentTarget.getBoundingClientRect();
  setHoverPos({
    x: rect.left + rect.width / 2,
    y: rect.top,
  });
  setHoveredLFG(postId);
};

const hoveredPost = posts.find(p => p.id === hoveredLFG);
```

```tsx
{/* Hover card — renders at root level above everything */}
{hoveredPost && (
  <div
    className="lfg-hover-card"
    style={{
      position: 'fixed',
      left: hoverPos.x,
      top: hoverPos.y - 16,
      transform: 'translate(-50%, -100%)',
      zIndex: 9999,
      pointerEvents: 'none',
    }}
  >
    {/* Dungeon name — very large */}
    <h2 className="lfg-hover-dungeon">
      {formatDungeonName(hoveredPost.dungeon_slug)}
    </h2>

    <p className="lfg-hover-meta">
      {hoveredPost.role} {hoveredPost.character_name} is seeking more.{' '}
      <strong>{getNeedsText(hoveredPost.current_group)}</strong>
    </p>

    {/* Role blocks — large and clear */}
    <div className="lfg-hover-roles">

      <div className="lfg-hover-role">
        <TankIcon size={36} />
        <span className="lfg-hover-role-label">Tank</span>
        {hoveredPost.current_group.tank?.[0]
          ? <span className="lfg-hover-filled">{hoveredPost.current_group.tank[0]}</span>
          : <span className="lfg-hover-need">NEED</span>
        }
      </div>

      <div className="lfg-hover-role">
        <HealerIcon size={36} />
        <span className="lfg-hover-role-label">Healer</span>
        {hoveredPost.current_group.healer?.[0]
          ? <span className="lfg-hover-filled">{hoveredPost.current_group.healer[0]}</span>
          : <span className="lfg-hover-need">NEED</span>
        }
      </div>

      <div className="lfg-hover-role lfg-hover-role--dps">
        <DPSIcon size={36} />
        <span className="lfg-hover-role-label">DPS</span>
        {[0,1,2].map(i => (
          <div key={i} className="lfg-hover-dps-slot">
            <span className="lfg-hover-dps-num">DPS {i+1}</span>
            {hoveredPost.current_group.dps?.[i]
              ? <span className="lfg-hover-filled">{hoveredPost.current_group.dps[i]}</span>
              : <span className="lfg-hover-need">NEED</span>
            }
          </div>
        ))}
      </div>

    </div>

    {hoveredPost.available_window && (
      <p className="lfg-hover-window">{hoveredPost.available_window}</p>
    )}
  </div>
)}
```

```css
.lfg-hover-card {
  background: var(--be-bg-1);
  border: 2px solid rgba(201,150,26,0.5);
  border-radius: 16px;
  padding: 1.75rem 2rem;
  min-width: 420px;
  max-width: 560px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.7),
              0 0 32px rgba(201,150,26,0.1);
  animation: rc-fade-in 0.15s ease both;
  animation-fill-mode: both;
}

.lfg-hover-dungeon {
  font-family: 'Cinzel Decorative', serif;
  font-size: 1.8rem;
  color: var(--be-gold);
  margin-bottom: 0.4rem;
  line-height: 1.2;
}

.lfg-hover-meta {
  font-family: 'Spectral', serif;
  font-size: 1rem;
  color: var(--be-muted);
  font-style: italic;
  margin-bottom: 1.25rem;
}

.lfg-hover-meta strong {
  color: #ff8c00;
  font-style: normal;
}

.lfg-hover-roles {
  display: grid;
  grid-template-columns: 1fr 1fr 1.4fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.lfg-hover-role {
  background: var(--be-bg-2);
  border: 1px solid rgba(201,150,26,0.15);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}

.lfg-hover-role-label {
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--be-gold);
}

.lfg-hover-filled {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  color: var(--be-ink);
  font-weight: 600;
}

.lfg-hover-need {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  color: #ff4400;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.lfg-hover-dps-slot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lfg-hover-dps-num {
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  color: var(--be-muted);
  min-width: 44px;
}

.lfg-hover-window {
  font-family: 'Spectral', serif;
  font-style: italic;
  font-size: 0.85rem;
  color: var(--be-muted);
}
```

Attach the hover handlers to each compact LFG card:
```tsx
<div
  className="lfg-big-card"
  onMouseEnter={(e) => handleLFGHover(e, post.id)}
  onMouseLeave={() => setHoveredLFG(null)}
>
```

