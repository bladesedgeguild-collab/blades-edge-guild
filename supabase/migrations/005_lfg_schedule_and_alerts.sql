-- LFG scheduling, per-character roles, and alert preferences.
-- APPLY THIS FILE TO PRODUCTION (Supabase project yimbusnvskaogmnavuoz).
-- Additive only: no rows are deleted or rewritten.
-- 004_dungeons_table.sql does NOT need to be applied. The finder reads
-- data/dungeons, and public.dungeons is not used.

-- The live dungeon_lfg table was created outside this repo. Create it only
-- when a fresh database does not have it yet.
create table if not exists public.dungeon_lfg (
  id uuid primary key default gen_random_uuid(),
  dungeon_slug text not null,
  user_id uuid not null references public.users(id) on delete cascade,
  character_name text not null,
  role text not null check (role in ('Tank', 'Healer', 'DPS', 'Flex')),
  available_window text,
  notes text,
  current_group jsonb not null default '{"tank":[],"healer":[],"dps":[]}'::jsonb,
  responses jsonb,
  discord_alerted boolean not null default false,
  expires_at timestamptz not null default (now() + interval '1 day'),
  created_at timestamptz not null default now(),
  days_available text[],
  time_start text,
  time_end text,
  timezone_label text
);

create table if not exists public.dungeon_lfg_responses (
  id uuid primary key default gen_random_uuid(),
  lfg_id uuid not null references public.dungeon_lfg(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  response text not null check (response in ('accepted', 'declined', 'dismissed')),
  character_name text,
  created_at timestamptz not null default now(),
  unique (lfg_id, user_id)
);

alter table public.dungeon_lfg
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists needs jsonb,
  add column if not exists discord_message_id text;

comment on column public.dungeon_lfg.starts_at is 'Scheduled start, stored in UTC.';
comment on column public.dungeon_lfg.ends_at is 'Scheduled end. expires_at is set to this.';
comment on column public.dungeon_lfg.needs is 'Slot caps, e.g. {"tank":1,"healer":1,"dps":3}.';

alter table public.dungeon_lfg enable row level security;
alter table public.dungeon_lfg_responses enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'dungeon_lfg' and policyname = 'Anyone can view active LFG posts'
  ) then
    create policy "Anyone can view active LFG posts"
      on public.dungeon_lfg for select
      to anon, authenticated
      using (expires_at > now());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'dungeon_lfg' and policyname = 'Users insert own LFG posts'
  ) then
    create policy "Users insert own LFG posts"
      on public.dungeon_lfg for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'dungeon_lfg' and policyname = 'Users update own LFG posts'
  ) then
    create policy "Users update own LFG posts"
      on public.dungeon_lfg for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'dungeon_lfg_responses' and policyname = 'Users read own LFG responses'
  ) then
    create policy "Users read own LFG responses"
      on public.dungeon_lfg_responses for select
      to authenticated
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'dungeon_lfg_responses' and policyname = 'Users insert own LFG responses'
  ) then
    create policy "Users insert own LFG responses"
      on public.dungeon_lfg_responses for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'dungeon_lfg_responses' and policyname = 'Users update own LFG responses'
  ) then
    create policy "Users update own LFG responses"
      on public.dungeon_lfg_responses for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;

grant select on public.dungeon_lfg to anon, authenticated;
grant insert, update on public.dungeon_lfg to authenticated;
grant select, insert, update on public.dungeon_lfg_responses to authenticated;

-- Null roles means "use the class default". Members set this per character.
alter table public.characters
  add column if not exists roles text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'characters_roles_allowed'
  ) then
    alter table public.characters
      add constraint characters_roles_allowed
      check (roles is null or roles <@ array['Tank', 'Healer', 'DPS']::text[]);
  end if;
end $$;

create table if not exists public.notification_prefs (
  user_id uuid primary key references public.users(id) on delete cascade,
  site_banner boolean not null default true,
  discord_mentions boolean not null default false,
  match_character_ids uuid[],
  updated_at timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notification_prefs' and policyname = 'Users read own alert prefs'
  ) then
    create policy "Users read own alert prefs"
      on public.notification_prefs for select
      to authenticated
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notification_prefs' and policyname = 'Users insert own alert prefs'
  ) then
    create policy "Users insert own alert prefs"
      on public.notification_prefs for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notification_prefs' and policyname = 'Users update own alert prefs'
  ) then
    create policy "Users update own alert prefs"
      on public.notification_prefs for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;

grant select, insert, update on public.notification_prefs to authenticated;

create table if not exists public.lfg_alerts (
  id uuid primary key default gen_random_uuid(),
  lfg_id uuid not null references public.dungeon_lfg(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete set null,
  channel text not null check (channel in ('discord', 'site')),
  sent_at timestamptz not null default now(),
  unique (lfg_id, user_id, channel)
);

alter table public.lfg_alerts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lfg_alerts' and policyname = 'Users read own lfg alerts'
  ) then
    create policy "Users read own lfg alerts"
      on public.lfg_alerts for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

grant select on public.lfg_alerts to authenticated;

create index if not exists dungeon_lfg_expires_at_idx on public.dungeon_lfg (expires_at);
create index if not exists dungeon_lfg_starts_at_idx on public.dungeon_lfg (starts_at);
create index if not exists lfg_alerts_user_sent_idx on public.lfg_alerts (user_id, sent_at);

-- Slot claim locks the post row so two accepts cannot both take the last spot.
-- Invoker rights, executable by service_role only (not a security definer in public).
create or replace function public.lfg_claim_slot(
  p_lfg_id uuid,
  p_role text,
  p_member jsonb
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  rec public.dungeon_lfg%rowtype;
  arr jsonb;
  cap integer;
  member_name text;
  member_id text;
begin
  if p_role not in ('tank', 'healer', 'dps') then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  select * into rec from public.dungeon_lfg where id = p_lfg_id for update;
  if not found or rec.expires_at <= now() then
    raise exception 'not found' using errcode = 'P0002';
  end if;

  rec.current_group := coalesce(rec.current_group, '{}'::jsonb);
  member_name := coalesce(p_member->>'name', '');
  member_id := coalesce(p_member->>'characterId', '');
  if member_name = '' then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_each(rec.current_group) as roles(role_key, role_value)
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(role_value) = 'array' then role_value else '[]'::jsonb end
    ) as elem
    where (jsonb_typeof(elem) = 'string' and elem #>> '{}' = member_name)
       or elem->>'name' = member_name
       or (member_id <> '' and elem->>'characterId' = member_id)
  ) then
    return rec.current_group;
  end if;

  arr := rec.current_group->p_role;
  if arr is null or jsonb_typeof(arr) <> 'array' then
    arr := '[]'::jsonb;
  end if;

  cap := coalesce(
    (rec.needs->>p_role)::integer,
    case p_role when 'tank' then 1 when 'healer' then 1 else 3 end
  );

  if (select count(*) from jsonb_array_elements(arr)) >= cap then
    raise exception 'full' using errcode = '23514';
  end if;

  arr := arr || jsonb_build_array(p_member);
  update public.dungeon_lfg
    set current_group = jsonb_set(rec.current_group, array[p_role], arr, true)
    where id = p_lfg_id
    returning current_group into arr;

  return arr;
end;
$$;

revoke all on function public.lfg_claim_slot(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.lfg_claim_slot(uuid, text, jsonb) to service_role;
