-- Run this in Supabase SQL editor before deploying

alter table public.characters add column if not exists hide_from_roster boolean default false;
alter table public.characters add column if not exists note text;
