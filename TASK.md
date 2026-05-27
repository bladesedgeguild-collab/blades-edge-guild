# TASK: Unify onboarding into single search-first flow

## Problem
Onboarding currently presents two explicit paths to the user:
- "I'm a returning member" 
- "I'm new to the guild"

This is wrong. Users shouldn't have to know which category they are.
A new member might already be in the roster from a GRM import (status=mia).
A returning member might not find themselves if they search wrong.

The correct flow is one unified path:
1. "What is your character's name?" — search bar, that's it
2. IF FOUND in roster → show character card → confirm + claim
3. IF NOT FOUND → show new character form (name pre-filled, add race/class/level)
4. Both paths lead to oath cinematic → alts → Hall

---

## New unified onboarding flow

### Step 1 — Search (same for everyone)
Single screen with:
- Heading: "Find Your Character"
- Subheading: "Search the guild roster by name"
- Search input with special character normalization (D→Ð, A→Å, B→ß)
- Results appear as character cards below as they type
- If results found: show up to 5 matching cards, user clicks theirs
- If no results: show message "Not in the roster yet?" with button
  "Create New Character →" which pre-fills the name they typed

No "Are you new or returning?" question. Ever.

### Step 2A — Found: Confirm existing character
Same as current Path A Step 2:
- Show character card with name, class, race, level, rank, professions
- "Yes, this is me →" button claims the character
- "Not me, search again ←" button goes back

### Step 2B — Not found: Create new character  
Same as current Path B but name is pre-filled from their search:
- Name field pre-filled (editable)
- Race dropdown
- Class dropdown (filtered by race, TBC Alliance rules)
- Level field (text input, numeric, no spinner)
- "Continue →" 

### Step 3 — Oath cinematic
Same for both paths. No change.

### Step 4 — Add Alts
After oath cinematic, show alt-adding screen.
This step uses the SAME unified search flow:
- "Do you have alts in the guild?" with "Add an Alt" button
- Clicking it opens the same search → found/not-found flow
- Each alt added gets its own oath? NO — no cinematic for alts,
  just a quick confirm card then back to the alts list
- "Done, take me to the Hall →" skips or finishes alt adding

The alt search should find characters where:
- claimed_by IS NULL (unclaimed)
- name matches search
No cinematic for alts — just confirm card + add to list.

---

## DB / API changes

### No new tables needed.

### Update the claim flow to handle both cases from one endpoint
The existing /api/characters/claim route handles returning members.
The existing /api/characters/claim-new route handles new members.

These can stay as separate API routes — the frontend just calls the
right one based on whether the character was found in the roster or not.
The user never sees this distinction.

### Alt claiming
Create or update /api/characters/claim-alt route:
- Accepts character_id (for roster alts) OR new character data
- Sets claimed_by = userId, is_main = false on the character
- Does NOT set has_completed_onboarding or display_name
- Does NOT trigger oath cinematic

---

## What to remove
- Remove any UI that says "I'm a returning member" / "I'm new"
- Remove any branching step that asks the user to self-categorize
- Remove Path A / Path B labels from the code comments (replace with
  "roster claim" and "new character" internally)

## What to keep
- All existing search normalization logic (D→Ð, A→Å, B→ß)
- Oath cinematic — unchanged, fires for main character only
- be-stamp keyframe — do not touch
- animation-fill-mode: both — never change to forwards
- All character art (figures flanking the seal)
- Level input as text field (from previous fix)

---

## Verification
1. New user onboards — sees only a search bar, no path choice
2. Searches "Darliouse" — finds the roster character, claims it
3. Searches "Brandnewguy" — no results, falls through to create form
   with "Brandnewguy" pre-filled as name
4. Both paths reach oath cinematic correctly
5. After cinematic, alt-adding screen appears
6. Alt search finds unclaimed roster characters
7. Alt search falls through to new character form if not found
8. No cinematic for alts — just quick confirm
9. "Done" takes user to Hall

## Do not touch
- Oath cinematic animations
- Character art figures
- Hall page
- Landing page
- /import page
