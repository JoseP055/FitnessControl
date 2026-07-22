-- 006_routine_schedule.sql
-- Extiende el modelo de rutinas para soportar:
-- - duración en meses
-- - rango de fechas
-- - días semanales configurables con múltiples grupos musculares
-- - ejercicios asociados a un día específico de la rutina
-- - tracking calendario de cumplimiento por fecha
--
-- Decisiones:
-- 1. `day_of_week` usa 0=Lunes ... 6=Domingo para coincidir con el wizard.
-- 2. `muscle_groups` se modela como `text[]` para soportar multi-select simple y consultas
--    directas desde Postgres/Supabase sin crear una tabla puente adicional en esta etapa.
-- 3. `routine_exercises` se conserva por compatibilidad y se extiende con `routine_day_id`.
-- 4. Para no romper datos existentes, `routine_day_id` queda nullable en esta migración.
--    Las rutinas viejas no pueden asignarse automáticamente a días reales sin una decisión manual.

-- Extensión de `routines`
alter table public.routines
  add column if not exists duration_months integer;

alter table public.routines
  add column if not exists start_date date;

alter table public.routines
  add column if not exists end_date date;

comment on column public.routines.duration_months is 'Duración planificada de la rutina en meses.';
comment on column public.routines.start_date is 'Fecha de inicio de la rutina.';
comment on column public.routines.end_date is 'Fecha de fin de la rutina.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'routines_duration_months_check'
      and conrelid = 'public.routines'::regclass
  ) then
    alter table public.routines
      add constraint routines_duration_months_check
      check (duration_months is null or duration_months >= 1);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'routines_date_range_check'
      and conrelid = 'public.routines'::regclass
  ) then
    alter table public.routines
      add constraint routines_date_range_check
      check (
        start_date is null
        or end_date is null
        or end_date >= start_date
      );
  end if;
end;
$$;

create index if not exists idx_routines_start_date on public.routines (user_id, start_date);

-- Días configurados dentro de una rutina.
create table if not exists public.routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  day_of_week integer not null,
  muscle_groups text[] not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.routine_days
  add column if not exists routine_id uuid references public.routines (id) on delete cascade;
alter table public.routine_days
  add column if not exists day_of_week integer;
alter table public.routine_days
  add column if not exists muscle_groups text[];
alter table public.routine_days
  add column if not exists created_at timestamptz not null default timezone('utc', now());

comment on table public.routine_days is 'Días semanales configurados dentro de una rutina.';
comment on column public.routine_days.day_of_week is '0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo.';
comment on column public.routine_days.muscle_groups is 'Lista de grupos musculares asignados a ese día; se guarda como text[] para multi-select simple.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'routine_days_day_of_week_check'
      and conrelid = 'public.routine_days'::regclass
  ) then
    alter table public.routine_days
      add constraint routine_days_day_of_week_check
      check (day_of_week between 0 and 6);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'routine_days_muscle_groups_check'
      and conrelid = 'public.routine_days'::regclass
  ) then
    alter table public.routine_days
      add constraint routine_days_muscle_groups_check
      check (coalesce(array_length(muscle_groups, 1), 0) >= 1);
  end if;
end;
$$;

create unique index if not exists idx_routine_days_unique_weekday
  on public.routine_days (routine_id, day_of_week);

create index if not exists idx_routine_days_routine_id on public.routine_days (routine_id);
create index if not exists idx_routine_days_muscle_groups on public.routine_days using gin (muscle_groups);

alter table public.routine_days enable row level security;

drop policy if exists "routine_days_select_own" on public.routine_days;
drop policy if exists "routine_days_insert_own" on public.routine_days;
drop policy if exists "routine_days_update_own" on public.routine_days;
drop policy if exists "routine_days_delete_own" on public.routine_days;

create policy "routine_days_select_own"
on public.routine_days
for select
to authenticated
using (
  exists (
    select 1
    from public.routines r
    where r.id = routine_id
      and r.user_id = auth.uid()
  )
);

create policy "routine_days_insert_own"
on public.routine_days
for insert
to authenticated
with check (
  exists (
    select 1
    from public.routines r
    where r.id = routine_id
      and r.user_id = auth.uid()
  )
);

create policy "routine_days_update_own"
on public.routine_days
for update
to authenticated
using (
  exists (
    select 1
    from public.routines r
    where r.id = routine_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.routines r
    where r.id = routine_id
      and r.user_id = auth.uid()
  )
);

create policy "routine_days_delete_own"
on public.routine_days
for delete
to authenticated
using (
  exists (
    select 1
    from public.routines r
    where r.id = routine_id
      and r.user_id = auth.uid()
  )
);

-- Ajuste de `routine_exercises` para asociar cada ejercicio a un día concreto.
alter table public.routine_exercises
  add column if not exists routine_day_id uuid references public.routine_days (id) on delete cascade;

comment on column public.routine_exercises.routine_day_id is 'Día específico de la rutina al que pertenece el ejercicio. Puede ser NULL en filas legacy previas a la Fase 1.';

create index if not exists idx_routine_exercises_routine_day_id
  on public.routine_exercises (routine_day_id);

create index if not exists idx_routine_exercises_day_order
  on public.routine_exercises (routine_day_id, exercise_order);

-- Tracking calendario: una fila por fecha concreta y día de rutina.
create table if not exists public.workout_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  routine_id uuid not null references public.routines (id) on delete cascade,
  routine_day_id uuid not null references public.routine_days (id) on delete cascade,
  completion_date date not null,
  status text not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.workout_completions
  add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.workout_completions
  add column if not exists routine_id uuid references public.routines (id) on delete cascade;
alter table public.workout_completions
  add column if not exists routine_day_id uuid references public.routine_days (id) on delete cascade;
alter table public.workout_completions
  add column if not exists completion_date date;
alter table public.workout_completions
  add column if not exists status text;
alter table public.workout_completions
  add column if not exists completed_at timestamptz;
alter table public.workout_completions
  add column if not exists created_at timestamptz not null default timezone('utc', now());

comment on table public.workout_completions is 'Estado calendario de cumplimiento por fecha concreta para cada día programado de una rutina.';
comment on column public.workout_completions.completion_date is 'Fecha calendario específica del entrenamiento programado.';
comment on column public.workout_completions.status is 'Estado del entrenamiento para esa fecha: pending, done o skipped.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workout_completions_status_check'
      and conrelid = 'public.workout_completions'::regclass
  ) then
    alter table public.workout_completions
      add constraint workout_completions_status_check
      check (status in ('pending', 'done', 'skipped'));
  end if;
end;
$$;

create unique index if not exists idx_workout_completions_unique_day_date
  on public.workout_completions (user_id, routine_day_id, completion_date);

create index if not exists idx_workout_completions_user_date
  on public.workout_completions (user_id, completion_date desc);

create index if not exists idx_workout_completions_routine_id
  on public.workout_completions (routine_id);

alter table public.workout_completions enable row level security;

drop policy if exists "workout_completions_select_own" on public.workout_completions;
drop policy if exists "workout_completions_insert_own" on public.workout_completions;
drop policy if exists "workout_completions_update_own" on public.workout_completions;
drop policy if exists "workout_completions_delete_own" on public.workout_completions;

create policy "workout_completions_select_own"
on public.workout_completions
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.routines r
    where r.id = routine_id
      and r.user_id = auth.uid()
  )
);

create policy "workout_completions_insert_own"
on public.workout_completions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.routines r
    where r.id = routine_id
      and r.user_id = auth.uid()
  )
);

create policy "workout_completions_update_own"
on public.workout_completions
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.routines r
    where r.id = routine_id
      and r.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.routines r
    where r.id = routine_id
      and r.user_id = auth.uid()
  )
);

create policy "workout_completions_delete_own"
on public.workout_completions
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.routines r
    where r.id = routine_id
      and r.user_id = auth.uid()
  )
);

-- Nota de migración:
-- `routine_exercises.routine_day_id` queda nullable para no perder rutinas creadas con el flujo viejo.
-- Las filas legacy no pueden asignarse de forma correcta a un día semanal real sin intervención manual,
-- porque el modelo anterior no guardaba ni `day_of_week` ni `muscle_groups`.
