-- 002_routines_exercises.sql
-- Crea `routines`, `exercises` y `routine_exercises` con RLS/policies e índices.

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.routines is 'Rutinas creadas por cada usuario.';
comment on column public.routines.user_id is 'Dueño de la rutina (auth.users).';

alter table public.routines enable row level security;

drop policy if exists "routines_select_own" on public.routines;
drop policy if exists "routines_insert_own" on public.routines;
drop policy if exists "routines_update_own" on public.routines;
drop policy if exists "routines_delete_own" on public.routines;

create policy "routines_select_own"
on public.routines
for select
using (auth.uid() = user_id);

create policy "routines_insert_own"
on public.routines
for insert
with check (auth.uid() = user_id);

create policy "routines_update_own"
on public.routines
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "routines_delete_own"
on public.routines
for delete
using (auth.uid() = user_id);

drop trigger if exists routines_set_updated_at on public.routines;
create trigger routines_set_updated_at
before update on public.routines
for each row
execute function public.set_updated_at();

create index if not exists idx_routines_user_id on public.routines (user_id);
create index if not exists idx_routines_active on public.routines (user_id, is_active);

-- Catálogo de ejercicios: global + custom por usuario.
-- - created_by_user_id = NULL => ejercicio global (visible para cualquier usuario autenticado).
-- - created_by_user_id = auth.uid() => ejercicio personalizado del usuario.
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid references auth.users (id) on delete set null,
  name text not null,
  muscle_group text,
  equipment text,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.exercises
  add column if not exists created_by_user_id uuid references auth.users (id) on delete set null;
alter table public.exercises add column if not exists name text;
alter table public.exercises add column if not exists muscle_group text;
alter table public.exercises add column if not exists equipment text;
alter table public.exercises add column if not exists description text;
alter table public.exercises
  add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.exercises
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- Compatibilidad con esquemas viejos:
-- en una version previa `exercises` estaba atada directo a una rutina y `routine_id`
-- quedaba como obligatoria. Para el catalogo global nuevo esa columna ya no participa
-- del modelo, asi que si existe debe permitir NULL para no bloquear seeds globales.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exercises'
      and column_name = 'routine_id'
      and is_nullable = 'NO'
  ) then
    alter table public.exercises alter column routine_id drop not null;
  end if;
end;
$$;

drop policy if exists "exercises_select_global_or_own" on public.exercises;
drop policy if exists "exercises_insert_own" on public.exercises;
drop policy if exists "exercises_update_own" on public.exercises;
drop policy if exists "exercises_delete_own" on public.exercises;

comment on table public.exercises is 'Catálogo de ejercicios global + personalizados por usuario.';
comment on column public.exercises.created_by_user_id is 'NULL => global. Si no es NULL, dueño del ejercicio.';

alter table public.exercises enable row level security;

create policy "exercises_select_global_or_own"
on public.exercises
for select
using (
  auth.role() = 'authenticated'
  and (created_by_user_id is null or created_by_user_id = auth.uid())
);

create policy "exercises_insert_own"
on public.exercises
for insert
with check (created_by_user_id = auth.uid());

create policy "exercises_update_own"
on public.exercises
for update
using (created_by_user_id = auth.uid())
with check (created_by_user_id = auth.uid());

create policy "exercises_delete_own"
on public.exercises
for delete
using (created_by_user_id = auth.uid());

drop trigger if exists exercises_set_updated_at on public.exercises;
create trigger exercises_set_updated_at
before update on public.exercises
for each row
execute function public.set_updated_at();

create index if not exists idx_exercises_name on public.exercises (name);
create index if not exists idx_exercises_created_by on public.exercises (created_by_user_id);

-- Relación rutina <-> ejercicios con parámetros planeados.
-- Se guarda user_id para simplificar RLS y evitar joins en policies.
create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_id uuid not null references public.routines (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  sets_planned integer,
  reps_planned integer,
  rest_seconds integer,
  exercise_order integer not null default 1,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.routine_exercises is 'Ejercicios dentro de una rutina con sets/reps/rest planeados.';
comment on column public.routine_exercises.exercise_order is 'Orden dentro de la rutina.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'routine_exercises_order_check'
      and conrelid = 'public.routine_exercises'::regclass
  ) then
    alter table public.routine_exercises
      add constraint routine_exercises_order_check
      check (exercise_order >= 1);
  end if;
end;
$$;

alter table public.routine_exercises enable row level security;

drop policy if exists "routine_exercises_select_own" on public.routine_exercises;
drop policy if exists "routine_exercises_insert_own" on public.routine_exercises;
drop policy if exists "routine_exercises_update_own" on public.routine_exercises;
drop policy if exists "routine_exercises_delete_own" on public.routine_exercises;

create policy "routine_exercises_select_own"
on public.routine_exercises
for select
using (auth.uid() = user_id);

create policy "routine_exercises_insert_own"
on public.routine_exercises
for insert
with check (auth.uid() = user_id);

create policy "routine_exercises_update_own"
on public.routine_exercises
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "routine_exercises_delete_own"
on public.routine_exercises
for delete
using (auth.uid() = user_id);

drop trigger if exists routine_exercises_set_updated_at on public.routine_exercises;
create trigger routine_exercises_set_updated_at
before update on public.routine_exercises
for each row
execute function public.set_updated_at();

create index if not exists idx_routine_exercises_user_id on public.routine_exercises (user_id);
create index if not exists idx_routine_exercises_routine_id on public.routine_exercises (routine_id);
create index if not exists idx_routine_exercises_exercise_id on public.routine_exercises (exercise_id);
create index if not exists idx_routine_exercises_order on public.routine_exercises (routine_id, exercise_order);
