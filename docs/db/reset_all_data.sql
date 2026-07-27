-- reset_all_data.sql
--
-- BORRA TODO: todos los usuarios registrados y absolutamente todos los
-- datos asociados (perfiles, rutinas, medidas, records, comidas, horario
-- de gym, amistades, nutricion, agua, ejercicios personalizados). Deja la
-- base como si nadie se hubiera registrado nunca.
--
-- NO ES REVERSIBLE. No hay forma de deshacer esto una vez ejecutado.
-- Incluye tambien la cuenta con la que estas logueado ahora mismo: al
-- correrlo vas a quedar deslogueado de la app y vas a tener que crear
-- tu cuenta de nuevo desde /register.
--
-- El catalogo global de ejercicios (los que ya vienen cargados con la
-- app, con created_by_user_id nulo) NO se toca.

-- 1) Rutinas y todo lo que cuelga de ellas (dias, ejercicios de rutina,
--    cumplimientos por dia y por ejercicio individual). Se borra antes
--    que los ejercicios personalizados porque routine_exercises.exercise_id
--    bloquea el borrado de un ejercicio mientras alguna rutina lo use.
delete from public.routines;

-- 2) Logs de entrenamiento del flujo viejo (y su detalle por set).
delete from public.workout_logs;

-- 3) Ejercicios personalizados creados por usuarios. El catalogo global
--    (created_by_user_id is null) queda intacto.
delete from public.exercises where created_by_user_id is not null;

-- 4) Resto de datos de perfil social, nutricion y medidas. Todas estas
--    tablas ya tienen "on delete cascade" contra auth.users, asi que se
--    vaciarian solas al borrar los usuarios en el paso 5, pero se dejan
--    explicitas para que quede claro que no sobrevive nada.
delete from public.body_measurements;
delete from public.personal_records;
delete from public.favorite_foods;
delete from public.gym_schedule;
delete from public.friendships;
delete from public.nutrition_logs;
delete from public.water_logs;
delete from public.profiles;

-- 5) Todos los usuarios de autenticacion. Esto dispara el cascade de
--    Supabase sobre sus tablas internas (identities, sessions, etc.) y de
--    cualquier tabla de arriba que no se haya vaciado a mano.
delete from auth.users;
