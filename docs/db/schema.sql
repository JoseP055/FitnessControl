-- FitnessControl - esquema inicial para Supabase
-- Este esquema asume que la autenticacion se maneja con Supabase Auth.
-- Por eso no se crea una tabla local `users`; las relaciones apuntan a `auth.users(id)`.

create extension if not exists pgcrypto;

-- Tabla principal de rutinas creadas por cada usuario autenticado.
create table if not exists public.routines (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    description text,
    goal text,
    is_active boolean not null default true,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.routines is 'Rutinas de entrenamiento creadas por cada usuario.';
comment on column public.routines.user_id is 'Usuario dueño de la rutina, referenciado desde auth.users.';

-- Cada ejercicio pertenece a una rutina.
-- Esto permite modelar la composicion de la rutina y su orden sugerido.
create table if not exists public.exercises (
    id uuid primary key default gen_random_uuid(),
    routine_id uuid not null references public.routines (id) on delete cascade,
    name text not null,
    muscle_group text,
    sets integer,
    reps integer,
    weight numeric(8,2),
    rest_seconds integer,
    exercise_order integer not null default 1,
    notes text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.exercises is 'Ejercicios que componen una rutina.';
comment on column public.exercises.routine_id is 'Relaciona cada ejercicio con una rutina existente.';

-- Registra cada sesion de entrenamiento ejecutada por el usuario.
-- Puede apuntar opcionalmente a la rutina usada ese dia.
create table if not exists public.workout_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    routine_id uuid references public.routines (id) on delete set null,
    workout_date date not null,
    duration_minutes integer,
    perceived_effort integer,
    notes text,
    created_at timestamptz not null default timezone('utc', now())
);

comment on table public.workout_logs is 'Historial de entrenamientos realizados por cada usuario.';
comment on column public.workout_logs.routine_id is 'Rutina usada en la sesion, si aplica.';

-- Guarda medidas fisicas periodicas del usuario para seguir progreso.
create table if not exists public.body_measurements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    measurement_date date not null,
    weight_kg numeric(6,2),
    body_fat_percentage numeric(5,2),
    chest_cm numeric(6,2),
    waist_cm numeric(6,2),
    hips_cm numeric(6,2),
    arms_cm numeric(6,2),
    thighs_cm numeric(6,2),
    notes text,
    created_at timestamptz not null default timezone('utc', now())
);

comment on table public.body_measurements is 'Mediciones corporales historicas para seguimiento de progreso.';
comment on column public.body_measurements.user_id is 'Usuario al que pertenecen las mediciones.';

create index if not exists idx_routines_user_id on public.routines (user_id);
create index if not exists idx_exercises_routine_id on public.exercises (routine_id);
create index if not exists idx_workout_logs_user_id on public.workout_logs (user_id);
create index if not exists idx_workout_logs_routine_id on public.workout_logs (routine_id);
create index if not exists idx_body_measurements_user_id on public.body_measurements (user_id);
