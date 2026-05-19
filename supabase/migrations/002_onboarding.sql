-- Run this in Supabase SQL editor before deploying
alter table public.users add column if not exists has_completed_onboarding boolean default false;
alter table public.users add column if not exists claimed_character_id uuid references public.characters(id);
alter table public.characters add column if not exists claimed_by uuid references public.users(id);
alter table public.characters add column if not exists claimed_at timestamptz;
