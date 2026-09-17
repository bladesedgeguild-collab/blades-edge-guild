<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Blades Edge Guild Website — Full Project Context

## What this is
Guild name is "Blades Edge" — plain ASCII, no special characters.
A **World of Warcraft: Forever** guild website for Blades Edge, Alliance. The
site pivoted from an old Burning Crusade Classic guild into a brand-new
guild forming ahead of the WoW: Forever launch (Nov 4, 2026). The theme is a
**Founding Charter**: new players sign the charter and become founding
members before launch. There is no "returning member" concept — everyone
who signs up is founding the guild fresh.

Live at: https://bladesedgeguild.com
GitHub: https://github.com/bladesedgeguild-collab/blades-edge-guild

## Workflow — ALWAYS follow this
The human (Aaron) works through Claude.ai chat to define features and get
TASK.md files. He drops TASK.md into this project folder and runs:
  Read AGENTS.md and TASK.md and complete the task.

After every task:
1. npm run build — fix ALL errors before committing
2. git add -A && git commit -m "type: description" && git push origin main
3. Vercel auto-deploys on push to main

Never ask Aaron to manually edit code files. Always produce a complete
working solution that builds cleanly and pushes to GitHub.

Aaron runs Claude Code on Windows PC (PowerShell) and MacBook Air (Terminal).
On Mac: git push may need token auth — use https with personal access token.

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui
- Supabase for auth and database (@supabase/ssr)
- Discord OAuth + Email/Password auth via Supabase
- Vercel for deployment
- GitHub: bladesedgeguild-collab org

## Environment variables (never hardcode values)
- NEXT_PUBLIC_SUPABASE_URL = https://yimbusnvskaogmnavuoz.supabase.co
- NEXT_PUBLIC_SITE_URL = https://bladesedgeguild.com
- NEXT_PUBLIC_SUPABASE_ANON_KEY = (in .env.local)
- SUPABASE_SERVICE_ROLE_KEY = (in .env.local)
- DISCORD_CLIENT_ID = 1506021722988744735
- DISCORD_CLIENT_SECRET = (in .env.local)

## Guild config — single source of truth
`lib/guild-config.ts` exports `GUILD` (name, established, game, faction,
ruleset, launchAt, maxLevel, foundersGoal) and `RACE_CLASSES` (Alliance
race → class rules for original WoW, no Draenei). Never hardcode the game
name, ruleset, or race/class rules elsewhere — import from here.

WoW: Forever has **rulesets**, not realms/servers (Normal | PvP |
Roleplaying | Hardcore). The DB `realm` column on `public.characters` now
holds the ruleset string. Characters have a first + last name
(`name` + `last_name`), unique per region.

## Route structure
- / → app/(public)/page.tsx — landing page, public
- /login → app/(auth)/login/page.tsx — Discord OAuth + email/password login
- /auth/callback → app/auth/callback/route.ts — OAuth callback
- /onboarding → app/(onboarding)/onboarding/page.tsx — character creation wizard
- /dashboard → app/(member)/dashboard/page.tsx — The Hall (requires auth + onboarding)
- /roster → app/(member)/roster/page.tsx — guild roster
- /guildies → app/(member)/guildies/page.tsx — guild roster with sort/filter
- /my-roster → app/(member)/my-roster/page.tsx — your main + alts
- /recruit → app/(public)/recruit/page.tsx — Answer the Call oath quiz
- /dungeons → app/(public)/dungeons/page.tsx — dungeon guides + LFG
- /officers → app/(admin)/officers/page.tsx — roster sync + member management
- /import → app/(admin)/import/page.tsx — GRM roster import (admin only)
- /approvals → app/(admin)/approvals/page.tsx — admin tools

## Auth flow
1. User logs in via Discord OAuth or email/password
2. app/auth/callback/route.ts fires — creates public.users row with:
   role = 'member' (NOT pending — all new users auto-approved)
   has_completed_onboarding = false
3. Middleware checks: if has_completed_onboarding !== true → redirect to /onboarding
4. Onboarding wizard lets user create their character
5. After onboarding: has_completed_onboarding = true → access to full site

## Onboarding flow (single path — no returning-member claim)
1. **Create your main**: First name, Last name, Race dropdown, Class dropdown
   (filtered by `RACE_CLASSES`), Level (1 to `GUILD.maxLevel`). Validate:
   letters only (accented/special letters allowed, never stripped), no
   duplicate first+last name (case-insensitive).
2. **Confirm**: character card with full name, race/class in class color,
   rank "Fresh Recruit", professions "To Be Determined".
3. **Charter cinematic**: "The Charter Is Signed" — wax seal stamp animation
   (`be-stamp` keyframe, never modify), ember particles, dark amber bg.
   `animation-fill-mode` stays `both` everywhere, never `forwards`.
4. **Add alts (optional, skippable)**: manual entry only, same
   first/last/race/class/level form. No claiming from an existing pool —
   there isn't one. Add as many as they want, each `is_main = false`.
5. → Hall.

WoW: Forever Alliance race/class rules (original WoW combos, no Draenei):
Human: Warrior, Paladin, Rogue, Priest, Mage, Warlock
Dwarf: Warrior, Paladin, Hunter, Rogue, Priest
Night Elf: Warrior, Hunter, Rogue, Priest, Druid
Gnome: Warrior, Rogue, Mage, Warlock

## Database tables (Supabase/Postgres)
- public.users: id, discord_id, discord_username, discord_avatar, display_name,
  role (member/officer/gm/admin), has_completed_onboarding, claimed_character_id,
  approved_at, created_at, updated_at
- public.characters: id, user_id, name, last_name, realm (ruleset string),
  class, race, sex, level, is_main, rank_name, rank_index, joined_guild_at,
  last_zone, status (new/returned/mia — legacy values may still exist on
  pre-existing rows, but the app no longer sets or filters on returned/mia),
  imported_from_grm, claimed_by, claimed_at, hide_from_roster, note,
  in_original_roster (legacy column, no longer read or written by the app),
  created_at, updated_at
- public.professions: id, character_id, name, abbr, skill_level, is_primary
- public.dungeons, dungeon_runs, dungeon_slots, notifications, grm_imports

Always use service role client (SUPABASE_SERVICE_ROLE_KEY) for admin operations
and any writes that need to bypass RLS.

The old Dreamscythe TBC roster was archived to the private `archives` Supabase
Storage bucket as part of the fresh-start reset. Old character/onboarding data
is not guaranteed to still be present in the live tables going forward.

## Design system
Background: #1a1208 (dark warm brown — NOT cold navy)
Gold accent: #c9961a
Portal green accent: #1aff6e
Text primary: #f0e6c8 (warm off-white)
Text muted: #8a7a5a

Fonts (Google Fonts, loaded in app/layout.tsx):
- Cinzel Decorative: guild name, major headings
- Cinzel: section headings, labels, eyebrows, nav links
- Spectral: body text, descriptions, italic flavor text

CSS variables: --be-bg-0 through --be-bg-3, --be-gold, --be-portal, --be-ink etc
Defined in app/globals.css

WoW class colors:
MAGE=#3fc7eb, PALADIN=#f48cba, WARRIOR=#c69b3a, PRIEST=#ffffff,
DRUID=#ff7c0a, HUNTER=#aad372, ROGUE=#fff468, WARLOCK=#8788ee,
SHAMAN=#0070dd, DEATH_KNIGHT=#c41e3a, MONK=#00ff98, DEMON_HUNTER=#a330c9
(Shaman stays in the class color map for legacy characters and decorative
art, but is not selectable in onboarding since Draenei was removed.)

## Key images in public/images/
- hero-portal.png: painterly Dark Portal scene — used as hero background and
  onboarding background
- guild-photo.png: illustrated group portrait of the old roster with guild
  crest — kept in the repo but no longer displayed on the landing page
- guild-crest.png: the guild crest icon (circular, gold/blue)
- BladesEdge_DiscordServerBanner.jpg: guild banner used in Hall campaign tile

## What is built and working
- Landing page: hero portal art, launch countdown to `GUILD.launchAt`,
  founders-sworn meter (live DB data), scrolling roster rows fed by live
  characters only (hidden with a placeholder line if fewer than 8 exist),
  CTA section with dual login
- Discord OAuth + email/password login
- Onboarding: single character-creation path (no returning-member search),
  charter-signing cinematic with wax seal stamp animation, ember particles
- Hall/Dashboard: campaign banner, Hall Feed ("{name} signed the Blades
  Edge charter."), Upcoming, character stats, guildies count
- Navbar: Hall/My Roster/Guildies/Dungeons links when logged in, user avatar
  dropdown with logout; Settings page has "Reset My Characters" (deletes the
  user's own characters + professions, clears onboarding, sends them back
  through /onboarding — behind a confirm dialog)
- Admin import page at /import (not /admin/import — route group issue)
- Officers roster sync tool at /officers (upload/diff/apply GRM export JSON)

## What still needs building (priority order)
1. My Roster page further polish
2. Roster page (/roster) further polish (search + class filter now live)
3. Dungeon LFG board refinements
4. Charter cinematic character art (wireframe M+F per Race+Class, 52 images
   via Midjourney)
5. Email notifications when new member registers
6. Altaholic meter on profile page
7. Discord channel integration

## Known issues / gotchas
- Admin routes use route groups (admin) so URL is /import not /admin/import
- Git push from MacBook needs personal access token for bladesedgeguild-collab org
- Always use 'both' not 'forwards' for CSS animation fill-mode on the charter cinematic screen
- Search API uses JS-side normalization for special chars (Ð→D, Å→A, ß→B etc)
- hide_from_roster column exists but should be false for all characters
- `status` column on characters may still hold legacy 'returned'/'mia' values
  on rows created before the fresh-start reset — the app no longer sets or
  filters on those values, new/imported characters always get status='new'
- `in_original_roster` column exists but is legacy — no app code reads or
  writes it anymore

## Commit message format
feat: new feature
fix: bug fix
style: visual/CSS only
refactor: no behavior change
chore: config/deps/tooling
