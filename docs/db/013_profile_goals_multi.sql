-- 013_profile_goals_multi.sql
-- Ajustes al onboarding de perfil:
-- - `goal` pasa a ser opcional (el onboarding ya no lo exige).
-- - Se agrega `goals` (text[]) para permitir elegir mas de un objetivo.
--   `goal` se mantiene poblado con el primer objetivo elegido, para no
--   romper las lecturas existentes que esperan un unico valor.
-- No se toca `age`/`gender` a nivel de base de datos (ya eran nullable):
-- exigirlos ahora con NOT NULL rompería perfiles ya creados sin esos
-- datos. Se validan como obligatorios en el formulario de onboarding.

alter table public.profiles alter column goal drop not null;
alter table public.profiles add column if not exists goals text[];

comment on column public.profiles.goal is 'Objetivo principal (primer objetivo elegido en goals). Opcional.';
comment on column public.profiles.goals is 'Objetivos elegidos (multi-select): subconjunto de perder_peso | ganar_musculo | mantenerse | resistencia.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_goals_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_goals_check
      check (goals is null or goals <@ array['perder_peso', 'ganar_musculo', 'mantenerse', 'resistencia']::text[]);
  end if;
end;
$$;
