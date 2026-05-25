# TASK: Fix duplicate character name error on re-onboarding after claim reset

## Problem
When a user resets their character claim and goes through new member onboarding
again with the same character name, they get:
  "duplicate key value violates unique constraint characters_name_realm_key (23505)"

The characters table has a unique constraint on (name, realm). When a user
resets their claim, their previous character row is left in the table but
unlinked from their user. Re-onboarding tries to insert a new row with the
same name and fails.

## Fix — app/api/characters/claim-new/route.ts

Before inserting a new character row, check if a character with the same
name + realm already exists. If it does and it is unclaimed (claimed_by IS NULL),
reuse it instead of inserting. If it exists and is claimed by someone else,
return a clear error.

Replace the current insert logic with this pattern:

```ts
const realm = 'Dreamscythe';

// Step 1: Check for existing character with same name + realm
const { data: existing } = await supabaseAdmin
  .from('characters')
  .select('id, claimed_by, status')
  .eq('name', characterName)
  .eq('realm', realm)
  .maybeSingle();

let characterId: string;

if (existing) {
  if (existing.claimed_by && existing.claimed_by !== userId) {
    // Claimed by someone else
    return NextResponse.json(
      { error: 'That character name is already claimed by another member.' },
      { status: 409 }
    );
  }
  // Unclaimed or previously belonged to this user — reuse it
  const { error: updateError } = await supabaseAdmin
    .from('characters')
    .update({
      claimed_by: userId,
      claimed_at: new Date().toISOString(),
      class: characterClass,
      race: characterRace,
      level: characterLevel,
      status: 'new',
      hide_from_roster: false,
    })
    .eq('id', existing.id);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to claim character', detail: updateError.message },
      { status: 500 }
    );
  }
  characterId = existing.id;

} else {
  // No existing row — insert fresh
  const { data: newChar, error: insertError } = await supabaseAdmin
    .from('characters')
    .insert({
      name: characterName,
      realm,
      class: characterClass,
      race: characterRace,
      level: characterLevel,
      status: 'new',
      claimed_by: userId,
      claimed_at: new Date().toISOString(),
      is_main: true,
      hide_from_roster: false,
      imported_from_grm: false,
    })
    .select('id')
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to create character', detail: insertError.message, code: insertError.code },
      { status: 500 }
    );
  }
  characterId = newChar.id;
}

// Step 2: Update users row
const { error: userError } = await supabaseAdmin
  .from('users')
  .update({
    claimed_character_id: characterId,
    display_name: characterName,
    has_completed_onboarding: true,
  })
  .eq('id', userId);

if (userError) {
  return NextResponse.json(
    { error: 'Failed to update user', detail: userError.message },
    { status: 500 }
  );
}

return NextResponse.json({ success: true, characterId });
```

## Also fix — claim reset flow

Find the route or action that handles "Reset Character Claim" (in the navbar
dropdown). When a user resets their claim, it should:

1. Set users.claimed_character_id = NULL
2. Set users.has_completed_onboarding = false  
3. Set users.display_name = NULL
4. Set characters.claimed_by = NULL and characters.claimed_at = NULL
   for the character they previously claimed

Currently step 4 is likely not happening, leaving orphaned claimed_by
references. Fix the reset handler to clear both sides.

## Verification

1. Create a new character named "ResetTest" through onboarding
2. After completing onboarding, use Reset Character Claim in navbar dropdown
3. Go through onboarding again, enter "ResetTest" as the name
4. Should succeed — no duplicate key error
5. Hall should show "ResetTest" as display name
6. Try entering a name already claimed by a DIFFERENT user
   → Should show "That character name is already claimed by another member"

## Do not touch
- Oath cinematic animations (animation-fill-mode: both)
- Landing page
- Any character data not directly involved in the reset/reclaim flow
