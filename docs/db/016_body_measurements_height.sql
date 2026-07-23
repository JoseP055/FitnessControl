-- 016_body_measurements_height.sql
-- Agrega altura a las medidas corporales, para poder trackearla en el
-- tiempo junto con el resto (peso, % grasa, etc.) en vez de tener un
-- unico valor fijo en profiles.height_cm.

alter table public.body_measurements add column if not exists height_cm numeric(6,2);

comment on column public.body_measurements.height_cm is 'Altura registrada junto con esta medicion (cm).';
