-- Agrega soporte para ejercicios planificados por duracion en minutos
-- dentro de `routine_exercises`, sin romper los flujos actuales basados
-- en series/repeticiones.

alter table public.routine_exercises
  add column if not exists duration_minutes integer;

comment on column public.routine_exercises.duration_minutes is 'Duracion planificada en minutos para ejercicios por tiempo, cardio o isometricos.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'routine_exercises_duration_minutes_check'
      and conrelid = 'public.routine_exercises'::regclass
  ) then
    alter table public.routine_exercises
      add constraint routine_exercises_duration_minutes_check
      check (duration_minutes is null or duration_minutes >= 1);
  end if;
end $$;

create index if not exists idx_routine_exercises_duration_minutes
  on public.routine_exercises (duration_minutes);
