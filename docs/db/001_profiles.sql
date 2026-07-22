-- 001_profiles.sql
-- Crea la tabla `public.profiles` (1:1 con `auth.users`) con RLS y policies.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  age integer,
  gender text,
  height_cm numeric(6,2),
  weight_kg numeric(6,2),
  goal text not null,
  experience_level text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists age integer;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists height_cm numeric(6,2);
alter table public.profiles add column if not exists weight_kg numeric(6,2);
alter table public.profiles add column if not exists goal text;
alter table public.profiles add column if not exists experience_level text;
alter table public.profiles
  add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.profiles
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

comment on table public.profiles is 'Perfil del usuario (onboarding). Relación 1:1 con auth.users.';
comment on column public.profiles.user_id is 'PK y FK a auth.users(id).';
comment on column public.profiles.goal is 'Objetivo del usuario: perder_peso | ganar_musculo | mantenerse | resistencia.';
comment on column public.profiles.experience_level is 'Nivel: principiante | intermedio | avanzado.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_goal_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_goal_check
      check (goal in ('perder_peso', 'ganar_musculo', 'mantenerse', 'resistencia'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_experience_level_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_experience_level_check
      check (experience_level in ('principiante', 'intermedio', 'avanzado'));
  end if;
end;
$$;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create index if not exists idx_profiles_updated_at on public.profiles (updated_at);
