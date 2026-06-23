# TASK: Active Guildies — Threshold, Label, and Alt Exclusion List

## Three changes, all related to the "Active This Week" feature on the landing page.

---

## Change 1: Bump threshold from 7 to 14 days

Find wherever `last_online_days <= 7` is used to filter active members.
It will be in the landing page data fetch or the import processing.

```ts
// BEFORE:
last_online_days <= 7

// AFTER:
last_online_days <= 14
```

---

## Change 2: Update label copy

Find the "Active This Week" label and its subtitle on the landing page.

```tsx
// BEFORE (approximately):
"Active This Week"
"X guildies online"

// AFTER:
"Active Guildies"
"X spotted online recently"
```

Apply to both the stat counter label on the landing page metrics row AND
anywhere else "Active This Week" appears as a section heading.

---

## Change 3: Update the GM alt exclusion list

The landing page active scroll excludes GM alts so only real guildies appear.
Find the exclusion list — it will be an array of character names used to
filter out Aaron's characters from the active display.

Replace the entire list with this complete updated version:

```ts
const GM_ALT_NAMES = new Set([
  // Main + core alts
  'Åvatarødys', 'Æminåmi', 'Tøph', 'Ðråcårys', 'Irøhh', 'Pukanacua',
  'Raghop', 'Ðeerføx', 'Ðjenna', 'Ðjøç', 'Zmite',
  // Utility
  'Guildßank', 'Tourisßlaðes', 'Bootyßayah',
  // Sum locks — all variants
  'Sumwinter', 'Sumåzshara', 'Sumsouthshor', 'Sumðiremaul', 'Sumfelwood',
  'Sumßlaðes', 'Sumzulgurub', 'Sumkalimdor', 'Sumstormwind',
  // Other warlock alts
  'Barragninn', 'Ilikeice', 'Kælin', 'Ghem', 'Kanahh', 'Skerza', 'Chaøtic',
  // Blades Edge name variants (all Aaron's locks)
  'Blådesedge', 'Blådesædge', 'Bladesedge', 'Bladesædge',
  'Blådesedge', 'Tourisßlaðes',
])
```

CRITICAL: Do NOT use `.toUpperCase()` or any case transformation on these
names when comparing. The ß character renders as "SS" in uppercase. Always
compare names as-is with exact string matching.

The filter should be:
```ts
.filter(char => !GM_ALT_NAMES.has(char.name))
```

---

## Build and deploy

```bash
npm run build
git add -A
git commit -m "fix: active guildies — 14 day threshold, updated label, full alt exclusion list"
git push origin main
```

## Verification checklist
- [ ] Threshold is 14 days (not 7)
- [ ] Label reads "Active Guildies" not "Active This Week"
- [ ] Subtitle reads "X spotted online recently"
- [ ] Åvatarødys, Tøph, Guildßank not in the active scroll
- [ ] Blådesedge / Bladesædge variants not in the active scroll
- [ ] Sumstormwind not in the active scroll
- [ ] Real guildies like Frostfriend, Anomalistic, Deathcultz still appear
- [ ] No `.toUpperCase()` used on character name comparisons
- [ ] `npm run build` passes

---

## Change 4: Mobile hero — guild title styling fix

Find the hero section on the landing page (`app/(public)/page.tsx` or hero component).

On mobile only (`max-width: 767px`):

### Remove the background rectangle
The guild title has a background box/panel behind it. Remove it on mobile:
```css
@media (max-width: 767px) {
  .hero-title-container,
  [class*="hero-title"],
  [class*="guild-title"] {
    background: none !important;
    backdrop-filter: none !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 16px !important;
  }
}
```

Grep first to find the exact class/element:
```bash
grep -r "Blådes Edge\|hero-title\|guild-title\|hero.*bg\|backdrop" \
  app/(public)/ components/ --include="*.tsx" -l
```

### Right-align the text, smaller font, abbreviated subtitle

On mobile the two lines should be:

```
Line 1: Blådes Edge          (Cinzel Decorative, right-aligned)
Line 2: Est. 2023 · TBC · Dreamscythe Alliance   (Cinzel, right-aligned, smaller)
```

Change "Burning Crusade Classic" to "TBC" in the subtitle — on ALL screen sizes,
not just mobile, since it's cleaner everywhere.

Apply these mobile styles:
```css
@media (max-width: 767px) {
  .hero-guild-name {
    font-size: clamp(1.6rem, 7vw, 2.2rem);
    text-align: right;
    line-height: 1.1;
  }
  .hero-guild-subtitle {
    font-size: clamp(0.55rem, 2.8vw, 0.75rem);
    text-align: right;
    white-space: nowrap;
    letter-spacing: 0.04em;
  }
  .hero-title-wrapper {
    align-items: flex-end;
    padding-right: 16px;
  }
}
```

The subtitle text value to use (update the string in the component):
```
Est. 2023 · TBC · Dreamscythe Alliance
```

Do NOT change desktop layout — right-align and size reduction is mobile only.
The "TBC" abbreviation replaces "Burning Crusade Classic" everywhere.

---

## Build and deploy (updated)

```bash
npm run build
git add -A
git commit -m "fix: active guildies threshold/labels/exclusions, mobile hero title right-aligned"
git push origin main
```

## Additional checklist items
- [ ] Hero title background rectangle gone on mobile
- [ ] "Blådes Edge" right-aligned on mobile, smaller font
- [ ] Subtitle reads "Est. 2023 · TBC · Dreamscythe Alliance" — no line wrap
- [ ] Desktop hero layout unchanged
- [ ] "Burning Crusade Classic" replaced with "TBC" in subtitle everywhere
