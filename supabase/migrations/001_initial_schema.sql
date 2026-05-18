-- Users table (extends auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_id text,
  discord_username text,
  discord_avatar text,
  display_name text,
  role text not null default 'pending' check (role in ('pending','member','officer','gm','admin')),
  approved_at timestamptz,
  approved_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Characters table
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  realm text not null default 'Dreamscythe',
  class text not null,
  race text,
  sex text,
  level integer not null default 1,
  is_main boolean not null default false,
  rank_name text,
  rank_index integer,
  joined_guild_at timestamptz,
  last_zone text,
  hair_color text,
  skin_tone text,
  hair_style text,
  status text not null default 'mia' check (status in ('returned','mia','new')),
  imported_from_grm boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, realm)
);

-- Professions table
create table public.professions (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  name text not null,
  abbr text,
  skill_level integer not null default 0,
  is_primary boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Dungeon runs table
create table public.dungeon_runs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  dungeon_name text not null,
  quests text,
  notes text,
  scheduled_at timestamptz,
  status text not null default 'open',
  max_players integer not null default 5,
  level_min integer,
  level_max integer,
  created_at timestamptz not null default now()
);

-- Dungeon slots table
create table public.dungeon_slots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.dungeon_runs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  character_id uuid references public.characters(id) on delete set null,
  role text not null check (role in ('tank','healer','dps')),
  slot_order integer,
  signed_up_at timestamptz not null default now(),
  unique (run_id, user_id)
);

-- Notifications table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- GRM imports table
create table public.grm_imports (
  id uuid primary key default gen_random_uuid(),
  imported_by uuid not null references public.users(id) on delete cascade,
  characters_updated integer,
  characters_added integer,
  notes text,
  imported_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.users enable row level security;
alter table public.characters enable row level security;
alter table public.dungeon_runs enable row level security;
alter table public.dungeon_slots enable row level security;
alter table public.notifications enable row level security;
alter table public.professions enable row level security;
alter table public.grm_imports enable row level security;

-- Helper: check if caller is admin or gm
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('admin','gm')
  );
$$;

-- Helper: check if caller is approved member
create or replace function public.is_member()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('member','officer','gm','admin')
  );
$$;

-- Users policies
create policy "Members can view approved users" on public.users
  for select using (
    public.is_admin() or (public.is_member() and role != 'pending')
  );

create policy "Users can update own row" on public.users
  for update using (id = auth.uid());

create policy "Users can insert own row" on public.users
  for insert with check (id = auth.uid());

create policy "Admins bypass users" on public.users
  for all using (public.is_admin());

-- Characters policies
create policy "Members can view all characters" on public.characters
  for select using (public.is_member());

create policy "Users manage own characters" on public.characters
  for all using (user_id = auth.uid());

create policy "Admins bypass characters" on public.characters
  for all using (public.is_admin());

-- Dungeon runs policies
create policy "Members can view all runs" on public.dungeon_runs
  for select using (public.is_member());

create policy "Users manage own runs" on public.dungeon_runs
  for all using (created_by = auth.uid());

-- Dungeon slots policies
create policy "Members can view all slots" on public.dungeon_slots
  for select using (public.is_member());

create policy "Users manage own slots" on public.dungeon_slots
  for all using (user_id = auth.uid());

-- Notifications policies
create policy "Users see own notifications" on public.notifications
  for all using (user_id = auth.uid());

-- Professions policies
create policy "Members can view professions" on public.professions
  for select using (public.is_member());

create policy "Users manage own character professions" on public.professions
  for all using (
    character_id in (select id from public.characters where user_id = auth.uid())
  );

-- GRM imports policies
create policy "Admins manage grm imports" on public.grm_imports
  for all using (public.is_admin());

create policy "Members view grm imports" on public.grm_imports
  for select using (public.is_member());
