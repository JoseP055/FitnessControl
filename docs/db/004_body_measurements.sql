-- 004_body_measurements.sql
-- Crea `body_measurements` con RLS/policies e índices.

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  measurement_date date not null,
  weight_kg numeric(6,2),
  body_fat_percent numeric(5,2),
  chest_cm numeric(6,2),
  waist_cm numeric(6,2),
  hips_cm numeric(6,2),
  arms_cm numeric(6,2),
  thighs_cm numeric(6,2),
  notes text,
  extra jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.body_measurements add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.body_measurements add column if not exists measurement_date date;
alter table public.body_measurements add column if not exists weight_kg numeric(6,2);
alter table public.body_measurements add column if not exists body_fat_percent numeric(5,2);
alter table public.body_measurements add column if not exists chest_cm numeric(6,2);
alter table public.body_measurements add column if not exists waist_cm numeric(6,2);
alter table public.body_measurements add column if not exists hips_cm numeric(6,2);
alter table public.body_measurements add column if not exists arms_cm numeric(6,2);
alter table public.body_measurements add column if not exists thighs_cm numeric(6,2);
alter table public.body_measurements add column if not exists notes text;
alter table public.body_measurements add column if not exists extra jsonb;
alter table public.body_measurements
  add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.body_measurements
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

comment on table public.body_measurements is 'Mediciones corporales por usuario a lo largo del tiempo.';
comment on column public.body_measurements.extra is 'Estructura flexible para métricas adicionales (jsonb).';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'body_measurements_date_unique'
      and conrelid = 'public.body_measurements'::regclass
  ) then
    alter table public.body_measurements
      add constraint body_measurements_date_unique
      unique (user_id, measurement_date);
  end if;
end;
$$;

alter table public.body_measurements enable row level security;

drop policy if exists "body_measurements_select_own" on public.body_measurements;
drop policy if exists "body_measurements_insert_own" on public.body_measurements;
drop policy if exists "body_measurements_update_own" on public.body_measurements;
drop policy if exists "body_measurements_delete_own" on public.body_measurements;

create policy "body_measurements_select_own"
on public.body_measurements
for select
using (auth.uid() = user_id);

create policy "body_measurements_insert_own"
on public.body_measurements
for insert
with check (auth.uid() = user_id);

create policy "body_measurements_update_own"
on public.body_measurements
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "body_measurements_delete_own"
on public.body_measurements
for delete
using (auth.uid() = user_id);

drop trigger if exists body_measurements_set_updated_at on public.body_measurements;
create trigger body_measurements_set_updated_at
before update on public.body_measurements
for each row
execute function public.set_updated_at();

create index if not exists idx_body_measurements_user_date
on public.body_measurements (user_id, measurement_date desc);
