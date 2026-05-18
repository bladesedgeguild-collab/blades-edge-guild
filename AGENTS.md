<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Blådes Edge Guild Website — Project Memory

## What this is
A World of Warcraft Classic guild website for Blådes Edge, a guild on the Dreamscythe Anniversary server (Alliance). The site helps returning members register their comeback, see the guild roster, and sign up for dungeon runs.

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui
- Supabase for auth and database (@supabase/ssr)
- Discord OAuth via Supabase Auth
- Vercel for deployment (auto-deploys on push to main)
- GitHub: https://github.com/bladesedgeguild-collab/blades-edge-guild

## Environment variables (never hardcode values)
- NEXT_PUBLIC_SUPABASE_URL = https://yimbusnvskaogmnavuoz.supabase.co
- NEXT_PUBLIC_SITE_URL = https://bladesedgeguild.com
- NEXT_PUBLIC_SUPABASE_ANON_KEY = (in .env.local, not committed)
- SUPABASE_SERVICE_ROLE_KEY = (in .env.local, not committed)
- DISCORD_CLIENT_ID = 1506021722988744735
- DISCORD_CLIENT_SECRET = (in .env.local, not committed)

## Key routes
- / → app/(public)/page.tsx — landing page, public
- /login → app/(auth)/login/page.tsx — Discord OAuth login
- /auth/callback → app/(auth)/callback/route.ts — OAuth callback handler
- /dashboard → app/(member)/dashboard/page.tsx — requires auth + approved role
- /roster → app/(member)/roster/page.tsx — requires auth + approved role
- /dungeons → app/(member)/dungeons/page.tsx — requires auth + approved role
- /approvals → app/(admin)/approvals/page.tsx — requires role = admin or gm

## Auth flow
1. User clicks login → Supabase signInWithOAuth with Discord provider
2. Discord redirects to Supabase callback URL
3. Supabase exchanges code and redirects to /auth/callback on our app
4. /auth/callback route.ts exchanges code, upserts row in public.users with Discord metadata
5. Redirects to /dashboard on success, /login?error=auth_failed on failure
6. Middleware checks role: pending → show waiting message, member+ → full access, admin/gm → admin routes

## Database tables (Supabase/Postgres)
- public.users — id, discord_id, discord_username, discord_avatar, display_name, role, approved_at, approved_by, created_at, updated_at
- public.characters — id, user_id, name, realm, class, race, sex, level, is_main, rank_name, rank_index, joined_guild_at, last_zone, status (mia/returned/new), imported_from_grm, created_at, updated_at
- public.professions — id, character_id, name, abbr, skill_level, is_primary, updated_at
- public.dungeon_runs — id, created_by, dungeon_name, quests, notes, scheduled_at, status, max_players, level_min, level_max, created_at
- public.dungeon_slots — id, run_id, user_id, character_id, role (tank/healer/dps), slot_order, signed_up_at
- public.notifications — id, user_id, type, title, body, link, read, created_at
- public.grm_imports — id, imported_by, characters_updated, characters_added, notes, imported_at

## Design tokens
- Background: #0a0f1e (deep navy)
- Gold accent: #c9a84c
- Discord blurple: #5865F2
- MIA status: muted steel blue
- Returned status: bright green
- WoW class colors: MAGE=#3fc7eb, PALADIN=#f48cba, WARRIOR=#c69b3a, PRIEST=#ffffff, DRUID=#ff7c0a, HUNTER=#aad372, ROGUE=#fff468, WARLOCK=#8788ee, SHAMAN=#0070dd

## Workflow — always follow this after every change
1. Run: npm run build
2. Fix any TypeScript or lint errors before committing
3. Run: git add -A && git commit -m "type: short description" && git push origin main
4. Vercel auto-deploys on push to main

## Commit message format
- feat: new feature
- fix: bug fix
- style: visual/CSS changes only
- refactor: code change, no behavior change
- chore: config, deps, tooling
