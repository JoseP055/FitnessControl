-- 007_expand_muscle_groups.sql
-- Expande la taxonomia de grupos musculares para:
-- - separar grupo padre y subcategoria en `exercises`
-- - actualizar `routine_days` para guardar subcategorias especificas
--
-- Este script NO borra datos.
-- Si existen ejercicios del seed viejo (`005_seed_exercises.sql`), se preservan,
-- pero no siempre es posible inferir una subcategoria precisa desde el dato legado.
-- En esos casos se mantiene el grupo padre y la subcategoria puede quedar NULL
-- hasta que se vuelva a seedear el catalogo con `008_seed_exercises_full.sql`.

-- ---------------------------------------------------------------------------
-- exercises: muscle_group -> muscle_subgroup + muscle_group_parent
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exercises'
      and column_name = 'muscle_group'
  )
  and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'exercises'
      and column_name = 'muscle_subgroup'
  ) then
    alter table public.exercises rename column muscle_group to muscle_subgroup;
  end if;
end;
$$;

alter table public.exercises
  add column if not exists muscle_group_parent text;

alter table public.exercises
  add column if not exists muscle_subgroup text;

comment on column public.exercises.muscle_group_parent is
  'Grupo muscular padre: Pecho, Espalda, Hombros, Brazos, Piernas, Core, Gluteos o Cardio.';

comment on column public.exercises.muscle_subgroup is
  'Subcategoria especifica dentro del grupo padre: ej. Alto, Dorsales, Biceps, Cuadriceps, etc.';

-- Backfill basico para datos legacy:
-- si la columna vieja solo guardaba el grupo padre, lo movemos a `muscle_group_parent`.
-- No inventamos una subcategoria porque no seria confiable.
update public.exercises
set muscle_group_parent = case lower(trim(muscle_subgroup))
  when 'pecho' then 'Pecho'
  when 'espalda' then 'Espalda'
  when 'hombros' then 'Hombros'
  when 'brazos' then 'Brazos'
  when 'piernas' then 'Piernas'
  when 'core' then 'Core'
  when 'gluteos' then 'Gluteos'
  when 'cardio' then 'Cardio'
  else muscle_group_parent
end
where muscle_group_parent is null
  and muscle_subgroup is not null;

update public.exercises
set muscle_subgroup = null
where lower(trim(muscle_subgroup)) in (
  'pecho',
  'espalda',
  'hombros',
  'brazos',
  'piernas',
  'core',
  'gluteos',
  'cardio'
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'exercises_muscle_group_parent_check'
      and conrelid = 'public.exercises'::regclass
  ) then
    alter table public.exercises
      add constraint exercises_muscle_group_parent_check
      check (
        muscle_group_parent is null
        or muscle_group_parent in (
          'Pecho',
          'Espalda',
          'Hombros',
          'Brazos',
          'Piernas',
          'Core',
          'Gluteos',
          'Cardio'
        )
      );
  end if;
end;
$$;

create index if not exists idx_exercises_group_parent
  on public.exercises (muscle_group_parent);

create index if not exists idx_exercises_group_parent_subgroup
  on public.exercises (muscle_group_parent, muscle_subgroup);

-- ---------------------------------------------------------------------------
-- routine_days: muscle_groups -> muscle_subgroups
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'routine_days'
      and column_name = 'muscle_groups'
  )
  and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'routine_days'
      and column_name = 'muscle_subgroups'
  ) then
    alter table public.routine_days rename column muscle_groups to muscle_subgroups;
  end if;
end;
$$;

alter table public.routine_days
  add column if not exists muscle_subgroups text[];

comment on column public.routine_days.muscle_subgroups is
  'Subcategorias musculares especificas asignadas a ese dia; ej. {"Alto","Triceps"}.';

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'routine_days_muscle_groups_check'
      and conrelid = 'public.routine_days'::regclass
  ) then
    alter table public.routine_days
      rename constraint routine_days_muscle_groups_check to routine_days_muscle_subgroups_check;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'routine_days_muscle_subgroups_check'
      and conrelid = 'public.routine_days'::regclass
  ) then
    alter table public.routine_days
      add constraint routine_days_muscle_subgroups_check
      check (coalesce(array_length(muscle_subgroups, 1), 0) >= 1);
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.idx_routine_days_muscle_groups') is not null
     and to_regclass('public.idx_routine_days_muscle_subgroups') is null then
    alter index public.idx_routine_days_muscle_groups
      rename to idx_routine_days_muscle_subgroups;
  end if;
end;
$$;

create index if not exists idx_routine_days_muscle_subgroups
  on public.routine_days using gin (muscle_subgroups);

-- Nota:
-- Si ya existen filas en `routine_days` con valores amplios tipo {"pecho","brazos"},
-- el dato se conserva, pero no se puede dividir automaticamente en subcategorias
-- reales sin decision manual del usuario.


