# TASK: Mobile Round 3 + Hall Feed Fix + Dungeon Data Prep

---

## Fix 1: Recruit results — guild crest overlapping header

On the recruit quiz results page, the guild crest image is overlapping the
results label/header text on mobile.

Find the results page component. The guild crest is likely absolutely or
fixed positioned. On mobile:

```css
@media (max-width: 767px) {
  .guild-crest,
  [class*="crest"],
  [class*="GuildCrest"] {
    display: none;
    /* OR if it should stay, push it below the header: */
    position: static;
    margin: 0 auto 16px;
    width: 64px;
    height: 64px;
  }
}
```

Simplest fix: hide the crest on mobile results page. The header text is more
important than the decoration. If the crest is used as a background or
watermark, set `opacity: 0` on mobile instead.

Grep first to find exactly where it renders:
```bash
grep -r "guild.crest\|guildcrest\|GuildCrest\|crest" app/ components/ --include="*.tsx" -l
```

---

## Fix 2: Hall Feed — "Answered the Call and returned" only for originals

### The bug
Every user who logs in gets a Hall Feed post saying they "answered the call
and returned" — including brand new members who were never in the original
roster. Only the 286 confirmed original Blådes Edge members should get the
"and returned" framing. New members should get a different message like
"has joined Blådes Edge!" or "answered the call!"

### The fix
Find where the Hall Feed / notifications post is created on user login or
onboarding completion. It will be in one of:
- `app/auth/callback/route.ts`
- The onboarding completion handler
- A database trigger or function in Supabase

Find the insert into `notifications` or `hall_feed` or similar table.

Check the `in_original_roster` boolean on the `characters` table for the
user's claimed character:

```ts
// After the user claims their character, check:
const { data: character } = await supabase
  .from('characters')
  .select('in_original_roster')
  .eq('id', user.claimed_character_id)
  .single()

const isOriginal = character?.in_original_roster === true

// Use different message depending on original status:
const feedMessage = isOriginal
  ? `${characterName} answered the call and returned to Blådes Edge!`
  : `${characterName} has joined Blådes Edge!`

await supabase.from('notifications').insert({
  type: isOriginal ? 'member_returned' : 'member_joined',
  message: feedMessage,
  // ... other fields
})
```

Also apply the guard from the previous task: do NOT fire this post at all
if the user already has `has_completed_onboarding = true` (re-auth, not new).

```ts
// Full guard:
const isReauth = existingUser?.has_completed_onboarding === true
  && existingUser?.claimed_character_id !== null

if (isReauth) return // skip — not a new join event
```

---

## Fix 3: Dungeon page — JSON importer scaffold

The dungeon page needs to be able to accept structured dungeon data (dungeon
name, description, location, level range, bosses, loot highlights, etc.)
via a JSON import at the Officers page — same pattern as the roster importer.

### Step A: Define the dungeon data schema

Create `lib/dungeon-schema.ts`:

```ts
export interface DungeonBoss {
  name: string
  abilities?: string[]
  notable_loot?: string[]
}

export interface Dungeon {
  id: string                    // slug e.g. "shadow-labyrinth"
  name: string                  // "Shadow Labyrinth"
  zone: string                  // "Auchindoun"
  region: string                // "Terokkar Forest"
  min_level: number             // 67
  max_level: number             // 70
  heroic: boolean               // true/false
  description: string           // flavor text / overview
  location_note?: string        // "Enter from the center of Auchindoun"
  bosses: DungeonBoss[]
  tags?: string[]               // ["aoe", "cc-heavy", "good-xp"]
  image_key?: string            // matches a file in public/images/dungeons/
}
```

### Step B: Create the Supabase table

Add a migration or run this SQL in Supabase SQL editor:

```sql
CREATE TABLE IF NOT EXISTS public.dungeons (
  id TEXT PRIMARY KEY,              -- slug
  name TEXT NOT NULL,
  zone TEXT,
  region TEXT,
  min_level INTEGER,
  max_level INTEGER,
  heroic BOOLEAN DEFAULT false,
  description TEXT,
  location_note TEXT,
  bosses JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  image_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Allow officers and admins to manage dungeons
ALTER TABLE public.dungeons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers can manage dungeons"
  ON public.dungeons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('officer', 'admin', 'gm')
    )
  );

CREATE POLICY "Anyone can read dungeons"
  ON public.dungeons
  FOR SELECT
  TO anon, authenticated
  USING (true);
```

### Step C: Add dungeon import to Officers page

In the Officers/admin import page (`app/(admin)/import/page.tsx` or similar),
add a second import section below the roster importer:

```tsx
{/* Dungeon JSON Import */}
<section>
  <h2>Import Dungeon Data</h2>
  <p>Upload a JSON file matching the dungeon schema.</p>
  <input
    type="file"
    accept=".json"
    onChange={handleDungeonImport}
  />
  {dungeonPreview && (
    <pre>{JSON.stringify(dungeonPreview, null, 2)}</pre>
  )}
  <button onClick={confirmDungeonImport}>Import Dungeons</button>
</section>
```

The `handleDungeonImport` function should:
1. Parse the uploaded JSON (array of Dungeon objects)
2. Validate each entry has at minimum: `id`, `name`, `min_level`, `max_level`
3. Show a preview of what will be imported
4. On confirm: upsert each dungeon into `public.dungeons` using `id` as
   the conflict key

```ts
async function confirmDungeonImport(dungeons: Dungeon[]) {
  for (const dungeon of dungeons) {
    const { error } = await supabase
      .from('dungeons')
      .upsert(dungeon, { onConflict: 'id' })
    if (error) console.error(`Failed to import ${dungeon.name}:`, error)
  }
}
```

### Step D: Create a sample dungeon JSON for testing

Create `public/sample-dungeon-import.json`:

```json
[
  {
    "id": "shadow-labyrinth",
    "name": "Shadow Labyrinth",
    "zone": "Auchindoun",
    "region": "Terokkar Forest",
    "min_level": 67,
    "max_level": 70,
    "heroic": false,
    "description": "The Shadow Council has taken root in the depths of Auchindoun. Fight through their ranks to stop the summoning of a dark entity.",
    "location_note": "Enter from the center of the Auchindoun ruins in Terokkar Forest.",
    "bosses": [
      { "name": "Ambassador Hellmaw", "notable_loot": ["Wastewalker Shoulderpads"] },
      { "name": "Blackheart the Inciter", "notable_loot": ["Inciter's Pauldrons"] },
      { "name": "Grandmaster Vorpil", "notable_loot": ["Vorpil's View"] },
      { "name": "Murmur", "notable_loot": ["Sonic Spear", "Sonic Vibration"] }
    ],
    "tags": ["shadow-council", "aoe-friendly", "good-rep"],
    "image_key": "shadow-labyrinth"
  }
]
```

---

## Build and deploy

```bash
npm run build
git add -A
git commit -m "fix: guild crest overlap, hall feed original check, dungeon import scaffold"
git push origin main
```

## Verification checklist
- [ ] Recruit results: guild crest not overlapping header on mobile
- [ ] Hall Feed: original roster members get "answered the call and returned"
- [ ] Hall Feed: new members get "has joined Blådes Edge!"
- [ ] Hall Feed: re-auth (already onboarded) fires no post at all
- [ ] `public.dungeons` table created in Supabase
- [ ] Officers page has dungeon JSON import section
- [ ] Sample dungeon JSON file exists at `public/sample-dungeon-import.json`
- [ ] `npm run build` passes with zero errors
