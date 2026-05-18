# Current Task: Fix /auth/callback 404

## Problem
After Discord OAuth completes, the browser is redirected to:
  bladesedgeguild.com/auth/callback?code=XXXX

This returns a 404 — page not found.

## What needs to be fixed
Open app/(auth)/callback/route.ts and fix it so it:

1. Exports a proper GET function (not default export)
2. Uses createServerClient from @supabase/ssr to create a Supabase client inside the handler
3. Calls supabase.auth.exchangeCodeForSession(code) using the code from the URL search params
4. After successful session exchange, gets the user with supabase.auth.getUser()
5. Upserts a row into public.users using the service role client with these fields from user.user_metadata:
   - id = user.id
   - discord_id = user.user_metadata.provider_id or user.user_metadata.sub
   - discord_username = user.user_metadata.full_name or user.user_metadata.name
   - discord_avatar = user.user_metadata.avatar_url
   - display_name = user.user_metadata.global_name or user.user_metadata.full_name
   - role = 'pending' (only on insert, do not overwrite on update)
   - updated_at = now()
6. Redirects to /dashboard on success
7. Redirects to /login?error=auth_failed on any error

## Important
- Use the request URL's origin for redirect URLs (new URL(request.url).origin) not NEXT_PUBLIC_SITE_URL
- The route must be at app/(auth)/callback/route.ts — confirm this file exists and is in the right place
- Use NextResponse.redirect() for redirects
- Handle the case where code is missing in search params

## After fixing
1. Run npm run build
2. Fix any errors
3. git add -A && git commit -m "fix: auth callback 404 — correct GET handler and code exchange" && git push origin main
