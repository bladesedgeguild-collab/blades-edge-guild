# TASK: LFG polish — calendar badge, server time label, hover notes size

---

## Fix 1 — Calendar badge on all LFG cards

Every LFG card (mini and full) gets a small calendar graphic in the
top-right corner showing two stacked pills:
- Top pill: next upcoming day abbreviation + date (e.g. "TUE 23")
- Bottom pill: countdown until the time window opens

### Calculate the next occurrence

```ts
const getNextOccurrence = (
  daysAvailable: string[],
  timeStart: string
): { label: string; countdown: string } => {
  if (!daysAvailable?.length || daysAvailable.includes('Any') || !timeStart) {
    return { label: 'ANY DAY', countdown: 'Flexible' };
  }

  const DAY_MAP: Record<string, number> = {
    Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6
  };

  const now = new Date();
  // Convert timeStart (e.g. "7:00 PM") to hours/minutes in MT
  const [time, ampm] = timeStart.split(' ');
  const [h, m] = time.split(':').map(Number);
  let hours = h;
  if (ampm === 'PM' && h !== 12) hours += 12;
  if (ampm === 'AM' && h === 12) hours = 0;

  // Find the soonest upcoming day+time in MT
  let soonest: Date | null = null;
  for (const day of daysAvailable) {
    const target = new Date();
    // Set to MT timezone offset (UTC-6 standard, UTC-7 MDT)
    const mtOffset = -6; // adjust for MDT if needed
    const targetDay = DAY_MAP[day];
    if (targetDay === undefined) continue;

    const daysUntil = (targetDay - now.getDay() + 7) % 7;
    target.setDate(target.getDate() + daysUntil);
    target.setHours(hours + Math.abs(mtOffset), m, 0, 0);

    // If same day but time already passed, push to next week
    if (target <= now) target.setDate(target.getDate() + 7);

    if (!soonest || target < soonest) soonest = target;
  }

  if (!soonest) return { label: 'SOON', countdown: '' };

  const dayAbbr = ['SUN','MON','TUE','WED','THU','FRI','SAT'][soonest.getDay()];
  const dateNum = soonest.getDate();
  const label = `${dayAbbr} ${dateNum}`;

  // Countdown
  const diff = soonest.getTime() - now.getTime();
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hrs = totalHours % 24;

  let countdown = '';
  if (days > 0) countdown = `in ${days}d ${hrs}h`;
  else if (hrs > 0) countdown = `in ${hrs}h`;
  else countdown = 'Starting soon';

  return { label, countdown };
};
```

### Calendar badge component

```tsx
const CalendarBadge = ({ daysAvailable, timeStart }: {
  daysAvailable: string[];
  timeStart: string;
}) => {
  const { label, countdown } = getNextOccurrence(daysAvailable, timeStart);

  return (
    <div className="lfg-cal-badge">
      <div className="lfg-cal-day">{label}</div>
      {countdown && (
        <div className="lfg-cal-countdown">{countdown}</div>
      )}
    </div>
  );
};
```

```css
.lfg-cal-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.lfg-cal-day {
  background: var(--be-gold);
  color: #1a1208;
  font-family: 'Cinzel', serif;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 0.18rem 0.45rem;
  border-radius: 4px;
  white-space: nowrap;
}

.lfg-cal-countdown {
  background: rgba(201,150,26,0.12);
  border: 1px solid rgba(201,150,26,0.3);
  color: var(--be-muted);
  font-family: 'Spectral', serif;
  font-style: italic;
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  white-space: nowrap;
}
```

Add `position: relative` to the card containers so the badge
anchors correctly. Apply CalendarBadge to:
- LFGMiniCard
- The full lfg-big-card
- The hover popup card

---

## Fix 2 — Remove floating "Server Time:" label, fix dropdown labels

### Remove the orphaned label
Find the element in the LFG form that shows "Server Time:" as a
standalone label/button above the day checkboxes.
Delete it entirely.

### Update time dropdown labels
Find the two time dropdowns (start time and end time).
Their labels currently say "(Server)" — change to "(Server Time)":

```tsx
// Before:
<label>Start Time (Server)</label>
<label>End Time (Server)</label>

// After:
<label className="lfg-field-label">Start Time (Server Time)</label>
<label className="lfg-field-label">End Time (Server Time)</label>
```

The time info is now only stated once, clearly, on the dropdowns
themselves. No redundant floating label.

---

## Fix 3 — Hover card: notes section much larger

In the hover popup, the notes section currently renders at small
italic text. Make it prominent and impossible to miss:

```css
.lfg-hover-note {
  border-top: 1px solid rgba(201,150,26,0.2);
  padding-top: 0.85rem;
  margin-top: 0.75rem;
}

.lfg-hover-note-label {
  font-family: 'Cinzel', serif;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--be-gold);
  display: block;
  margin-bottom: 0.4rem;
}

.lfg-hover-note-text {
  font-family: 'Spectral', serif;
  font-size: 1.15rem;       /* was ~0.85rem — much larger */
  font-style: italic;
  color: var(--be-ink);     /* full ink color, not muted */
  line-height: 1.6;
  margin: 0;
}
```

---

## Verification

1. Every LFG card shows a gold "TUE 23" pill in top-right corner
2. Below it a muted "in 2d 4h" or "in 3h" countdown pill
3. "Any Day" posts show "ANY DAY / Flexible" badge
4. No standalone "Server Time:" label in the LFG form
5. Time dropdowns say "Start Time (Server Time)" and "End Time (Server Time)"
6. Hovering any LFG card shows the note at 1.15rem full ink color
7. Badge appears on mini cards, full cards, and hover popup

## Do not touch
- /recruit page
- Oath cinematic
- animation-fill-mode: both on all animations

---

## Fix 4 — Current Campaign: rotating background images

The Campaign tile on the Hall page currently uses a single static
BladesEdge_DiscordServerBanner.jpg as its background.

Replace with a slow crossfading rotation of these four images:
- /images/GuildiesInShattrath.jpg
- /images/Recruiting_TophinDarkshire.jpg
- /images/Summon_toBlastedLands.jpg
- /images/Summon_toWinterspring.jpg

Use the same Ken Burns + crossfade pattern from the /recruit page:
each image slow-zooms (scale 1.0 to 1.06 over ~14s) and crossfades
over 3s into the next. Cycle continuously.

```tsx
const CAMPAIGN_IMAGES = [
  '/images/GuildiesInShattrath.jpg',
  '/images/Recruiting_TophinDarkshire.jpg',
  '/images/Summon_toBlastedLands.jpg',
  '/images/Summon_toWinterspring.jpg',
];

// Rotate every 12 seconds
const [activeBg, setActiveBg] = useState(0);
useEffect(() => {
  const t = setInterval(() => setActiveBg(i => (i + 1) % CAMPAIGN_IMAGES.length), 12000);
  return () => clearInterval(t);
}, []);
```

```css
.campaign-bg-slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 3s ease-in-out;
  animation: campaign-kenburns 14s ease-in-out infinite alternate;
  animation-fill-mode: both;
}
.campaign-bg-slide.is-active { opacity: 1; }

@keyframes campaign-kenburns {
  from { transform: scale(1.0); }
  to   { transform: scale(1.06); }
}
```

Keep the existing dark overlay on top so text stays readable.

---

## Fix 5 — AvatarOdys GM corner on Hall page

Add the same bottom-right corner component from the /recruit page
to the Hall/dashboard page.

### Image rotation (one per page load, not cycling)
Pick one image randomly on mount:
```ts
const AVATAR_IMAGES = [
  '/images/AvatarOdys_speaking1_withScroll.png',
  '/images/AvatarOdys_speaking2_withScroll.png',
  '/images/AvatarOdys_speaking3_withScroll.png',
  '/images/AvatarOdys_speaking4_withScroll.png',
  '/images/AvatarOdys_speaking5_withScroll.png',
];

const [avatarImg] = useState(
  () => AVATAR_IMAGES[Math.floor(Math.random() * AVATAR_IMAGES.length)]
);
```

### Message text (static for now)
```ts
const GM_MESSAGE = "Thanks for coming to the guild website! I am currently working on it so let me know of issues!";
```

### Component — identical layout to /recruit quiz corner

```tsx
<div className="rc-gm-corner">
  <img
    src={avatarImg}
    className="rc-gm-corner-img"
    alt="Åvatarødys"
  />
  <div className="rc-gm-quote-overlay">
    <blockquote className="rc-gm-quote">
      "{GM_MESSAGE}"
    </blockquote>
    <div className="rc-gm-byline">
      <span className="rc-gm-name">Åvatarødys</span>
      <span className="rc-gm-title">Blådes Edge Guild Master</span>
    </div>
  </div>
</div>
```

Reuse the existing `.rc-gm-corner` CSS from the recruit page — import
or copy those styles so they match exactly. The component should look
identical: scroll PNG flush in bottom-right corner, quote text overlaid
on the parchment area, name and title below the quote.

Hide on mobile (max-width: 900px).

---

## Fix 6 — Homepage: AvatarOdys corner only appears after scrolling

On the landing page (app/(public)/page.tsx), add the same AvatarOdys
GM corner BUT only render it after the user has scrolled down enough
that the bottom-left hero text ("Est. 2023 · Burning Crusade Classic")
is no longer visible in the viewport.

```tsx
const [showGMCorner, setShowGMCorner] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    // Show after scrolling past ~80% of viewport height
    setShowGMCorner(window.scrollY > window.innerHeight * 0.8);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

```tsx
{showGMCorner && (
  <div className="rc-gm-corner" style={{
    opacity: showGMCorner ? 1 : 0,
    transition: 'opacity 0.6s ease',
    animationFillMode: 'both',
  }}>
    <img src={avatarImg} className="rc-gm-corner-img" alt="Åvatarødys" />
    <div className="rc-gm-quote-overlay">
      <blockquote className="rc-gm-quote">"{GM_MESSAGE}"</blockquote>
      <div className="rc-gm-byline">
        <span className="rc-gm-name">Åvatarødys</span>
        <span className="rc-gm-title">Blådes Edge Guild Master</span>
      </div>
    </div>
  </div>
)}
```

Fades in smoothly at 0.6s once the scroll threshold is passed.
Fades back out if user scrolls back to the top.

---

## Additional verification

8. Campaign tile shows rotating background images with Ken Burns
9. Crossfade between images takes ~3 seconds
10. Hall page shows AvatarOdys corner with random speaking image
11. GM message text matches exactly
12. Name "Åvatarødys" and title "Blådes Edge Guild Master" visible in parchment area
13. Homepage: corner does NOT show on initial load
14. Homepage: corner fades in after user scrolls ~80vh down
15. Homepage: corner fades out if user scrolls back to top
16. Mobile: GM corner hidden on all pages (max-width 900px)
