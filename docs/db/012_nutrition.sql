-- 012_nutrition.sql
-- Nuevo modulo de Nutricion: registro de comidas del dia (con macros opcionales)
-- y registro de agua tomada por dia. Ambas tablas siguen el mismo patron que
-- `body_measurements`/`personal_records`: propiedad estricta del usuario (RLS
-- solo-dueno), sin logica de amistad/visibilidad (a diferencia del perfil
-- social, esto es un dato 100% privado del usuario).

-- =====================================================================
-- 1. `nutrition_logs`: comidas registradas por dia
-- =====================================================================

create table if not exists public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null default current_date,
  meal_type text not null,
  description text not null,
  calories numeric(6,1),
  protein_g numeric(6,1),
  carbs_g numeric(6,1),
  fat_g numeric(6,1),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.nutrition_logs add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.nutrition_logs add column if not exists log_date date not null default current_date;
alter table public.nutrition_logs add column if not exists meal_type text;
alter table public.nutrition_logs add column if not exists description text;
alter table public.nutrition_logs add column if not exists calories numeric(6,1);
alter table public.nutrition_logs add column if not exists protein_g numeric(6,1);
alter table public.nutrition_logs add column if not exists carbs_g numeric(6,1);
alter table public.nutrition_logs add column if not exists fat_g numeric(6,1);
alter table public.nutrition_logs
  add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.nutrition_logs
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

comment on table public.nutrition_logs is 'Comidas registradas por el usuario, por fecha y tipo de comida.';
comment on column public.nutrition_logs.meal_type is 'Tipo de comida: desayuno | almuerzo | cena | snack.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'nutrition_logs_meal_type_check'
      and conrelid = 'public.nutrition_logs'::regclass
  ) then
    alter table public.nutrition_logs
      add constraint nutrition_logs_meal_type_check
      check (meal_type in ('desayuno', 'almuerzo', 'cena', 'snack'));
  end if;
end;
$$;

create index if not exists idx_nutrition_logs_user_date on public.nutrition_logs (user_id, log_date desc);

alter table public.nutrition_logs enable row level security;

drop policy if exists "nutrition_logs_select_own" on public.nutrition_logs;
drop policy if exists "nutrition_logs_insert_own" on public.nutrition_logs;
drop policy if exists "nutrition_logs_update_own" on public.nutrition_logs;
drop policy if exists "nutrition_logs_delete_own" on public.nutrition_logs;

create policy "nutrition_logs_select_own"
on public.nutrition_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "nutrition_logs_insert_own"
on public.nutrition_logs
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "nutrition_logs_update_own"
on public.nutrition_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "nutrition_logs_delete_own"
on public.nutrition_logs
for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists nutrition_logs_set_updated_at on public.nutrition_logs;
create trigger nutrition_logs_set_updated_at
before update on public.nutrition_logs
for each row
execute function public.set_updated_at();

-- =====================================================================
-- 2. `water_logs`: agua tomada por dia (una fila por usuario/fecha)
-- =====================================================================

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null default current_date,
  amount_ml integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.water_logs add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.water_logs add column if not exists log_date date not null default current_date;
alter table public.water_logs add column if not exists amount_ml integer not null default 0;
alter table public.water_logs
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

comment on table public.water_logs is 'Agua consumida por el usuario, un total acumulado por dia.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'water_logs_amount_check'
      and conrelid = 'public.water_logs'::regclass
  ) then
    alter table public.water_logs
      add constraint water_logs_amount_check
      check (amount_ml >= 0);
  end if;
end;
$$;

create unique index if not exists idx_water_logs_unique_day on public.water_logs (user_id, log_date);

alter table public.water_logs enable row level security;

drop policy if exists "water_logs_select_own" on public.water_logs;
drop policy if exists "water_logs_insert_own" on public.water_logs;
drop policy if exists "water_logs_update_own" on public.water_logs;
drop policy if exists "water_logs_delete_own" on public.water_logs;

create policy "water_logs_select_own"
on public.water_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "water_logs_insert_own"
on public.water_logs
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "water_logs_update_own"
on public.water_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "water_logs_delete_own"
on public.water_logs
for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists water_logs_set_updated_at on public.water_logs;
create trigger water_logs_set_updated_at
before update on public.water_logs
for each row
execute function public.set_updated_at();
