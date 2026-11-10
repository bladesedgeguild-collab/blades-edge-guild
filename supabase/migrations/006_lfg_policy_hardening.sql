-- Tighten dungeon_lfg access. No rows are deleted or rewritten.
-- The site reads and writes LFG posts from server routes with the service
-- role, which bypasses RLS and keeps its full grants. Only the member-facing
-- Supabase roles (anon, authenticated) change here.

-- 1. Signed-out visitors cannot read posts at all, and signed-in members can
--    read every column except user_id (who posted is exposed by the site as
--    is_owner, never as a raw ID).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'dungeon_lfg' and policyname = 'Members view active LFG posts'
  ) then
    create policy "Members view active LFG posts"
      on public.dungeon_lfg for select
      to authenticated
      using (expires_at > now());
  end if;
end $$;

drop policy if exists "Anyone can view active LFG posts" on public.dungeon_lfg;

revoke all on public.dungeon_lfg from anon;
revoke select, insert, update, delete, truncate, references, trigger
  on public.dungeon_lfg from authenticated;

grant select (
  id, dungeon_slug, character_name, role, available_window, notes,
  current_group, responses, discord_alerted, expires_at, created_at,
  days_available, time_start, time_end, timezone_label,
  starts_at, ends_at, needs, discord_message_id
) on public.dungeon_lfg to authenticated;

-- 2. Posters can only edit their own notes directly. Group membership,
--    slot caps, schedule, and Discord fields stay server-managed.
grant update (notes) on public.dungeon_lfg to authenticated;

-- Production uses the "Users can ..." names; a fresh database built from
-- 005 uses the shorter names. Tighten whichever one exists.
do $$
declare
  pol text;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'dungeon_lfg'
      and policyname in ('Users can update own LFG posts', 'Users update own LFG posts')
  loop
    execute format(
      'alter policy %I on public.dungeon_lfg to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      pol
    );
  end loop;

  -- Posts are created by the server route, which validates the character,
  -- role, schedule, and group. Direct inserts are no longer granted.
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'dungeon_lfg'
      and policyname in ('Users can create own LFG posts', 'Users insert own LFG posts')
  loop
    execute format(
      'alter policy %I on public.dungeon_lfg to authenticated with check (auth.uid() = user_id)',
      pol
    );
  end loop;
end $$;

-- Responses: signed-out visitors get nothing; members keep their own rows.
revoke all on public.dungeon_lfg_responses from anon;
revoke delete, truncate, references, trigger
  on public.dungeon_lfg_responses from authenticated;
