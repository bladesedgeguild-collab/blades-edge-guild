# Current Task: Import Guild Roster from JSON into Database

## Overview
Import the complete Blådes Edge guild roster from blades_edge_roster.json into
the Supabase database. This seeds all characters, professions, and alt relationships
so the site has real data immediately.

## The JSON file
The file blades_edge_roster.json is in the project root directory.
It contains 275 characters with statuses: returned, new, or mia.
Each character has professions and an alt_of field for alt relationships.

## Step 1 - Create the import API route

Create app/api/admin/import-roster/route.ts:

This is a POST endpoint that:
1. Checks the requesting user is admin or gm (use service role client to check public.users)
2. Reads the JSON body which is the full roster object
3. For each character in characters array:
   a. Upsert into public.characters table:
      - name: character.name
      - realm: character.realm (default 'Dreamscythe')
      - class: character.class
      - level: character.level
      - rank_name: character.rank_name
      - rank_index: character.rank_index
      - note: character.note
      - status: character.status (returned/mia/new)
      - imported_from_grm: true
      - race: character.race if present
      - sex: character.sex if present
      - updated_at: now()
      On conflict (name, realm): update all fields except id and created_at
   b. For each profession in character.professions array:
      - First delete existing professions for this character
      - Insert new professions: character_id, name, abbr, skill_level, is_primary (first two are primary)
4. After all characters imported, handle alt relationships:
   - For each character where alt_of is not null:
     - Find the main character by name in the characters table
     - This is stored in the note field for now - we will handle linking later
     - Store alt_of name in a temporary way we can use
5. Return JSON: { imported: N, errors: [] }

Use the service role client for all database operations to bypass RLS.
Process characters in batches of 50 to avoid timeouts.
Log any errors per character but continue processing.

## Step 2 - Create the admin import page

Create app/(admin)/import/page.tsx:

This is a client component with:

Section 1 - Roster Import:
Heading: "Import Guild Roster" in Cinzel font, gold
Subtext: "Upload blades_edge_roster.json to seed the character database."

A file upload input that accepts .json files only.
When a file is selected, parse it and show a preview:
  - Total characters: X
  - Returned: X | New: X | MIA: X
  - A scrollable preview list of first 20 character names

A large "Import Roster" button that:
1. POSTs the parsed JSON to /api/admin/import-roster
2. Shows a progress indicator while running
3. On success shows: "Imported X characters successfully"
4. On error shows the error message

Section 2 - Manual character status update:
A simple form to manually update a single character's status:
  - Character name input with autocomplete from existing characters
  - Status dropdown: returned / mia / new
  - "Update" button that calls a PATCH to /api/admin/characters/[name]/status

## Step 3 - Create character status update API

Create app/api/admin/characters/route.ts:

PATCH handler:
- Body: { name: string, realm: string, status: string }
- Check user is admin/gm
- Update characters set status = body.status where name = body.name and realm = body.realm
- Return success

## Step 4 - Update the landing page return meter

In app/(public)/page.tsx, the ReturnMeter currently uses hardcoded values.
Update it to fetch real counts from the database:

Since this is a server component, add at the top:
  const supabase = createServerClient(...)
  const { count: returnedCount } = await supabase
    .from('characters')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'returned')
    .eq('realm', 'Dreamscythe')

  const { count: totalCount } = await supabase
    .from('characters')
    .select('*', { count: 'exact', head: true })
    .eq('realm', 'Dreamscythe')
    .neq('hide_from_roster', true)

Pass these as props to ReturnMeter: returned={returnedCount ?? 0} total={totalCount ?? 187}

## Step 5 - Update the flanking columns in the brotherhood section

In app/(public)/page.tsx, the left and right scrolling name columns need real data.

Fetch returned characters:
  const { data: returnedChars } = await supabase
    .from('characters')
    .select('name, class')
    .eq('status', 'returned')
    .eq('realm', 'Dreamscythe')
    .eq('hide_from_roster', false)
    .order('name')

Fetch MIA character names (limit to 50 for display):
  const { data: miaChars } = await supabase
    .from('characters')
    .select('name, class')
    .eq('status', 'mia')
    .eq('realm', 'Dreamscythe')
    .order('level', { ascending: false })
    .limit(50)

Pass these arrays to the flanking column components.
If returnedChars is empty, show the empty state: "Be the first to answer."

Note: The hide_from_roster column may not exist yet in the DB.
Handle gracefully - if the column does not exist just fetch without that filter.

## Step 6 - Add hide_from_roster column if not exists

Add to supabase/migrations/003_hide_from_roster.sql:
  alter table public.characters add column if not exists hide_from_roster boolean default false;

Add a comment in the code: "Run supabase/migrations/003_hide_from_roster.sql in Supabase SQL editor"

## After all changes:
1. Run npm run build
2. Fix any TypeScript errors
3. git add -A && git commit -m "feat: roster import tool and live data for return meter and flanking columns" && git push origin main

## Important notes:
- The blades_edge_roster.json file is in the project root
- Use service role client for all admin operations
- Handle missing columns gracefully with try/catch
- The import should be idempotent - running it twice should not create duplicates
- Do NOT import characters where hide_from_roster is true into the visible roster
