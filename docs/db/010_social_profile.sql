-- 010_social_profile.sql
-- Convierte el perfil en un perfil estilo red social:
-- - avatar, biografia y visibilidad configurable (privado/amigos/publico) por seccion en `profiles`
-- - sistema de amigos con solicitud + aceptacion mutua (`friendships`)
-- - PRs (`personal_records`), comidas favoritas (`favorite_foods`) y horario de gym (`gym_schedule`)
-- - funcion `search_profiles` para poder buscar gente sin exponer datos sensibles de otros usuarios
-- - bucket de Storage `avatars` con politicas de carpeta propia
--
-- Decisiones de seguridad:
-- 1. La lectura de un perfil ajeno (con logica de amistad + visibilidad) la hace el backend
--    con la service key, NO la RLS de estas tablas. La RLS de aqui protege el acceso directo
--    "solo dueno" cuando el frontend llama a Supabase directamente para leer/escribir sus propios datos.
-- 2. En `friendships`, solo el addressee puede aceptar/rechazar (UPDATE). El requester nunca
--    puede hacer UPDATE, solo INSERT (crear) o DELETE (cancelar) - evita que alguien se
--    auto-acepte su propia solicitud.

-- =====================================================================
-- 1. Extension de `profiles`: identidad social y visibilidad por seccion
-- =====================================================================

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists measurements_visibility text not null default 'private';
alter table public.profiles add column if not exists prs_visibility text not null default 'private';
alter table public.profiles add column if not exists favorite_foods_visibility text not null default 'private';
alter table public.profiles add column if not exists gym_schedule_visibility text not null default 'private';
alter table public.profiles add column if not exists streak_visibility text not null default 'private';
alter table public.profiles add column if not exists routine_preview_visibility text not null default 'private';

comment on column public.profiles.avatar_url is 'URL publica de la foto de perfil (bucket de Storage `avatars`).';
comment on column public.profiles.bio is 'Biografia corta del usuario, visible para cualquiera que pueda ver el perfil.';
comment on column public.profiles.measurements_visibility is 'Visibilidad de la seccion de medidas corporales: private | friends | public.';
comment on column public.profiles.prs_visibility is 'Visibilidad de la seccion de PRs: private | friends | public.';
comment on column public.profiles.favorite_foods_visibility is 'Visibilidad de la seccion de comidas favoritas: private | friends | public.';
comment on column public.profiles.gym_schedule_visibility is 'Visibilidad de la seccion de horario de gym: private | friends | public.';
comment on column public.profiles.streak_visibility is 'Visibilidad de la racha de cumplimiento de rutina: private | friends | public.';
comment on column public.profiles.routine_preview_visibility is 'Visibilidad del shortcut/preview de la rutina actual: private | friends | public.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_measurements_visibility_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_measurements_visibility_check
      check (measurements_visibility in ('private', 'friends', 'public'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_prs_visibility_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_prs_visibility_check
      check (prs_visibility in ('private', 'friends', 'public'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_favorite_foods_visibility_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_favorite_foods_visibility_check
      check (favorite_foods_visibility in ('private', 'friends', 'public'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_gym_schedule_visibility_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_gym_schedule_visibility_check
      check (gym_schedule_visibility in ('private', 'friends', 'public'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_streak_visibility_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_streak_visibility_check
      check (streak_visibility in ('private', 'friends', 'public'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_routine_preview_visibility_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_routine_preview_visibility_check
      check (routine_preview_visibility in ('private', 'friends', 'public'));
  end if;
end;
$$;

-- =====================================================================
-- 2. Tabla `friendships`: solicitud + aceptacion mutua
-- =====================================================================

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.friendships add column if not exists requester_id uuid references auth.users (id) on delete cascade;
alter table public.friendships add column if not exists addressee_id uuid references auth.users (id) on delete cascade;
alter table public.friendships add column if not exists status text not null default 'pending';
alter table public.friendships
  add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.friendships
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

comment on table public.friendships is 'Relacion de amistad entre dos usuarios: solicitud (pending) que el addressee acepta o rechaza.';
comment on column public.friendships.status is 'Estado de la solicitud: pending | accepted | declined.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'friendships_status_check'
      and conrelid = 'public.friendships'::regclass
  ) then
    alter table public.friendships
      add constraint friendships_status_check
      check (status in ('pending', 'accepted', 'declined'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'friendships_no_self_check'
      and conrelid = 'public.friendships'::regclass
  ) then
    alter table public.friendships
      add constraint friendships_no_self_check
      check (requester_id <> addressee_id);
  end if;
end;
$$;

create unique index if not exists idx_friendships_unique_pair
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index if not exists idx_friendships_requester on public.friendships (requester_id, status);
create index if not exists idx_friendships_addressee on public.friendships (addressee_id, status);

alter table public.friendships enable row level security;

drop policy if exists "friendships_select_own" on public.friendships;
drop policy if exists "friendships_insert_as_requester" on public.friendships;
drop policy if exists "friendships_update_respond" on public.friendships;
drop policy if exists "friendships_delete_own" on public.friendships;

create policy "friendships_select_own"
on public.friendships
for select
to authenticated
using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships_insert_as_requester"
on public.friendships
for insert
to authenticated
with check (auth.uid() = requester_id and status = 'pending');

-- Solo el addressee puede aceptar/rechazar. El requester NUNCA hace update
-- (evita que se auto-acepte su propia solicitud); para re-solicitar tras un
-- rechazo, el frontend hace DELETE de la fila declined + INSERT nuevo.
create policy "friendships_update_respond"
on public.friendships
for update
to authenticated
using (auth.uid() = addressee_id and status = 'pending')
with check (auth.uid() = addressee_id and status in ('accepted', 'declined'));

create policy "friendships_delete_own"
on public.friendships
for delete
to authenticated
using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop trigger if exists friendships_set_updated_at on public.friendships;
create trigger friendships_set_updated_at
before update on public.friendships
for each row
execute function public.set_updated_at();

-- =====================================================================
-- 3. Tabla `personal_records`: PRs / records personales
-- =====================================================================

create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_name text not null,
  record_type text not null,
  value numeric(8,2) not null,
  unit text,
  achieved_date date not null default current_date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.personal_records add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.personal_records add column if not exists exercise_name text;
alter table public.personal_records add column if not exists record_type text;
alter table public.personal_records add column if not exists value numeric(8,2);
alter table public.personal_records add column if not exists unit text;
alter table public.personal_records add column if not exists achieved_date date not null default current_date;
alter table public.personal_records add column if not exists notes text;
alter table public.personal_records
  add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.personal_records
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

comment on table public.personal_records is 'Records personales (PRs) del usuario: peso, reps, tiempo o distancia.';
comment on column public.personal_records.record_type is 'Tipo de record: peso | reps | tiempo | distancia.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'personal_records_record_type_check'
      and conrelid = 'public.personal_records'::regclass
  ) then
    alter table public.personal_records
      add constraint personal_records_record_type_check
      check (record_type in ('peso', 'reps', 'tiempo', 'distancia'));
  end if;
end;
$$;

create index if not exists idx_personal_records_user_date
  on public.personal_records (user_id, achieved_date desc);

alter table public.personal_records enable row level security;

drop policy if exists "personal_records_select_own" on public.personal_records;
drop policy if exists "personal_records_insert_own" on public.personal_records;
drop policy if exists "personal_records_update_own" on public.personal_records;
drop policy if exists "personal_records_delete_own" on public.personal_records;

create policy "personal_records_select_own"
on public.personal_records
for select
to authenticated
using (auth.uid() = user_id);

create policy "personal_records_insert_own"
on public.personal_records
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "personal_records_update_own"
on public.personal_records
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "personal_records_delete_own"
on public.personal_records
for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists personal_records_set_updated_at on public.personal_records;
create trigger personal_records_set_updated_at
before update on public.personal_records
for each row
execute function public.set_updated_at();

-- =====================================================================
-- 4. Tabla `favorite_foods`: comidas favoritas
-- =====================================================================

create table if not exists public.favorite_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  meal_type text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.favorite_foods add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.favorite_foods add column if not exists name text;
alter table public.favorite_foods add column if not exists meal_type text;
alter table public.favorite_foods add column if not exists notes text;
alter table public.favorite_foods
  add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.favorite_foods
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

comment on table public.favorite_foods is 'Comidas favoritas del usuario, opcionalmente asociadas a un tipo de comida.';
comment on column public.favorite_foods.meal_type is 'Tipo de comida: desayuno | almuerzo | cena | snack (opcional).';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'favorite_foods_meal_type_check'
      and conrelid = 'public.favorite_foods'::regclass
  ) then
    alter table public.favorite_foods
      add constraint favorite_foods_meal_type_check
      check (meal_type is null or meal_type in ('desayuno', 'almuerzo', 'cena', 'snack'));
  end if;
end;
$$;

create index if not exists idx_favorite_foods_user on public.favorite_foods (user_id);

alter table public.favorite_foods enable row level security;

drop policy if exists "favorite_foods_select_own" on public.favorite_foods;
drop policy if exists "favorite_foods_insert_own" on public.favorite_foods;
drop policy if exists "favorite_foods_update_own" on public.favorite_foods;
drop policy if exists "favorite_foods_delete_own" on public.favorite_foods;

create policy "favorite_foods_select_own"
on public.favorite_foods
for select
to authenticated
using (auth.uid() = user_id);

create policy "favorite_foods_insert_own"
on public.favorite_foods
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "favorite_foods_update_own"
on public.favorite_foods
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "favorite_foods_delete_own"
on public.favorite_foods
for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists favorite_foods_set_updated_at on public.favorite_foods;
create trigger favorite_foods_set_updated_at
before update on public.favorite_foods
for each row
execute function public.set_updated_at();

-- =====================================================================
-- 5. Tabla `gym_schedule`: horario semanal de gym
-- =====================================================================

create table if not exists public.gym_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day_of_week integer not null,
  start_time time not null,
  end_time time not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.gym_schedule add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.gym_schedule add column if not exists day_of_week integer;
alter table public.gym_schedule add column if not exists start_time time;
alter table public.gym_schedule add column if not exists end_time time;
alter table public.gym_schedule add column if not exists notes text;
alter table public.gym_schedule
  add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.gym_schedule
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

comment on table public.gym_schedule is 'Horario semanal de gym del usuario, un rango horario por dia de la semana.';
comment on column public.gym_schedule.day_of_week is '0=Lunes ... 6=Domingo, igual que routine_days.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'gym_schedule_day_of_week_check'
      and conrelid = 'public.gym_schedule'::regclass
  ) then
    alter table public.gym_schedule
      add constraint gym_schedule_day_of_week_check
      check (day_of_week between 0 and 6);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'gym_schedule_time_range_check'
      and conrelid = 'public.gym_schedule'::regclass
  ) then
    alter table public.gym_schedule
      add constraint gym_schedule_time_range_check
      check (end_time > start_time);
  end if;
end;
$$;

create unique index if not exists idx_gym_schedule_unique_day
  on public.gym_schedule (user_id, day_of_week);

alter table public.gym_schedule enable row level security;

drop policy if exists "gym_schedule_select_own" on public.gym_schedule;
drop policy if exists "gym_schedule_insert_own" on public.gym_schedule;
drop policy if exists "gym_schedule_update_own" on public.gym_schedule;
drop policy if exists "gym_schedule_delete_own" on public.gym_schedule;

create policy "gym_schedule_select_own"
on public.gym_schedule
for select
to authenticated
using (auth.uid() = user_id);

create policy "gym_schedule_insert_own"
on public.gym_schedule
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "gym_schedule_update_own"
on public.gym_schedule
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "gym_schedule_delete_own"
on public.gym_schedule
for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists gym_schedule_set_updated_at on public.gym_schedule;
create trigger gym_schedule_set_updated_at
before update on public.gym_schedule
for each row
execute function public.set_updated_at();

-- =====================================================================
-- 6. Funcion `search_profiles`: buscar usuarios para agregar como amigos
-- =====================================================================
-- SECURITY DEFINER porque la RLS de `profiles` es estrictamente "solo dueno";
-- esta funcion expone unicamente user_id/full_name/avatar_url de otros
-- usuarios (nunca peso/objetivo/nivel), y solo es ejecutable por `authenticated`.

create or replace function public.search_profiles(search_query text)
returns table (user_id uuid, full_name text, avatar_url text)
language sql
security definer
set search_path = public
as $$
  select p.user_id, p.full_name, p.avatar_url
  from public.profiles p
  where p.user_id <> auth.uid()
    and p.full_name ilike '%' || search_query || '%'
  order by p.full_name
  limit 20;
$$;

revoke all on function public.search_profiles(text) from public;
grant execute on function public.search_profiles(text) to authenticated;

-- =====================================================================
-- 7. Bucket de Storage `avatars` + politicas de carpeta propia
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 3145728, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_own_folder_insert" on storage.objects;
drop policy if exists "avatars_own_folder_update" on storage.objects;
drop policy if exists "avatars_own_folder_delete" on storage.objects;

create policy "avatars_public_read"
on storage.objects
for select
using (bucket_id = 'avatars');

create policy "avatars_own_folder_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_own_folder_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_own_folder_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Nota: subir archivos a la ruta `{user_id}/archivo.ext` para que
-- (storage.foldername(name))[1] coincida con auth.uid().
