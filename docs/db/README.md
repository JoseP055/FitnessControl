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
7. `007_expand_muscle_groups.sql` — Separa grupo padre/subcategoría en `exercises` y actualiza `routine_days` para guardar subcategorías específicas.
8. `008_seed_exercises_full.sql` — Reinicia el catálogo global y carga el catálogo amplio con la taxonomía nueva.
9. `009_routine_exercise_duration.sql` — Agrega `duration_minutes` a `routine_exercises` para ejercicios por tiempo.
10. `010_social_profile.sql` — Perfil social: avatar/bio/visibilidad por sección en `profiles`, tabla `friendships` (solicitud + aceptación), `personal_records`, `favorite_foods`, `gym_schedule`, función `search_profiles` y bucket de Storage `avatars` + políticas.
11. `011_profile_identity_and_pr_catalog.sql` — Agrega `public_id` (autogenerado) y `username` (elegido) a `profiles` para buscar amigos de forma precisa, agrega `exercise_id` a `personal_records` para estandarizar los PRs contra el catálogo de `exercises`, y actualiza `search_profiles` para buscar también por username/ID.
12. `012_nutrition.sql` — Módulo de Nutrición: `nutrition_logs` (comidas por día con macros opcionales) y `water_logs` (agua acumulada por día), ambas con RLS solo-dueño.

## Qué verificar después de cada script (Table Editor)

- Después de `001_profiles.sql`: tabla `profiles` (RLS habilitado) y función `set_updated_at`.
- Después de `002_routines_exercises.sql`: tablas `routines`, `exercises`, `routine_exercises` (RLS habilitado).
- Después de `003_workout_logs.sql`: tablas `workout_logs`, `workout_log_exercises` (RLS habilitado).
- Después de `004_body_measurements.sql`: tabla `body_measurements` (RLS habilitado).
- Después de `005_seed_exercises.sql`: filas globales en `exercises` con `created_by_user_id = null`.
- Después de `006_routine_schedule.sql`: columnas nuevas en `routines`, tabla `routine_days`, columna `routine_day_id` en `routine_exercises` y tabla `workout_completions`.
- Después de `007_expand_muscle_groups.sql`: columnas `muscle_group_parent` + `muscle_subgroup` en `exercises` y columna `muscle_subgroups` en `routine_days`.
- Después de `008_seed_exercises_full.sql`: catálogo global completo en `exercises`, con `muscle_group_parent` y `muscle_subgroup` poblados.
- Después de `009_routine_exercise_duration.sql`: columna `duration_minutes` en `routine_exercises`.
- Después de `010_social_profile.sql`: columnas nuevas en `profiles` (`avatar_url`, `bio`, `*_visibility`), tablas `friendships`, `personal_records`, `favorite_foods`, `gym_schedule` (todas con RLS habilitado), función `search_profiles` y bucket `avatars` en Storage con sus 4 policies.
- Después de `011_profile_identity_and_pr_catalog.sql`: columnas `public_id` (única, autogenerada) y `username` (única, nullable) en `profiles`; columna `exercise_id` en `personal_records`; función `search_profiles` devolviendo también `username`/`public_id`.
- Después de `012_nutrition.sql`: tablas `nutrition_logs` y `water_logs` (RLS habilitado), `water_logs` con unique(user_id, log_date).

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
- Si después de `007_expand_muscle_groups.sql` todavía existen ejercicios legacy con `muscle_subgroup = null`, eso indica que venían del catálogo viejo y no se puede inferir una subcategoría precisa. La salida recomendada es re-seedear el catálogo completo.
