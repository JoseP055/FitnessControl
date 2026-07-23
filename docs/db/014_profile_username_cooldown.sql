-- 014_profile_username_cooldown.sql
-- Registra cuando fue la ultima vez que el usuario cambio su username,
-- para poder limitar el cambio a una vez cada 15 dias desde el frontend.

alter table public.profiles add column if not exists username_changed_at timestamptz;

comment on column public.profiles.username_changed_at is 'Fecha del ultimo cambio de username. Se usa para permitir cambiarlo solo una vez cada 15 dias.';
