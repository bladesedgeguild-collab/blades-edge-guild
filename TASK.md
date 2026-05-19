# Current Task: Email Auth + Character Claiming Onboarding Flow

## Overview
Add email/password login as a second auth option alongside Discord OAuth.
Build a first-login onboarding wizard where users claim their character from the
existing guild roster. After claiming, their character name becomes their site identity.

---

## Part 1 - Update the login page (app/(auth)/login/page.tsx)

Replace the current login page with a new design that has TWO auth options.

Layout:
- Same dark theme (#0a0f1e background, #c9a84c gold accents)
- Guild crest SVG at top (keep existing)
- Heading: "Welcome back to Blades Edge"
- Subtext: "Log in to register your return"

Discord button (keep existing):
- "Continue with Discord" button in Discord blurple #5865F2
- Full width

Divider:
- Horizontal rule with "or" in the middle

Email/password form (new):
- Email input field
- Password input field
- Two buttons side by side: "Sign In" and "Create Account"
- "Forgot password?" link below
- Use supabase.auth.signInWithPassword for sign in
- Use supabase.auth.signUp for create account with no email confirmation needed
- On success: redirect to /onboarding if no claimed character, or /dashboard if they do
- Show inline error messages for wrong password, user not found etc

Forgot password:
- Clicking "Forgot password?" shows email input and "Send reset link" button
- Calls supabase.auth.resetPasswordForEmail(email, { redirectTo: siteUrl + '/auth/reset' })
- Shows "Check your email for a reset link" confirmation
- Create app/auth/reset/page.tsx for the new password form

---

## Part 2 - Add onboarding columns via migration

Create supabase/migrations/002_onboarding.sql with:

alter table public.users add column if not exists has_completed_onboarding boolean default false;
alter table public.users add column if not exists claimed_character_id uuid references public.characters(id);
alter table public.characters add column if not exists claimed_by uuid references public.users(id);
alter table public.characters add column if not exists claimed_at timestamptz;

Add a comment in code: "Run supabase/migrations/002_onboarding.sql in Supabase SQL editor before deploying"

---

## Part 3 - Create onboarding wizard (app/(member)/onboarding/page.tsx)

This is a multi-step wizard for any logged-in user who has not completed onboarding.
Make this a client component since it has interactive search and multi-step state.

Step 1 - Claim your main character:

Heading: "A guildie has returned!"
Subtext: "Find your character in the Blades Edge roster to claim your identity on the site."

Character search:
- Text input that queries public.characters where LOWER(name) LIKE '%input%' AND claimed_by IS NULL
- Minimum 2 characters typed before searching
- Debounce 300ms
- Show dropdown results with: name, class in WoW class color dot, level, rank_name
- If user logged in via Discord and has a Discord nickname in user_metadata, show hint:
  "Your Discord nickname is '[nickname]' - is this your character?" with quick-claim button

On selecting a character:
- Show confirmation card:
  "Is this you?"
  [Character Name] - [Class] - Level [X]
  Rank: [rank_name]
  Professions: [list from professions table]
  Last seen in: [last_zone]
  Buttons: "Yes, this is me!" and "Search again"

On confirming:
- Call API route to update: characters set claimed_by = user.id, claimed_at = now(), status = 'returned'
- Update users set claimed_character_id = character.id
- Proceed to Step 2

If not in roster (new member):
- Show option: "I'm a new member - create my character"
- Form: character name input, class dropdown, level number input
- Creates new characters row with status = 'new', claimed_by = user.id
- Proceed to Step 2

Step 2 - Add alts (optional):

Heading: "Any alts to add?"
Subtext: "Add alt characters now or skip and come back later. Admins can also assign alts to your profile."

Same search as Step 1 but for alts. Allow multiple. Show as removable chips/tags.
For each claimed alt: update characters set claimed_by = user.id, status = 'returned'

Buttons: "Add alts later" (skip) and "Done, take me in!"

Step 3 - Complete:
- Update users set has_completed_onboarding = true
- Redirect to /dashboard

---

## Part 4 - Create API routes for character claiming

Create app/api/characters/claim/route.ts:
- POST handler
- Body: { character_id: string, user_id: string, is_alt: boolean }
- Use service role client to bypass RLS
- Check character is not already claimed
- Update characters and users tables
- Return success or error

Create app/api/characters/release/route.ts:
- POST handler (admin only)
- Body: { character_id: string }
- Check requesting user is admin or gm
- Set claimed_by = null, claimed_at = null, status = 'mia'
- Clear claimed_character_id from users table if it was their main

Create app/api/characters/search/route.ts:
- GET handler with query param: ?q=searchterm
- Query characters where LOWER(name) LIKE '%term%' AND claimed_by IS NULL
- Include professions in response via join
- Return array of character objects
- No auth required (public roster search is fine)

---

## Part 5 - Update middleware.ts

Add /onboarding to allowed member routes.
After confirming user is authenticated, check has_completed_onboarding from public.users.
If false and pathname is not /onboarding, redirect to /onboarding.
If true, allow through normally.

Fetch the user profile efficiently - use a single query.

---

## Part 6 - Update dashboard (app/(member)/dashboard/page.tsx)

Fetch current user from public.users with their claimed character and professions.

If has_completed_onboarding true and claimed_character_id exists:
  Heading: "Welcome back to Blades Edge, [character_name]. Stoked to see you again!"
  Show character card with class color accent, level, rank, professions
  Show list of alt characters if any claimed

Navbar update in components/layout/NavBar.tsx:
  Once character is claimed, show character name instead of email/discord username
  Add a colored dot in their class color next to their name

---

## Part 7 - Update landing page return meter (app/(public)/page.tsx)

Change the hardcoded "0 of 187" to fetch real count:
  const { count } = await supabase.from('characters').select('*', { count: 'exact', head: true }).eq('status', 'returned')
This is a server component. Total stays hardcoded at 187.

---

## Part 8 - Admin character management (app/(admin)/approvals/page.tsx)

Add a "Character Claims" section below the existing user approvals:

Show a table of claimed characters:
- Columns: Character name, Class, Level, Claimed by (show discord_username or email), Claimed at date, Release button
- Release button calls /api/characters/release

Show count of unclaimed characters: "X of 187 characters still unclaimed"

---

## After all changes:
1. Run npm run build
2. Fix all TypeScript errors - do not leave any type errors
3. git add -A && git commit -m "feat: email auth + character claiming onboarding flow" && git push origin main

## Important:
- Do NOT break existing Discord OAuth flow
- Handle missing columns gracefully until migration is run
- Use server components for data fetching, client components only for interactivity
- WoW class colors: MAGE=#3fc7eb, PALADIN=#f48cba, WARRIOR=#c69b3a, PRIEST=#ffffff, DRUID=#ff7c0a, HUNTER=#aad372, ROGUE=#fff468, WARLOCK=#8788ee, SHAMAN=#0070dd
