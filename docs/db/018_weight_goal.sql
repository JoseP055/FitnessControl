-- 018_weight_goal.sql
-- Agrega una meta de peso (objetivo) al perfil, para poder comparar el
-- peso registrado contra un objetivo del usuario en el tab Progreso.

alter table public.profiles add column if not exists weight_goal_kg numeric(6,2);

comment on column public.profiles.weight_goal_kg is 'Meta de peso (kg) que el usuario se propone alcanzar.';
