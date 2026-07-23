-- 017_exercise_completions.sql
-- Tracking de cumplimiento por EJERCICIO (no solo por dia). Cada fila marca
-- que un ejercicio puntual de una rutina se completo en una fecha dada.
-- `workout_completions` (dia completo) sigue existiendo y ahora la resincroniza
-- el backend automaticamente: cuando todos los ejercicios de un dia quedan
-- marcados para una fecha, el backend pone ese dia en 'done'; si se desmarca
-- alguno, vuelve a 'pending'. Streak, calendario y perfil social siguen
-- leyendo `workout_completions` sin cambios.

create table if not exists public.exercise_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_exercise_id uuid not null references public.routine_exercises (id) on delete cascade,
  completion_date date not null,
  completed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.exercise_completions add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.exercise_completions add column if not exists routine_exercise_id uuid references public.routine_exercises (id) on delete cascade;
alter table public.exercise_completions add column if not exists completion_date date;
alter table public.exercise_completions
  add column if not exists completed_at timestamptz not null default timezone('utc', now());
alter table public.exercise_completions
  add column if not exists created_at timestamptz not null default timezone('utc', now());

comment on table public.exercise_completions is 'Marca que un ejercicio puntual de una rutina se completo en una fecha dada (usado por el modo enfoque y el resumen de "hoy").';

create unique index if not exists idx_exercise_completions_unique
  on public.exercise_completions (user_id, routine_exercise_id, completion_date);

create index if not exists idx_exercise_completions_user_date
  on public.exercise_completions (user_id, completion_date desc);

alter table public.exercise_completions enable row level security;

drop policy if exists "exercise_completions_select_own" on public.exercise_completions;
drop policy if exists "exercise_completions_insert_own" on public.exercise_completions;
drop policy if exists "exercise_completions_update_own" on public.exercise_completions;
drop policy if exists "exercise_completions_delete_own" on public.exercise_completions;

create policy "exercise_completions_select_own"
on public.exercise_completions
for select
to authenticated
using (auth.uid() = user_id);

create policy "exercise_completions_insert_own"
on public.exercise_completions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "exercise_completions_update_own"
on public.exercise_completions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "exercise_completions_delete_own"
on public.exercise_completions
for delete
to authenticated
using (auth.uid() = user_id);
