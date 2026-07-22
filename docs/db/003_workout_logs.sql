-- 003_workout_logs.sql
-- Crea `workout_logs` y `workout_log_exercises` (un row por set) con RLS/policies e índices.

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_id uuid references public.routines (id) on delete set null,
  workout_date date not null,
  duration_minutes integer,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.workout_logs is 'Registro de sesiones de entrenamiento realizadas por usuario.';
comment on column public.workout_logs.routine_id is 'Rutina usada (opcional).';
comment on column public.workout_logs.workout_date is 'Fecha de entrenamiento (zona local del usuario).';

alter table public.workout_logs enable row level security;

create policy "workout_logs_select_own"
on public.workout_logs
for select
using (auth.uid() = user_id);

create policy "workout_logs_insert_own"
on public.workout_logs
for insert
with check (auth.uid() = user_id);

create policy "workout_logs_update_own"
on public.workout_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "workout_logs_delete_own"
on public.workout_logs
for delete
using (auth.uid() = user_id);

drop trigger if exists workout_logs_set_updated_at on public.workout_logs;
create trigger workout_logs_set_updated_at
before update on public.workout_logs
for each row
execute function public.set_updated_at();

create index if not exists idx_workout_logs_user_date on public.workout_logs (user_id, workout_date desc);
create index if not exists idx_workout_logs_routine_id on public.workout_logs (routine_id);

-- Detalle por set: un registro por set realizado.
-- Decisión: esta estructura permite guardar progresión fina (reps/peso por set),
-- y a la vez se pueden agregar vistas agregadas por ejercicio cuando haga falta.
create table if not exists public.workout_log_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_log_id uuid not null references public.workout_logs (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  set_number integer not null default 1,
  reps integer,
  weight_kg numeric(8,2),
  rpe integer,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.workout_log_exercises is 'Detalle de sets realizados por sesión (un row por set).';
comment on column public.workout_log_exercises.set_number is 'Número de set dentro del ejercicio en esa sesión.';
comment on column public.workout_log_exercises.rpe is 'Esfuerzo percibido (opcional), 1-10.';

alter table public.workout_log_exercises
  add constraint workout_log_exercises_set_number_check
  check (set_number >= 1);

alter table public.workout_log_exercises
  add constraint workout_log_exercises_rpe_check
  check (rpe is null or (rpe >= 1 and rpe <= 10));

alter table public.workout_log_exercises enable row level security;

create policy "workout_log_exercises_select_own"
on public.workout_log_exercises
for select
using (auth.uid() = user_id);

create policy "workout_log_exercises_insert_own"
on public.workout_log_exercises
for insert
with check (auth.uid() = user_id);

create policy "workout_log_exercises_delete_own"
on public.workout_log_exercises
for delete
using (auth.uid() = user_id);

create policy "workout_log_exercises_update_own"
on public.workout_log_exercises
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists idx_workout_log_exercises_user_id on public.workout_log_exercises (user_id);
create index if not exists idx_workout_log_exercises_log_id on public.workout_log_exercises (workout_log_id);
create index if not exists idx_workout_log_exercises_exercise_id on public.workout_log_exercises (exercise_id);
create index if not exists idx_workout_log_exercises_log_exercise on public.workout_log_exercises (workout_log_id, exercise_id);
