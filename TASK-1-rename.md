# TASK 1 of 2: Rename "Blådes Edge" → "Blades Edge"

This is the first of two tasks. Do only this one. TASK-2 (the WoW: Forever fresh start) comes after this is committed and pushed.

The guild name must be plain ASCII everywhere: **Blades Edge**. No å, no Å.

Before touching anything, read `node_modules/next/dist/docs/` for anything you're unsure about (see AGENTS.md). **Use grep to find real files. Do not assume paths.**

---

## Rules
- Change **only the guild name**. Do NOT touch character names or character data (Åvatarødys, Æminåmi, Ðjenna, Tøph, etc. stay exactly as they are).
- Do NOT touch the special-character search normalization map (Ð→D, Å→A, ß→B, etc.). It still matters for character search.
- Do NOT use `.toUpperCase()` on character names anywhere (known ß→SS bug). If you need uppercase guild name text, hardcode `BLADES EDGE`.
- Do not change any animations. `animation-fill-mode` stays `both`.

## Steps
1. Find every occurrence, including uppercase, lowercase, HTML entities, and unicode escapes:
   ```
   grep -rniE "blådes|bl&aring;des|bl\\\\u00e5des|bl\\\\u00c5des|BLÅDES" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git .
   ```
2. Replace each with `Blades` / `BLADES` / `blades` matching the original case. Cover: page copy, navbar/footer, `<title>` and `metadata` exports, Open Graph / Twitter metadata, `manifest`, alt text, email templates, Discord/webhook message text, feed message templates, README, AGENTS.md.
3. In AGENTS.md, delete the "Nordic å in name" explanation and state: *Guild name is "Blades Edge" — plain ASCII, no special characters.*
4. Check the database (service role client) for stored strings containing the old name, e.g. feed items, notifications, settings rows. Update them to "Blades Edge".
5. Re-run the grep from step 1. It must return **zero** results.

## Finish
1. `npm run build` → fix ALL errors
2. `git add -A && git commit -m "chore: rename guild to Blades Edge (no special characters)" && git push origin main`

## Final summary must include
1. List of files changed
2. Any database rows updated (table + count)
3. The zero-result output of the step 1 grep
