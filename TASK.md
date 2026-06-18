# TASK: LFG layout + answer the call + Hall placement

---

## Fix 1 — /dungeons: Active LFG Calls fills the FULL WIDTH above the dungeon grid

Currently the LFG calls are in a narrow sidebar column.
They must occupy the ENTIRE width above the level selector and dungeon grid.
4 columns wide (matching the 4-column dungeon grid), 2 rows maximum,
then scroll internally.

Remove the sidebar layout entirely. Replace with a full-width block:

```tsx
{/* FULL WIDTH LFG section — above the level selector */}
{activeLFG.length > 0 && (
  <section className="df-lfg-full-section">
    <h2 className="df-lfg-full-title">Active LFG Calls</h2>
    <div className="df-lfg-full-grid">
      {activeLFG.map(post => (
        <LFGMiniCard
          key={post.id}
          post={post}
          onHoverEnter={handleLFGHover}
          onHoverLeave={() => setHoveredLFG(null)}
          onClick={() => router.push(`/dungeons/${post.dungeon_slug}?lfg=${post.id}`)}
        />
      ))}
    </div>
  </section>
)}

{/* Level selector + continent tabs + dungeon grid below */}
<div className="df-level-selector">...</div>
```

```css
.df-lfg-full-section {
  width: 100%;
  margin-bottom: 1.5rem;
}

.df-lfg-full-title {
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--be-gold);
  margin-bottom: 0.75rem;
}

.df-lfg-full-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);  /* match dungeon grid columns */
  gap: 0.75rem;
  max-height: calc(2 * 150px + 0.75rem);
  overflow-y: auto;
}

@media (max-width: 900px) {
  .df-lfg-full-grid { grid-template-columns: repeat(2, 1fr); }
}
```

---

## Fix 2 — My Roster: remove secondary scroll on Active Dungeon Calls

The Active Dungeon Calls section on My Roster has its own scroll bar
inside the section. Remove any max-height and overflow from the
LFG grid container specifically on My Roster:

```css
/* My Roster LFG strip — no internal scroll, let page scroll */
.roster-lfg-strip .roster-lfg-row {
  max-height: none;
  overflow: visible;
}
```

Or apply a `variant="roster"` prop to ActiveLFGCalls that skips
the max-height constraint:

```tsx
<ActiveLFGCalls
  posts={activeLFG}
  variant="roster"  /* no internal scroll */
/>
```

```ts
// In ActiveLFGCalls:
const maxHeight = variant === 'roster' ? 'none' : 'calc(2 * 150px + 0.75rem)';
```

---

## Fix 3 — Answer the Call: fix link + add character assignment

### A — Fix "ANSWER THE CALL" link going to wrong URL
Find the green "ANSWER THE CALL" text/button in the LFG card.
It must navigate to /dungeons/[slug]?lfg=[id], not /dungeons/[slug].

```tsx
// Wrong:
<Link href={`/dungeons/${post.dungeon_slug}`}>Answer the Call</Link>

// Correct:
<Link href={`/dungeons/${post.dungeon_slug}?lfg=${post.id}`}>
  Answer the Call
</Link>
```

Find every instance of this link and ensure the ?lfg= param is included.

### B — Add character assignment on the dungeon page

When a user views /dungeons/[slug]?lfg=[id] and they are NOT the
post owner, show clickable NEED slots that let them assign a character.

Each NEED slot becomes a button. Clicking it opens an inline dropdown:

```tsx
const NeedSlot = ({ role, postId, currentNames, userChars }) => {
  const [assigning, setAssigning] = useState(false);
  const [selectedChar, setSelectedChar] = useState('');

  if (currentNames?.length >= roleMax) {
    return <span className="lfg-slot-name">{currentNames[idx]}</span>;
  }

  return assigning ? (
    <div className="lfg-assign-form">
      <select
        value={selectedChar}
        onChange={e => setSelectedChar(e.target.value)}
        className="lfg-assign-select"
      >
        <option value="">Choose character...</option>
        {userChars.map(c => (
          <option key={c.id} value={c.id}>
            {c.name} (Lvl {c.level} {c.class})
          </option>
        ))}
      </select>
      <button
        className="lfg-assign-confirm"
        disabled={!selectedChar}
        onClick={() => handleAssign(postId, role, selectedChar)}
      >
        Join
      </button>
      <button className="lfg-assign-cancel" onClick={() => setAssigning(false)}>
        Back
      </button>
    </div>
  ) : (
    <button
      className="lfg-slot-need-btn"
      onClick={() => setAssigning(true)}
    >
      NEED — Click to Join
    </button>
  );
};
```

The default selected character is the user's main:
```ts
const defaultChar = userChars.find(c => c.is_main) ?? userChars[0];
useEffect(() => {
  if (defaultChar) setSelectedChar(defaultChar.id);
}, [defaultChar]);
```

### C — API: PATCH /api/dungeons/lfg/[id]/join

```ts
export async function PATCH(req, { params }) {
  const { role, characterId, characterName } = await req.json();
  // role: 'tank' | 'healer' | 'dps'

  const { data: post } = await supabaseAdmin
    .from('dungeon_lfg')
    .select('current_group')
    .eq('id', params.id)
    .single();

  const group = post.current_group;
  const roleKey = role.toLowerCase();

  // Check slot availability
  const max = roleKey === 'dps' ? 3 : 1;
  if ((group[roleKey]?.length ?? 0) >= max) {
    return Response.json({ error: 'Slot full' }, { status: 400 });
  }

  group[roleKey] = [...(group[roleKey] ?? []), characterName];

  await supabaseAdmin
    .from('dungeon_lfg')
    .update({ current_group: group })
    .eq('id', params.id);

  // Also record in dungeon_lfg_responses as 'accepted'
  await supabaseAdmin
    .from('dungeon_lfg_responses')
    .upsert({
      lfg_id: params.id,
      user_id: userId,
      response: 'accepted',
      character_name: characterName,
    });

  return Response.json({ success: true, group });
}
```

```css
.lfg-slot-need-btn {
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  color: #ff4400;
  font-weight: 700;
  background: rgba(255,68,0,0.08);
  border: 1px solid rgba(255,68,0,0.3);
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: all 150ms ease;
  letter-spacing: 0.05em;
}
.lfg-slot-need-btn:hover {
  background: rgba(255,68,0,0.15);
  border-color: rgba(255,68,0,0.6);
}

.lfg-assign-form {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.lfg-assign-select {
  font-family: 'Spectral', serif;
  font-size: 0.85rem;
  padding: 0.4rem 0.5rem;
  background: var(--be-bg-2);
  border: 1px solid rgba(201,150,26,0.3);
  color: var(--be-ink);
  border-radius: 6px;
}
.lfg-assign-confirm {
  background: var(--be-gold);
  color: #1a1208;
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  padding: 0.35rem 0.85rem;
  cursor: pointer;
}
.lfg-assign-confirm:disabled {
  opacity: 0.4;
  cursor: default;
}
.lfg-assign-cancel {
  background: none;
  border: none;
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  color: var(--be-muted);
  cursor: pointer;
  padding: 0;
}
```

---

## Fix 4 — Hall page: compact LFG block moves ABOVE Upcoming

The compact LFG mini box must be visible without scrolling.
It replaces the space currently occupied by Upcoming in the right column.
Upcoming moves below it.

New right column order (top to bottom):
1. Stat tiles (Your Characters, Guildies on Site) — unchanged
2. Active LFG Calls compact box (if posts exist)
3. Upcoming calendar

```tsx
{/* Right column */}
<div className="hall-right-col">
  <StatTiles yourChars={yourChars} guildies={guildies} />

  {activeLFG.length > 0 && (
    <div className="hall-lfg-compact">
      <h3 className="hall-lfg-compact-title">Active Dungeon Calls</h3>
      {activeLFG.slice(0, 4).map(post => (
        <LFGMiniCard key={post.id} post={post} ... />
      ))}
    </div>
  )}

  <Upcoming events={events} />
</div>
```

The compact box uses the same LFGMiniCard as everywhere else.
Max 4 cards shown (scroll within the box if more).
When no active posts: Upcoming sits directly below stat tiles as before.

---

## Verification

1. /dungeons: LFG Calls span the FULL WIDTH above the dungeon grid, 4 columns
2. My Roster: no secondary scrollbar, page scrolls normally through all cards
3. "ANSWER THE CALL" link goes to /dungeons/[slug]?lfg=[id] everywhere
4. On that page, NEED slots are clickable buttons
5. Clicking NEED opens a character dropdown defaulting to user's main
6. Selecting a character and clicking Join updates the group roster
7. Character name appears in the slot after joining
8. Hall compact LFG box appears ABOVE Upcoming, below stat tiles
9. Hall compact LFG box only renders when posts exist
10. When no posts: Upcoming is directly below stat tiles (no empty space)

## Do not touch
- /recruit page
- Oath cinematic
- animation-fill-mode: both on all animations
