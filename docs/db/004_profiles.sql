-- FitnessControl - tabla de perfiles de usuario
-- Esta tabla complementa Supabase Auth. No guarda passwords, solo datos de perfil.
-- La relacion con el usuario se hace via `auth.users(id)`.

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

comment on table public.profiles is 'Datos de perfil del usuario (onboarding) asociados a auth.users.';
comment on column public.profiles.user_id is 'FK a auth.users(id). Un perfil por usuario.';
comment on column public.profiles.goal is 'Objetivo del usuario (por ejemplo: perder_peso, ganar_musculo, mantenerse, resistencia).';
comment on column public.profiles.experience_level is 'Nivel de experiencia (principiante, intermedio, avanzado).';

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
