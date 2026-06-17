# TASK: LFG system fixes + time window form + dungeon page alerts

---

## Fix 1 — Remove em dash from dungeon page tagline

Find the text:
"Every den of darkness, every vault of peril — sorted for your level."

Change to:
"Every den of darkness, every vault of peril. Sorted for your level."

Also grep the entire codebase for em dashes (—) in string literals
and JSX text content. Replace each one with a period, comma, or
restructured sentence. Do not use semicolons or colons as replacements.

```bash
grep -rn "—" app/ components/ src/ --include="*.tsx" --include="*.ts"
```

Fix every result found.

---

## Fix 2 — Hall page: show ALL active LFG posts to ALL logged-in users

The current Hall LFG block is either not rendering or showing
"Dungeon sign-ups coming soon." Fix both issues.

### Query fix
Use the service role client to bypass RLS for reading LFG posts.
The read policy allows anyone to view active posts, but the client
may need service role for server-side rendering:

```ts
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const { data: activeLFG, error } = await supabaseAdmin
  .from('dungeon_lfg')
  .select('*')
  .gt('expires_at', new Date().toISOString())
  .order('created_at', { ascending: false });

// Log error to confirm if table issue or query issue
if (error) console.error('LFG query error:', error);
```

### Show ALL posts to ALL logged-in users
Remove any level-matching filter from the Hall display.
Everyone who is logged in sees all active LFG posts.
Level matching is only used for the top-of-site red banner.

### Remove "Dungeon sign-ups coming soon"
Find and delete this placeholder text entirely.

---

## Fix 3 — Upcoming section: store structured time windows

### DB migration (run after deploy)
```sql
ALTER TABLE public.dungeon_lfg
  ADD COLUMN IF NOT EXISTS days_available text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS time_start text,
  ADD COLUMN IF NOT EXISTS time_end text,
  ADD COLUMN IF NOT EXISTS timezone_label text;
```

### Form changes on dungeon page

Replace the free-text "available_window" input with structured fields:

```tsx
{/* Server time display */}
<div className="lfg-server-time">
  <span className="lfg-server-label">Server Time (Mountain):</span>
  <span className="lfg-server-value" id="server-time-display" />
  <script dangerouslySetInnerHTML={{ __html: `
    function updateServerTime() {
      const now = new Date();
      const mt = now.toLocaleTimeString('en-US', {
        timeZone: 'America/Denver',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      const el = document.getElementById('server-time-display');
      if (el) el.textContent = mt + ' MT';
    }
    updateServerTime();
    setInterval(updateServerTime, 10000);
  `}} />
</div>

{/* Day selector */}
<div className="lfg-days">
  <label className="lfg-field-label">Day(s) Available</label>
  <div className="lfg-day-checkboxes">
    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
      <label key={day} className="lfg-day-chip">
        <input
          type="checkbox"
          value={day}
          checked={selectedDays.includes(day)}
          onChange={e => toggleDay(day)}
        />
        {day}
      </label>
    ))}
    <label className="lfg-day-chip lfg-day-any">
      <input
        type="checkbox"
        checked={anyDay}
        onChange={e => { setAnyDay(e.target.checked); setSelectedDays([]); }}
      />
      Any Day
    </label>
  </div>
</div>

{/* Time window */}
<div className="lfg-time-row">
  <div className="lfg-field">
    <label className="lfg-field-label">Start Time (Server/MT)</label>
    <select value={timeStart} onChange={e => setTimeStart(e.target.value)}>
      <option value="">Select...</option>
      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
  </div>
  <span className="lfg-time-to">to</span>
  <div className="lfg-field">
    <label className="lfg-field-label">End Time (Server/MT)</label>
    <select value={timeEnd} onChange={e => setTimeEnd(e.target.value)}>
      <option value="">Select...</option>
      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
  </div>
</div>

{/* Timezone detection */}
<div className="lfg-timezone">
  <span className="lfg-tz-label">Your timezone:</span>
  <span className="lfg-tz-value">{detectedTimezone}</span>
  {localTimeEquivalent && (
    <span className="lfg-tz-equiv">
      That is {localTimeEquivalent} in your local time.
    </span>
  )}
</div>
```

TIME_OPTIONS array (every 30 minutes, 12am to 11:30pm):
```ts
const TIME_OPTIONS = Array.from({length: 48}, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m} ${ampm}`;
});
```

Timezone detection:
```ts
const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Calculate local equivalent of selected server start time
const getLocalEquivalent = (serverTimeStr: string) => {
  if (!serverTimeStr) return null;
  // Parse the MT time and convert to user's local
  const today = new Date().toDateString();
  const mtDate = new Date(`${today} ${serverTimeStr} MST`);
  return mtDate.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: detectedTimezone
  });
};
```

### Confirmation screen timezone emphasis
After submission, show a confirmation that includes:
```tsx
<div className="lfg-confirm-time">
  <strong>Your window:</strong>{' '}
  {days} from {timeStart} to {timeEnd} Server Time (Mountain)
  <br/>
  <span className="lfg-confirm-local">
    That is {localStart} to {localEnd} in your timezone ({detectedTimezone}).
  </span>
</div>
```

### Display format for LFG posts
Build a human-readable window string from the structured fields:
```ts
const formatWindow = (post: LFGPost) => {
  const days = post.days_available?.length
    ? post.days_available.join(', ')
    : 'Any day';
  if (post.time_start && post.time_end)
    return `${days}, ${post.time_start}–${post.time_end} Server Time`;
  return days;
};
```

---

## Fix 4 — Dungeons page: active LFG box top-right

On the /dungeons page, add a fixed-position or sticky box in the
top-right area of the page showing active LFG requests.

Position it to the right of the "DUNGEON FINDER" heading and
"Showing dungeons for level" controls.

```tsx
<div className="df-lfg-sidebar">
  <h3 className="df-lfg-sidebar-title">
    Active Calls
  </h3>
  {activeLFG.length === 0 ? (
    <p className="df-lfg-sidebar-empty">No active calls right now.</p>
  ) : (
    activeLFG.map(post => (
      <div key={post.id} className="df-lfg-sidebar-post">
        <span className="df-lfg-sidebar-dungeon">
          {formatDungeonName(post.dungeon_slug)}
        </span>
        <span className="df-lfg-sidebar-caller">
          {post.character_name} as {post.role}
        </span>
        <span className="df-lfg-sidebar-window">
          {formatWindow(post)}
        </span>
        <div className="df-lfg-sidebar-group">
          T: {post.current_group.tank}/1
          H: {post.current_group.healer}/1
          D: {post.current_group.dps}/3
        </div>
        <Link href={`/dungeons/${post.dungeon_slug}`} className="df-lfg-sidebar-link">
          View
        </Link>
      </div>
    ))
  )}
</div>
```

```css
.df-lfg-sidebar {
  background: rgba(201, 150, 26, 0.08);
  border: 2px solid rgba(201, 150, 26, 0.5);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  min-width: 240px;
  max-width: 300px;
}

.df-lfg-sidebar-title {
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--be-gold);
  margin-bottom: 0.75rem;
}

.df-lfg-sidebar-post {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.6rem 0;
  border-top: 1px solid rgba(201,150,26,0.15);
}

.df-lfg-sidebar-dungeon {
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  color: var(--be-gold);
}

.df-lfg-sidebar-caller,
.df-lfg-sidebar-window {
  font-family: 'Spectral', serif;
  font-size: 0.78rem;
  color: var(--be-muted);
  font-style: italic;
}

.df-lfg-sidebar-group {
  font-family: 'Cinzel', serif;
  font-size: 0.68rem;
  color: var(--be-muted);
  display: flex;
  gap: 0.5rem;
}

.df-lfg-sidebar-link {
  font-family: 'Cinzel', serif;
  font-size: 0.68rem;
  color: var(--be-portal);
  text-decoration: none;
  letter-spacing: 0.08em;
}

.df-lfg-sidebar-empty {
  font-family: 'Spectral', serif;
  font-style: italic;
  font-size: 0.8rem;
  color: var(--be-muted);
}
```

Make the dungeon finder header row a flex layout:
```css
.df-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.df-header-left { flex: 1; }
```

---

## Verification

1. No em dashes anywhere in the codebase (grep confirms zero results)
2. Dungeon tagline reads "Every den of darkness, every vault of peril. Sorted for your level."
3. Hall page shows all active LFG posts to all logged-in users
4. "Dungeon sign-ups coming soon" text is gone
5. LFG form has day checkboxes and time dropdowns instead of free text
6. Server time (Mountain) displays live on the form
7. User's timezone detected and shown with local equivalent
8. Confirmation screen shows both server time and local time
9. Dungeons page shows active calls box in top-right area
10. Active calls update when new LFG posts are submitted

## SQL to run after deploy
```sql
ALTER TABLE public.dungeon_lfg
  ADD COLUMN IF NOT EXISTS days_available text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS time_start text,
  ADD COLUMN IF NOT EXISTS time_end text,
  ADD COLUMN IF NOT EXISTS timezone_label text;
```

## Do not touch
- /recruit page
- Oath cinematic
- animation-fill-mode: both on all animations
