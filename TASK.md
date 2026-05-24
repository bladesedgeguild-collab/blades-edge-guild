# TASK: Audit and definitively fix display_name being overwritten on login

## Problem
Despite multiple fix attempts, display_name is still being reset on every login.
A direct SQL update setting display_name = 'Teiston' is immediately overwritten
when the user logs in. This task must find every single place in the codebase
that writes to display_name and eliminate all writes outside of onboarding.

## Step 1 — Full codebase audit

Run this command and paste the output as a comment in the code:
```bash
grep -rn "display_name" app/ --include="*.ts" --include="*.tsx"
```

Every file and line number that mentions display_name must be reviewed.

## Step 2 — Print the current state of the auth callback

Output the full contents of app/auth/callback/route.ts to the console during
the build so we can see exactly what is there. Add this at the top of the file
temporarily:
```ts
console.log('AUTH CALLBACK FILE LOADED');
```

## Step 3 — Rules for every file found in Step 1

For EACH file that writes display_name:

### If it is app/auth/callback/route.ts:
Remove display_name completely. The file must have ZERO writes to display_name.
Use this exact pattern — no upsert, explicit branch:

```ts
const { data: existingUser } = await supabaseAdmin
  .from('users')
  .select('id, display_name')
  .eq('id', user.id)
  .single();

if (existingUser) {
  // Existing user — ONLY update auth metadata
  await supabaseAdmin
    .from('users')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', user.id);
} else {
  // New user — insert WITHOUT display_name
  await supabaseAdmin
    .from('users')
    .insert({
      id: user.id,
      role: 'member',
      has_completed_onboarding: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
}
```

Use supabaseAdmin (service role) for this — not the anon client.

### If it is middleware.ts or any layout file:
Remove the display_name write entirely.

### If it is any onboarding route or action:
Leave it — onboarding is the ONLY permitted writer of display_name.

### If it is anywhere else:
Remove it.

## Step 4 — Verify with grep after changes

After making all changes, run again:
```bash
grep -rn "display_name" app/ --include="*.ts" --include="*.tsx"
```

The only results that should remain are:
- READ operations (SELECT, .select('display_name'))
- Writes inside onboarding routes only
- Zero writes in auth/callback/route.ts
- Zero writes in middleware
- Zero writes in any layout or provider file

If any non-onboarding write to display_name remains, remove it.

## Step 5 — Data fix SQL (run after deploy)

```sql
UPDATE public.users
SET display_name = 'Teiston',
    claimed_character_id = 'b9f49cb8-017b-4440-91b3-ac3ea256289e',
    has_completed_onboarding = true
WHERE id = '3787d5c3-f359-4ebd-bf90-08120267232b';

UPDATE public.users u
SET display_name = c.name
FROM public.characters c
WHERE u.claimed_character_id = c.id
  AND u.has_completed_onboarding = true
  AND (u.display_name IS NULL OR u.display_name = '');
```

## Verification

1. Run data fix SQL
2. Log in as aking81@gmail.com
3. Immediately run: SELECT display_name FROM public.users WHERE id = '3787d5c3-f359-4ebd-bf90-08120267232b';
4. Must return 'Teiston' — not 'aking81' or null
5. Hall must show 'Teiston' not 'Adventurer'
6. Navbar must show 'Teiston' not the email

## Do not touch
- Oath cinematic (animation-fill-mode: both)
- Landing page
- Onboarding display_name writes — these are correct and must stay
