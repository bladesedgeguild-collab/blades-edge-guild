<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Blådes Edge Guild Website — Full Project Context

## What this is
A World of Warcraft Classic guild website for Blådes Edge (Nordic å in name),
a guild on the Dreamscythe Anniversary/TBC server (Alliance). The site helps
returning members register their comeback, new members join, see the guild
roster, and eventually sign up for dungeon runs.

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

## Route structure
- / → app/(public)/page.tsx — landing page, public
- /login → app/(auth)/login/page.tsx — Discord OAuth + email/password login
- /auth/callback → app/auth/callback/route.ts — OAuth callback
- /onboarding → app/(onboarding)/onboarding/page.tsx — character claiming wizard
- /dashboard → app/(member)/dashboard/page.tsx — The Hall (requires auth + onboarding)
- /roster → app/(member)/roster/page.tsx — guild roster
- /import → app/(admin)/import/page.tsx — GRM roster import (admin only)
- /approvals → app/(admin)/approvals/page.tsx — admin tools

## Auth flow
1. User logs in via Discord OAuth or email/password
2. app/auth/callback/route.ts fires — creates public.users row with:
   role = 'member' (NOT pending — all new users auto-approved)
   has_completed_onboarding = false
3. Middleware checks: if has_completed_onboarding !== true → redirect to /onboarding
4. Onboarding wizard lets user claim their character
5. After onboarding: has_completed_onboarding = true → access to full site

## Onboarding flow (TWO paths)

### Returning member path (3 steps + cinematic):
Step 1: Search roster by name (special char normalization — D finds Ðjenna etc)
Step 2: Confirm character card (shows class, level, rank, professions)
Cinematic: Oath is Sealed — wax seal stamp animation, ember particles, dark amber bg
Step 3: Add your alts (optional, can skip)
→ Dashboard/Hall

### New member path (3 steps + cinematic):
Step 1: Enter name + Race dropdown + Class dropdown (filtered by race/TBC rules) + Level
Step 2: Confirm — shows Fresh Recruit rank, To Be Determined professions
Cinematic: same oath screen
→ Dashboard/Hall (no alts step)

TBC Alliance race/class rules:
Human: Warrior, Paladin, Rogue, Priest, Mage, Warlock
Dwarf: Warrior, Paladin, Hunter, Rogue, Priest
Night Elf: Warrior, Hunter, Rogue, Priest, Druid
Gnome: Warrior, Rogue, Mage, Warlock
Draenei: Warrior, Paladin, Hunter, Priest, Shaman, Mage

## Database tables (Supabase/Postgres)
- public.users: id, discord_id, discord_username, discord_avatar, display_name,
  role (member/officer/gm/admin), has_completed_onboarding, claimed_character_id,
  approved_at, created_at, updated_at
- public.characters: id, user_id, name, realm (Dreamscythe), class, race, sex,
  level, is_main, rank_name, rank_index, joined_guild_at, last_zone,
  status (returned/mia/new), imported_from_grm, claimed_by, claimed_at,
  hide_from_roster, note, created_at, updated_at
- public.professions: id, character_id, name, abbr, skill_level, is_primary
- public.dungeon_runs, dungeon_slots, notifications, grm_imports

Always use service role client (SUPABASE_SERVICE_ROLE_KEY) for admin operations
and any writes that need to bypass RLS.

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

## Key images in public/images/
- hero-portal.png: painterly Dark Portal scene with 3 guild chars (Darliouse,
  Æminåmi, Åvatarødys) — used as hero background and onboarding background
- guild-photo.png: illustrated group portrait of all 275 members with guild crest
- guild-crest.png: the guild crest icon (circular, gold/blue)
- BladesEdge_DiscordServerBanner.jpg: guild banner used in Hall campaign tile

## What is built and working
- Landing page: hero portal art, return meter (live DB data), scrolling roster
  rows (alternating direction, hover to expand), guild photo with flanking
  returned/MIA columns, CTA section with dual login
- Discord OAuth + email/password login
- Onboarding: returning member search + claim, new member form, oath cinematic
  with wax seal stamp animation (be-stamp keyframe), ember particles, dark amber bg
- Hall/Dashboard: campaign banner, Hall Feed, Upcoming, character stats, guildies count
- Navbar: Hall/My Roster/Dungeons(disabled)/Officers links when logged in,
  user avatar dropdown with logout and reset character claim
- Admin import page at /import (not /admin/import — route group issue)
- 275 characters imported from GRM lua file

## What still needs building (priority order)
1. Fix: new user onboarding redirect (has_completed_onboarding check in middleware)
2. My Roster page redesign (from Claude Design handoff — profile hero, vitals, alts)
3. Settings page redesign
4. Roster page (/roster) with class filters and better layout
5. GRM roster update tool on Officers/Admin page
6. Dungeon LFG board
7. Oath screen character art (wireframe M+F per Race+Class, 52 images via Midjourney)
8. Email notifications when new member registers
9. Altaholic meter on profile page
10. Discord channel integration

## Known issues / gotchas
- Admin routes use route groups (admin) so URL is /import not /admin/import
- Git push from MacBook needs personal access token for bladesedgeguild-collab org
- Always use 'both' not 'forwards' for CSS animation fill-mode on oath screen
- Search API uses JS-side normalization for special chars (Ð→D, Å→A, ß→B etc)
- hide_from_roster column exists but should be false for all characters
- The Sum* warlock alts belong to GM Åvatarødys and should be claimable

## Commit message format
feat: new feature
fix: bug fix
style: visual/CSS only
refactor: no behavior change
chore: config/deps/tooling
