# TASK 2 of 2: Fresh Start for WoW: Forever

**Prerequisite check:** TASK-1 (rename to "Blades Edge") must already be done. Run:
```
grep -rniE "blådes|BLÅDES" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git .
```
If it returns anything, STOP and report back. Do not continue.

---

## Context

The site is pivoting. The old Dreamscythe TBC guild is done. Blades Edge is becoming a brand-new guild on **World of Warcraft: Forever** (launches Nov 4, 2026). Nobody is "returning." There are no old names to reclaim. The "Come back, guildies" theme is retired and replaced with a **Founding Charter** theme: new players sign the charter and become founding members before launch.

Before touching anything, read `node_modules/next/dist/docs/` for anything you're unsure about (see AGENTS.md). This repo has grown beyond what AGENTS.md lists (e.g. `/officers`, `/guildies`, recruit quiz, LFG / Dungeon Finder, GM Corner, `in_original_roster`). **Use grep to find real files. Do not assume paths.**

Order of work: Steps A–E and G are code changes → build → commit → push. Step F (the wipe script) is run **last**, after the push.

---

## Step A — Central guild config

Create `lib/guild-config.ts` as the single source of truth. Replace hardcoded game/server references across the app with imports from here.

```ts
export const GUILD = {
  name: 'Blades Edge',
  established: 2023,
  game: 'WoW: Forever',
  faction: 'Alliance',
  ruleset: 'Normal',            // Aaron will confirm: Normal | PvP | Roleplaying | Hardcore
  launchAt: '2026-11-04T15:00:00-08:00', // WoW: Forever global launch, 3:00 PM PST
  maxLevel: 60,                 // adjust if Blizzard confirms otherwise
  foundersGoal: 50,
};

// Alliance race → class rules. WoW: Forever is built on original WoW, so default to
// the original Alliance combos (no Draenei). Keep this the ONLY place these rules live.
export const RACE_CLASSES: Record<string, string[]> = {
  Human:       ['Warrior', 'Paladin', 'Rogue', 'Priest', 'Mage', 'Warlock'],
  Dwarf:       ['Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest'],
  'Night Elf': ['Warrior', 'Hunter', 'Rogue', 'Priest', 'Druid'],
  Gnome:       ['Warrior', 'Rogue', 'Mage', 'Warlock'],
};
```

- grep for `Dreamscythe`, `Burning Crusade`, `TBC`, `Anniversary`, `Draenei`, `Shaman` in app code and replace with config values or remove. (Shaman stays in the class color map, just not selectable in onboarding.)
- The desktop subtitle currently reads "Est. 2023 · Burning Crusade Classic · Dreamscythe Alliance". New: `Est. 2023 · WoW: Forever · Alliance`, built from `GUILD`.
- Any `realm` default of `'Dreamscythe'` in code → use `GUILD.ruleset` for new characters. WoW: Forever has no realms, only rulesets.

## Step B — Two-part character names (WoW: Forever surnames)

WoW: Forever characters have a **first name + last name** (unique per region).

1. Inspect existing migrations / schema (`supabase/migrations`, SQL files, or generated types) to see how schema changes have been applied in this repo before.
2. Create a migration adding `last_name text` (nullable) to `public.characters`. If a unique constraint exists on `name` or `(name, realm)`, replace it with a case-insensitive unique index on `(lower(name), lower(coalesce(last_name, '')))`.
3. Apply it the same way previous migrations were applied. **If you cannot apply DDL from this environment, do not fake it.** Finish everything else and put the exact SQL at the top of your final summary under the heading `SQL TO RUN IN SUPABASE SQL EDITOR`. Write the code so it works once that SQL is run.
4. Update TypeScript types for characters to include `last_name`.
5. Display full names everywhere a character is shown: first name prominent (class color), last name smaller/muted beside it. Handle `last_name` being null gracefully.
6. Character search matches first name, last name, or both, still using the special-character normalization.

## Step C — Onboarding: one path only

Remove the **Returning Member** path entirely (roster search → claim existing character). Remove the path-choice screen. Everyone goes through one flow:

1. **Create your main**: First name, Last name, Race dropdown, Class dropdown (filtered by `RACE_CLASSES`), Level (1 to `GUILD.maxLevel`, default 1). Validate: letters only (allow accented/special letters, do not strip them), no duplicates (case-insensitive first + last).
2. **Confirm**: character card with full name, race/class in class color, rank "Fresh Recruit", professions "To Be Determined".
3. **Oath cinematic**: keep exactly as-is. Change copy only. This is now *signing the Founding Charter* (e.g. heading "The Charter Is Signed", flavor line about being among the first to carry the Blades Edge banner into WoW: Forever). Do NOT modify the `be-stamp` keyframe. `animation-fill-mode` stays `both` everywhere, never `forwards`.
4. **Add alts (optional, skippable)**: manual entry with the same first/last/race/class/level form. Add as many as they want, each saved with `is_main = false` and linked to the user.
5. → Hall.

Delete dead code: returning-member search API route (only if nothing else uses it; grep first), claim-existing-character logic, the Sum* warlock claimability special case, any hardcoded lists of old alts or old returning members.

New characters get: `status = 'new'`, `imported_from_grm = false`, `rank_name = 'Fresh Recruit'`, `rank_index = 9`, `realm = GUILD.ruleset`, `user_id` / `claimed_by` = current user, `claimed_at = now()`.

## Step D — Landing page re-theme: "Sign the Founding Charter"

Remove:
- Return meter ("X of Y returned")
- Returned / MIA flanking columns
- Guild photo section (`guild-photo.png` shows the old roster). Remove it from the page but keep the file in `public/images/`.
- All "come back" / "return" / "answer the call" / "reclaim" copy. grep for `return`, `MIA`, `comeback`, `come back`, `answered the call`, `original` in page/component copy and review each hit.

Add / change:
- Hero: keep `hero-portal.png`. Headline: **"A New Age. A New Charter."** Subline: Blades Edge is forming for WoW: Forever. Sign the charter and be a founding member.
- **Launch countdown** to `GUILD.launchAt` (days / hours / minutes, Cinzel labels, gold numbers). After launch, show "Now live in WoW: Forever". Render client-side only to avoid hydration mismatch.
- **Founders meter**: "Founding Members Sworn: N of {foundersGoal}". N = users with `has_completed_onboarding = true`. Gold progress bar styled like the old return meter.
- Scrolling roster rows: keep the component, fed by new characters only. If fewer than 8 characters exist, hide the rows and show one line instead: "The charter awaits its first signatures." (Spectral italic, muted).
- CTA section: keep dual login. Button copy: "Sign the Charter".

Design rules still apply: warm brown backgrounds (never navy), CSS variables only, Cinzel Decorative / Cinzel / Spectral.

## Step E — Everything else that assumed an old roster

grep and fix each:
- **Hall Feed**: remove the "answered the call and returned" variant. All joins read "{name} signed the Blades Edge charter." Remove `in_original_roster` branching in code (leave the DB column).
- **`status` returned/mia logic**: remove UI filters, badges, and counts for `returned` / `mia`. Don't drop the column.
- **Roster / Guildies page**: remove returned/MIA filters; keep class filters and search; show full names.
- **Navbar dropdown**: rename "Reset character claim" to "Reset my characters". It deletes the user's own characters (and their professions), sets `has_completed_onboarding = false`, then redirects to `/onboarding`. Require a confirm dialog.
- **My Roster**: alt management uses manual entry only (no claiming from an imported pool).
- **GRM import tool at `/officers` (and `/import` if still present)**: keep it working, but it must no longer set `returned` / `mia` or `in_original_roster`. Imported characters get `status = 'new'`. Don't delete the tool.
- **Dungeon data** (`public.dungeons`): leave alone.
- **Recruit quiz, GM Corner**: update any TBC / Dreamscythe / returning copy to the WoW: Forever / founding theme.

## Step G — Docs

Update AGENTS.md and BUILD-STATUS.md (if in repo) to reflect: WoW: Forever, rulesets instead of realms, two-part names, single onboarding path, Founding Charter theme, old Dreamscythe roster archived in the private `archives` storage bucket, `lib/guild-config.ts` as source of truth. Remove the returning-member onboarding description, the Sum* warlock note, and the 275-character import note.

## Commit (before Step F)
1. `npm run build` → fix ALL errors
2. `git add -A && git commit -m "feat: fresh start for WoW: Forever — founding charter theme, single onboarding path, surnames, archive/wipe script" && git push origin main`

---

## Step F — Archive + wipe script (run LAST, after the push)

Create `scripts/archive-and-wipe-roster.ts` (run with `npx tsx`). Uses `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`. Commit it with the rest of Part 2 above.

**Default is DRY RUN.** It only deletes when passed `--confirm`.

1. **Discover** every table that references `characters` or holds old-roster activity. At minimum: `characters`, `professions`, `dungeon_runs`, `dungeon_slots`, `notifications`, `grm_imports`, plus any LFG, feed, alt-link, or quiz-result tables that reference characters. Check foreign keys in migrations/types; do not guess. Print the list.
2. **Export** all rows from those tables (paginate; Supabase returns max 1000 rows per request) plus a `users` snapshot limited to `id, display_name, role, claimed_character_id, has_completed_onboarding`. Do NOT include emails or Discord IDs.
3. **Save** to `archive/dreamscythe-roster-YYYY-MM-DD.json`. Add `archive/` to `.gitignore` **before** writing the file. The archive must never be committed.
4. **Upload** the same JSON to a **private** Supabase Storage bucket named `archives` (create it with `public: false` if missing).
5. **Verify**: download the uploaded file, parse it, compare row counts per table against the export. On any mismatch → abort and delete nothing.
6. If `--confirm`: delete rows in FK-safe order (children first, `characters` last). Then update ALL `public.users` rows: `claimed_character_id = null`, `has_completed_onboarding = false`, `display_name = null`. **Do NOT change `role`. Do NOT touch `auth.users`.** Everyone, including the GM, re-onboards.
7. Print before/after row counts per table.

**Run order:**
1. `npx tsx scripts/archive-and-wipe-roster.ts` (dry run)
2. If the export and verification were clean: `npx tsx scripts/archive-and-wipe-roster.ts --confirm`
3. Load the live site and confirm: countdown shows, Founders meter at 0, "charter awaits" line shows, no errors with an empty roster, and logging in routes to `/onboarding`.

If the Step B migration SQL has not been run yet, still run the wipe, but flag clearly that onboarding will fail until the SQL is applied.

---

## Final summary must include
1. `SQL TO RUN IN SUPABASE SQL EDITOR` (only if the migration couldn't be applied from here)
2. Dry run output and confirm-run before/after counts
3. Confirmation the archive exists in the `archives` bucket (file name + size)
4. List of files deleted as dead code
5. Anything you found that this task didn't anticipate
