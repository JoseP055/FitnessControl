-- 011_profile_identity_and_pr_catalog.sql
-- Dos cambios sobre el perfil social:
-- 1. Identidad unica por usuario para buscar amigos de forma mas precisa que por
--    nombre: `public_id` (generado automaticamente, alfanumerico) y `username`
--    (elegido por el usuario, solo minusculas/numeros/guion bajo).
-- 2. Los PRs (`personal_records`) ahora referencian el catalogo existente de
--    `exercises` en vez de texto libre, para estandarizar y facilitar la busqueda.

-- =====================================================================
-- 1. `profiles.public_id` (autogenerado) y `profiles.username` (elegido)
-- =====================================================================

alter table public.profiles add column if not exists public_id text;
alter table public.profiles add column if not exists username text;

comment on column public.profiles.public_id is 'Identificador unico autogenerado (alfanumerico) para buscar/agregar amigos.';
comment on column public.profiles.username is 'Nombre de usuario elegido por el usuario: solo minusculas, numeros y guion bajo.';

-- Genera un public_id para las filas existentes que todavia no tengan uno.
update public.profiles
set public_id = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where public_id is null;

alter table public.profiles alter column public_id set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
alter table public.profiles alter column public_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_username_format_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check
      check (username is null or username ~ '^[a-z0-9_]{3,24}$');
  end if;
end;
$$;

create unique index if not exists idx_profiles_public_id on public.profiles (public_id);
create unique index if not exists idx_profiles_username on public.profiles (username) where username is not null;

-- =====================================================================
-- 2. `personal_records.exercise_id`: estandariza los PRs contra el catalogo
-- =====================================================================

alter table public.personal_records add column if not exists exercise_id uuid references public.exercises (id) on delete set null;

comment on column public.personal_records.exercise_id is 'Ejercicio del catalogo (public.exercises) sobre el que se registra el record. Nullable por compatibilidad con records legacy en texto libre.';

create index if not exists idx_personal_records_exercise_id on public.personal_records (exercise_id);

-- =====================================================================
-- 3. `search_profiles`: ahora tambien busca por username y public_id
-- =====================================================================

drop function if exists public.search_profiles(text);

create or replace function public.search_profiles(search_query text)
returns table (user_id uuid, full_name text, avatar_url text, username text, public_id text)
language sql
security definer
set search_path = public
as $$
  select p.user_id, p.full_name, p.avatar_url, p.username, p.public_id
  from public.profiles p
  where p.user_id <> auth.uid()
    and (
      p.full_name ilike '%' || search_query || '%'
      or p.username ilike '%' || search_query || '%'
      or p.public_id ilike search_query || '%'
    )
  order by p.full_name
  limit 20;
$$;

revoke all on function public.search_profiles(text) from public;
grant execute on function public.search_profiles(text) to authenticated;
