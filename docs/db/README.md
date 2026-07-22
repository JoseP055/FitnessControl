# Base de datos

Guardar aqui los scripts SQL y migraciones versionadas del proyecto.

## Orden de ejecución (Supabase SQL Editor)

Ejecutar en este orden:

1. `001_profiles.sql` — Perfiles 1:1 con `auth.users` + función/trigger `updated_at` + RLS.
2. `002_routines_exercises.sql` — Rutinas, catálogo de ejercicios (global + custom) y relación rutina-ejercicios + RLS.
3. `003_workout_logs.sql` — Logs de entrenamiento y detalle por set (`workout_log_exercises`) + RLS.
4. `004_body_measurements.sql` — Mediciones corporales + RLS.
5. `005_seed_exercises.sql` — Catálogo inicial de ejercicios globales para probar el flujo de rutinas.
6. `006_routine_schedule.sql` — Extiende rutinas con calendario, días semanales, tracking de cumplimiento y asociación ejercicio->día.

## Qué verificar después de cada script (Table Editor)

- Después de `001_profiles.sql`: tabla `profiles` (RLS habilitado) y función `set_updated_at`.
- Después de `002_routines_exercises.sql`: tablas `routines`, `exercises`, `routine_exercises` (RLS habilitado).
- Después de `003_workout_logs.sql`: tablas `workout_logs`, `workout_log_exercises` (RLS habilitado).
- Después de `004_body_measurements.sql`: tabla `body_measurements` (RLS habilitado).
- Después de `005_seed_exercises.sql`: filas globales en `exercises` con `created_by_user_id = null`.
- Después de `006_routine_schedule.sql`: columnas nuevas en `routines`, tabla `routine_days`, columna `routine_day_id` en `routine_exercises` y tabla `workout_completions`.

## Nota sobre RLS

- Todas las tablas con `user_id` solo permiten leer/escribir filas del usuario autenticado (`auth.uid() = user_id`).
- `exercises` permite leer ejercicios globales (`created_by_user_id is null`) y propios; y solo permite escribir si el ejercicio es propio.

## Troubleshooting

- Si aparece `new row violates row-level security policy` al guardar el perfil, re-ejecutar `001_profiles.sql` (recrea policies) y luego ejecutar:
  ```sql
  select pg_notify('pgrst', 'reload schema');
  ```
- Si aparece `Could not find the table 'public.<tabla>' in the schema cache`, ejecutar:
  ```sql
  select pg_notify('pgrst', 'reload schema');
  ```
- Si `005_seed_exercises.sql` falla con `null value in column "routine_id" of relation "exercises"`, tu tabla `exercises` viene de un esquema legado. Re-ejecutá primero `002_routines_exercises.sql` para quitar el `NOT NULL` de `routine_id`, luego ejecutá:
  ```sql
  select pg_notify('pgrst', 'reload schema');
  ```
  y recién después volvé a correr `005_seed_exercises.sql`.
- Si después de `006_routine_schedule.sql` querés forzar que todo ejercicio tenga `routine_day_id`, primero hay que decidir cómo migrar las rutinas viejas. El esquema anterior no guardaba `day_of_week` ni `muscle_groups`, así que no existe backfill automático confiable.
