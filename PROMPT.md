Scaffold a full Next.js 14 App Router project for a World of Warcraft Classic guild website called "Blådes Edge". Follow every instruction below exactly.

STACK:
- Next.js 14 with App Router and TypeScript
- Tailwind CSS
- shadcn/ui (initialize it)
- Supabase for auth and database (@supabase/ssr package)
- Discord OAuth via Supabase Auth

PROJECT STRUCTURE to create:
app/(public)/page.tsx - landing page
app/(public)/layout.tsx
app/(auth)/login/page.tsx - login with Discord button
app/(auth)/callback/route.ts - OAuth callback handler
app/(member)/dashboard/page.tsx - member home (auth protected)
app/(member)/roster/page.tsx - guild roster view
app/(member)/layout.tsx - auth guard for member routes
app/(admin)/approvals/page.tsx - admin approval queue
app/(admin)/layout.tsx - admin auth guard
app/layout.tsx - root layout
components/layout/NavBar.tsx
components/roster/MemberCard.tsx
components/roster/ReturnMeter.tsx
lib/supabase/client.ts - browser client
lib/supabase/server.ts - server component client
middleware.ts - route protection
types/index.ts - shared types
.env.example - with all required keys listed but no values
supabase/migrations/001_initial_schema.sql - full schema

DATABASE SCHEMA for 001_initial_schema.sql:
- users table: id (uuid, references auth.users), discord_id, discord_username, discord_avatar, display_name, role (default 'pending', options: pending/member/officer/gm/admin), approved_at, approved_by, created_at, updated_at
- characters table: id, user_id (references users), name, realm (default 'Dreamscythe'), class, race, sex, level, is_main, rank_name, rank_index, joined_guild_at, last_zone, hair_color, skin_tone, hair_style, status (default 'mia', options: returned/mia/new), imported_from_grm boolean, created_at, updated_at, unique(name, realm)
- professions table: id, character_id (references characters), name, abbr, skill_level, is_primary boolean, updated_at
- dungeon_runs table: id, created_by (references users), dungeon_name, quests, notes, scheduled_at, status (default 'open'), max_players (default 5), level_min, level_max, created_at
- dungeon_slots table: id, run_id (references dungeon_runs), user_id (references users), character_id (references characters), role (tank/healer/dps), slot_order, signed_up_at, unique(run_id, user_id)
- notifications table: id, user_id (references users), type, title, body, link, read boolean default false, created_at
- grm_imports table: id, imported_by (references users), characters_updated, characters_added, notes, imported_at

RLS POLICIES:
- users: members can view approved members, users can update own row, admins bypass all
- characters: members can view all, users manage own characters
- dungeon_runs: members can view all, users manage own runs
- dungeon_slots: members can view all, users manage own slots
- notifications: users see only own notifications

LANDING PAGE requirements (app/(public)/page.tsx):
- Dark fantasy theme, deep navy/dark blue background (#0a0f1e), gold accents (#c9a84c)
- Guild name "Blådes Edge" as large hero text with a subtle glow effect
- Tagline: "Burning Crusade Classic — Dreamscythe Alliance"
- A ReturnMeter component showing: 187 total members to bring back, 0 returned so far (will be dynamic later)
- A static roster preview showing member cards in a grid using this exact data for 10 members:
  { name: "Åvatarødys", class: "MAGE", level: 60, rank: "Guild Master", status: "mia" }
  { name: "Sozinn", class: "DRUID", level: 60, rank: "Grand Marshal", status: "mia" }
  { name: "Cradh", class: "HUNTER", level: 60, rank: "Grand Marshal", status: "mia" }
  { name: "Themrdiddley", class: "PRIEST", level: 60, rank: "Ally Emissary", status: "mia" }
  { name: "Vranx", class: "DRUID", level: 60, rank: "Ally Emissary", status: "mia" }
  { name: "Burbun", class: "PALADIN", level: 41, rank: "Ally Emissary", status: "mia" }
  { name: "Zarlon", class: "MAGE", level: 56, rank: "Vanguard Elite", status: "mia" }
  { name: "Barragninn", class: "ROGUE", level: 49, rank: "Exalted Hero", status: "mia" }
  { name: "Kælin", class: "PALADIN", level: 36, rank: "Honored Veteran", status: "mia" }
  { name: "Tralest", class: "PRIEST", level: 29, rank: "Exalted Hero", status: "mia" }
- WoW class colors: MAGE=#3fc7eb, PALADIN=#f48cba, WARRIOR=#c69b3a, PRIEST=#ffffff, DRUID=#ff7c0a, HUNTER=#aad372, ROGUE=#fff468, WARLOCK=#8788ee, SHAMAN=#0070dd
- MIA cards show a muted blue-gray overlay, "Returned" cards would show bright green (none returned yet so all MIA)
- A "Login with Discord to Register Your Return" button at the bottom linking to /login
- The ReturnMeter component shows a progress bar: X of 187 members returned, styled like a siege progress bar in gold on dark

LOGIN PAGE (app/(auth)/login/page.tsx):
- Dark theme matching landing page
- Centered card with guild name
- SVG sword/shield icon as placeholder crest
- "Welcome back to Blådes Edge" heading
- Subtext: "Log in with Discord to register your return and access the guild portal"
- A large "Continue with Discord" button (Discord's blurple color #5865F2) that calls Supabase signInWithOAuth with provider discord

OAUTH CALLBACK (app/(auth)/callback/route.ts):
- Handle the OAuth code exchange
- After successful auth, upsert a row in public.users with discord metadata from user_metadata
- Redirect to /dashboard on success
- Redirect to /login?error=auth_failed on failure

MIDDLEWARE (middleware.ts):
- /member/* routes: redirect to /login if no session, redirect to /dashboard?pending=true if role is 'pending'
- /admin/* routes: redirect to /dashboard if role is not 'admin' or 'gm'
- Use @supabase/ssr createServerClient in middleware

NAVBAR (components/layout/NavBar.tsx):
- Dark background matching site theme
- Left: "Blådes Edge" text logo in gold
- Right: if logged in show username and avatar, if not show "Login" link
- Links: Home, Roster, Dungeons (disabled with "coming soon" tooltip for now)

MEMBER CARD (components/roster/MemberCard.tsx):
- Compact dark card
- Class color as left border accent
- Shows: character name, class icon placeholder (colored dot in class color), level badge, rank text
- MIA badge in muted steel blue
- Returned badge would be bright green
- Subtle hover effect

RETURN METER (components/roster/ReturnMeter.tsx):
- Props: total (number), returned (number)
- Progress bar styled in gold on dark navy
- Text: "{returned} of {total} members have answered the call"
- Subtext: "{total - returned} still MIA — will you be next?"
- The bar should animate in on page load using CSS transition

ENV EXAMPLE (.env.example):
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
NEXT_PUBLIC_SITE_URL=

IMPORTANT INSTRUCTIONS:
1. Initialize the Next.js project first using: npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
2. Then install additional dependencies: npm install @supabase/ssr @supabase/supabase-js
3. Then initialize shadcn: npx shadcn@latest init (use slate, CSS variables yes)
4. Then add shadcn components: npx shadcn@latest add button card badge avatar progress
5. Create all files listed above
6. Run npm run build at the end and fix any TypeScript or lint errors
7. Do NOT create a .env.local file — I will create that manually
8. After build passes, run: git add -A && git commit -m "feat: Milestone 1 scaffold — landing page, auth, roster, schema" && git push origin main
