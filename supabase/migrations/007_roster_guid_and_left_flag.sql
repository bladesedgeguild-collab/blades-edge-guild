-- Additive only. No rows are deleted and no existing values change.
-- guid: the in-game character GUID from GRM, used to match roster rows first.
-- left_guild_at: set by the officer roster sync when a GRM character is no
-- longer in the guild export. The row stays (and keeps any claim); it is just
-- hidden from the roster lists. Cleared again if the character comes back.
alter table public.characters add column if not exists guid text;
alter table public.characters add column if not exists left_guild_at timestamptz;

create unique index if not exists characters_guid_key
  on public.characters (guid)
  where guid is not null;
