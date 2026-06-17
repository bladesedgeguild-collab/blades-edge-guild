# TASK: LFG display overhaul + dungeon page width + role icons + names

---

## Fix 1 — "Requires Level X" gold pill on locked cards

On dungeon cards where status === 'locked' (level too high for player),
replace the current lost-in-the-gray text with a gold filled pill:

```tsx
{status === 'locked' && (
  <div className="df-requires-pill">
    Requires Level {dungeon.recommendedLevelMin}
  </div>
)}
```

```css
.df-requires-pill {
  display: inline-block;
  background: var(--be-gold);
  color: #1a1208;
  font-family: 'Cinzel', serif;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
  margin-top: 0.5rem;
}
```

---

## Fix 2 — Wider layout on individual dungeon pages + Raise the Banner

Find the container class/max-width on:
- app/(public)/dungeons/[slug]/page.tsx
- Any raise-the-banner or LFG form page/modal

Apply the same wide container class used by the Dungeon Finder grid page.
Also increase all font sizes on the dungeon detail page to match
the larger sizes on the grid cards (same doubling applied in previous task).

---

## Fix 3 — Server time display: say "Server Time" not "MT"

Find every instance of "MT" in the time display and LFG form.
Replace with "Server Time":

- "9:00 AM MT" becomes "9:00 AM Server Time"
- "Server Time (Mountain)" becomes "Server Time"
- The comparison line: "9:00 AM Server Time is X in your local time."

Also fix the timezone comparison logic. If the user's detected timezone
IS Mountain Time (America/Denver or America/Phoenix), the comparison
should still show but say:
"9:00 AM Server Time is 9:00 AM in your local time (same timezone)."

Do not skip the comparison when timezones match. Show it always.

---

## Fix 4 — Active LFG Calls: show on Hall AND My Roster

The LFG calls block is only appearing on the Dungeons page.
Add it to:
- Hall/dashboard page (app/(member)/dashboard/page.tsx)
- My Roster page (app/(member)/my-roster/page.tsx)

Extract the LFG block into a shared component:
```
components/ActiveLFGCalls.tsx
```

Import and render it in all three pages. It queries the same
dungeon_lfg table with service role client.

---

## Fix 5 + 7 — LFG block: MUCH larger, show names not numbers

The entire LFG block needs to be significantly larger and more prominent.
Each active call should be a large card.

### Data: store player names per role slot
When a LFG post is created, store the requester in the appropriate slot.
When others accept, add their name to the slot.

Update current_group to store names:
```ts
// Initial submission (requester counts as their own role):
const initial_group = {
  tank: role === 'Tank' ? [characterName] : [],
  healer: role === 'Healer' ? [characterName] : [],
  dps: role === 'DPS' || role === 'Flex' ? [characterName] : [],
};
// Store as jsonb: {"tank":["Åvatarødys"],"healer":[],"dps":["Åvatarødys"]}
```

Update the INSERT to use this structure:
```ts
current_group: {
  tank: role === 'Tank' ? [characterName] : [],
  healer: role === 'Healer' ? [characterName] : [],
  dps: (role === 'DPS' || role === 'Flex') ? [characterName] : [],
}
```

When someone accepts, append their name to the right array via:
```ts
// In the respond API route, on 'accepted':
const newGroup = { ...post.current_group };
const roleKey = acceptorRole === 'Tank' ? 'tank'
  : acceptorRole === 'Healer' ? 'healer' : 'dps';
newGroup[roleKey] = [...(newGroup[roleKey] || []), acceptorCharName];
await supabase.from('dungeon_lfg')
  .update({ current_group: newGroup })
  .eq('id', post.id);
```

### Large card display

```tsx
<div className="lfg-big-card">
  {/* Dungeon name — very large */}
  <h2 className="lfg-big-dungeon">
    {formatDungeonName(post.dungeon_slug)}
  </h2>

  {/* Caller + window */}
  <div className="lfg-big-meta">
    <span>{post.character_name} is calling for a group</span>
    {formatWindow(post) && <span>{formatWindow(post)}</span>}
  </div>

  {/* Role slots */}
  <div className="lfg-big-roles">

    {/* Tank — 1 slot */}
    <div className="lfg-role-block">
      <div className="lfg-role-header">
        <span className="lfg-role-icon">🛡</span>
        <span className="lfg-role-label">Tank</span>
      </div>
      <div className="lfg-role-slot">
        {post.current_group.tank?.[0]
          ? <span className="lfg-slot-name">{post.current_group.tank[0]}</span>
          : <span className="lfg-slot-need">NEED</span>
        }
      </div>
    </div>

    {/* Healer — 1 slot */}
    <div className="lfg-role-block">
      <div className="lfg-role-header">
        <span className="lfg-role-icon">✚</span>
        <span className="lfg-role-label">Healer</span>
      </div>
      <div className="lfg-role-slot">
        {post.current_group.healer?.[0]
          ? <span className="lfg-slot-name">{post.current_group.healer[0]}</span>
          : <span className="lfg-slot-need">NEED</span>
        }
      </div>
    </div>

    {/* DPS — 3 slots */}
    <div className="lfg-role-block lfg-role-block--dps">
      <div className="lfg-role-header">
        <span className="lfg-role-icon">⚔</span>
        <span className="lfg-role-label">DPS</span>
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} className="lfg-role-slot">
          <span className="lfg-dps-label">DPS {i + 1}:</span>
          {post.current_group.dps?.[i]
            ? <span className="lfg-slot-name">{post.current_group.dps[i]}</span>
            : <span className="lfg-slot-need">NEED</span>
          }
        </div>
      ))}
    </div>

  </div>

  <Link href={`/dungeons/${post.dungeon_slug}`} className="lfg-big-link">
    Answer the Call
  </Link>
</div>
```

```css
.lfg-big-card {
  background: var(--be-bg-2);
  border: 1px solid rgba(201,150,26,0.35);
  border-radius: 14px;
  padding: 1.75rem 2rem;
  margin-bottom: 1.25rem;
}

.lfg-big-dungeon {
  font-family: 'Cinzel Decorative', serif;
  font-size: clamp(1.4rem, 2.5vw, 2.2rem);
  color: var(--be-gold);
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

.lfg-big-meta {
  font-family: 'Spectral', serif;
  font-size: 1rem;
  color: var(--be-muted);
  font-style: italic;
  margin-bottom: 1.25rem;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.lfg-big-roles {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.lfg-role-block {
  background: var(--be-bg-1);
  border: 1px solid rgba(201,150,26,0.2);
  border-radius: 10px;
  padding: 0.85rem 1rem;
}

.lfg-role-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.lfg-role-icon {
  font-size: 1.2rem;
}

.lfg-role-label {
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--be-gold);
}

.lfg-role-slot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
}

.lfg-dps-label {
  color: var(--be-muted);
  font-size: 0.8rem;
  min-width: 48px;
}

.lfg-slot-name {
  color: var(--be-ink);
  font-weight: 600;
}

.lfg-slot-need {
  color: #ff4400;
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
}

.lfg-big-link {
  font-family: 'Cinzel', serif;
  font-size: 0.82rem;
  letter-spacing: 0.12em;
  color: var(--be-portal);
  text-decoration: none;
  text-transform: uppercase;
}
```

---

## Fix 6 — Role icons: more distinct, better contrast

Replace emoji icons with SVG icons that are clearly distinct:

Tank (shield with a plus/cross): 🛡 — keep but make sure it renders large
Healer (cross/plus): ✚ — use a distinct plus sign
DPS (single sword pointing up, not crossed): ⚔ or a single blade

Actually use these Unicode characters that render better:
- Tank: ⊕ or custom SVG shield
- Healer: ✙ (heavy Greek cross)
- DPS: ⚔ (crossed swords)

Better: use inline SVG for each:

```tsx
const TankIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 1L2 5v6c0 4.5 3.3 8.7 8 9.9C14.7 19.7 18 15.5 18 11V5L10 1z"
      stroke="currentColor" strokeWidth="1.5" fill="rgba(201,150,26,0.2)" />
    <line x1="10" y1="6" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const HealerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="8" y="2" width="4" height="16" rx="2" fill="currentColor" opacity="0.85"/>
    <rect x="2" y="8" width="16" height="4" rx="2" fill="currentColor" opacity="0.85"/>
  </svg>
);

const DPSIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <line x1="4" y1="16" x2="16" y2="4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M14 3l3 0 0 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 17l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
```

Apply these in the role blocks. Tank gets gold color, Healer gets
portal green, DPS gets mage blue so they are all visually distinct.

---

## Verification

1. Locked cards show a gold filled pill "Requires Level X" clearly visible
2. Individual dungeon pages use the same wide layout as the grid
3. LFG form says "Server Time" everywhere, not MT
4. Timezone comparison shows even when user is Mountain Time
5. ActiveLFGCalls component renders on Hall AND My Roster
6. LFG cards are large. Dungeon name is headline-sized (1.4-2.2rem)
7. Tank/Healer/DPS show names, not numbers
8. Requester's name already fills their role slot on creation
9. Empty slots say NEED in bold orange/red
10. SVG role icons are clearly distinct and colored differently

## SQL to run after deploy
```sql
-- current_group is already jsonb, no migration needed
-- Just ensure the INSERT logic in the API stores names not counts
```

## Do not touch
- /recruit page
- Oath cinematic
- animation-fill-mode: both on all animations
