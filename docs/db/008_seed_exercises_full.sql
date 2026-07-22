-- 008_seed_exercises_full.sql
-- Catalogo completo de ejercicios, organizado por grupo muscular padre
-- y subcategoria especifica. Pensado para correr DESPU�?S de
-- `007_expand_muscle_groups.sql`.
--
-- Este script reinicia SOLO el catalogo global (`created_by_user_id is null`).
-- Si existen referencias desde `routine_exercises` o `workout_log_exercises`
-- hacia ejercicios globales viejos, se limpian primero para evitar errores
-- por claves foraneas al reseedear.

delete from public.workout_log_exercises
where exercise_id in (
  select id
  from public.exercises
  where created_by_user_id is null
);

delete from public.routine_exercises
where exercise_id in (
  select id
  from public.exercises
  where created_by_user_id is null
);

delete from public.exercises
where created_by_user_id is null;

-- ============================================================
-- PECHO
-- ============================================================

-- Pecho / Alto
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Press banca inclinado con barra', 'Pecho', 'Alto', 'Barra', 'Press en banco inclinado, enfoca la parte superior del pectoral.'),
  (null, 'Press banca inclinado con mancuernas', 'Pecho', 'Alto', 'Mancuerna', 'Variante con mancuernas, mayor rango de movimiento.'),
  (null, 'Press inclinado en maquina', 'Pecho', 'Alto', 'Maquina', 'Press guiado en maquina para pecho superior.'),
  (null, 'Aperturas inclinadas con mancuernas', 'Pecho', 'Alto', 'Mancuerna', 'Aislamiento de pecho alto con mancuernas.'),
  (null, 'Cruce de poleas bajo a alto', 'Pecho', 'Alto', 'Polea', 'Cruce de poleas desde abajo hacia arriba.'),
  (null, 'Press inclinado en maquina Smith', 'Pecho', 'Alto', 'Maquina', 'Press inclinado con barra guiada.'),
  (null, 'Flexiones con pies elevados', 'Pecho', 'Alto', 'Peso corporal', 'Flexiones con pies sobre banco para enfatizar pecho alto.');

-- Pecho / Medio
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Press banca plano con barra', 'Pecho', 'Medio', 'Barra', 'Ejercicio base para el desarrollo del pectoral.'),
  (null, 'Press banca plano con mancuernas', 'Pecho', 'Medio', 'Mancuerna', 'Variante con mayor rango y estabilizacion.'),
  (null, 'Press plano en maquina', 'Pecho', 'Medio', 'Maquina', 'Press guiado plano.'),
  (null, 'Aperturas planas con mancuernas', 'Pecho', 'Medio', 'Mancuerna', 'Aislamiento de pecho medio.'),
  (null, 'Cruce de poleas a la altura del pecho', 'Pecho', 'Medio', 'Polea', 'Cruce simetrico a la altura del pecho.'),
  (null, 'Flexiones de pecho', 'Pecho', 'Medio', 'Peso corporal', 'Ejercicio clasico de peso corporal.'),
  (null, 'Pec deck / Contractora', 'Pecho', 'Medio', 'Maquina', 'Aislamiento en maquina contractora.'),
  (null, 'Press en maquina Smith plano', 'Pecho', 'Medio', 'Maquina', 'Press plano con barra guiada.');

-- Pecho / Bajo
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Press banca declinado con barra', 'Pecho', 'Bajo', 'Barra', 'Press en banco declinado.'),
  (null, 'Press banca declinado con mancuernas', 'Pecho', 'Bajo', 'Mancuerna', 'Variante con mancuernas en declinado.'),
  (null, 'Fondos en paralelas (dips pecho)', 'Pecho', 'Bajo', 'Peso corporal', 'Inclinando el torso hacia adelante para enfocar pecho bajo.'),
  (null, 'Cruce de poleas alto a bajo', 'Pecho', 'Bajo', 'Polea', 'Cruce de poleas desde arriba hacia abajo.'),
  (null, 'Aperturas declinadas con mancuernas', 'Pecho', 'Bajo', 'Mancuerna', 'Aislamiento de pecho bajo.'),
  (null, 'Press declinado en maquina', 'Pecho', 'Bajo', 'Maquina', 'Press guiado en declinado.');

-- ============================================================
-- ESPALDA
-- ============================================================

-- Espalda / Dorsales
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Dominadas', 'Espalda', 'Dorsales', 'Peso corporal', 'Ejercicio compuesto para dorsal ancho.'),
  (null, 'Jalon al pecho en polea', 'Espalda', 'Dorsales', 'Polea', 'Variante asistida de dominadas.'),
  (null, 'Jalon tras nuca en polea', 'Espalda', 'Dorsales', 'Polea', 'Enfoque en dorsal, requiere buena movilidad de hombro.'),
  (null, 'Remo con barra', 'Espalda', 'Dorsales', 'Barra', 'Remo inclinado con barra.'),
  (null, 'Remo con mancuerna a un brazo', 'Espalda', 'Dorsales', 'Mancuerna', 'Remo unilateral apoyado en banco.'),
  (null, 'Remo en maquina', 'Espalda', 'Dorsales', 'Maquina', 'Remo guiado sentado.'),
  (null, 'Pull over con mancuerna', 'Espalda', 'Dorsales', 'Mancuerna', 'Extension de hombro acostado, involucra dorsal y pecho.'),
  (null, 'Jalon al pecho agarre cerrado', 'Espalda', 'Dorsales', 'Polea', 'Variante de jalon con agarre estrecho.');

-- Espalda / Trapecio
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Encogimientos con barra', 'Espalda', 'Trapecio', 'Barra', 'Shrugs para trapecio superior.'),
  (null, 'Encogimientos con mancuernas', 'Espalda', 'Trapecio', 'Mancuerna', 'Variante con mancuernas a los costados.'),
  (null, 'Encogimientos en maquina', 'Espalda', 'Trapecio', 'Maquina', 'Shrugs guiados.'),
  (null, 'Remo al menton con barra', 'Espalda', 'Trapecio', 'Barra', 'Tiron vertical, involucra trapecio y hombro lateral.'),
  (null, 'Face pull en polea', 'Espalda', 'Trapecio', 'Polea', 'Tiron hacia la cara, trabaja trapecio medio y posterior de hombro.'),
  (null, 'Remo alto con mancuernas', 'Espalda', 'Trapecio', 'Mancuerna', 'Variante de remo al menton con mancuernas.');

-- Espalda / Lumbar
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Peso muerto convencional', 'Espalda', 'Lumbar', 'Barra', 'Ejercicio compuesto clave para cadena posterior.'),
  (null, 'Hiperextensiones en banco lumbar', 'Espalda', 'Lumbar', 'Peso corporal', 'Fortalecimiento de zona lumbar.'),
  (null, 'Buenos dias (good mornings)', 'Espalda', 'Lumbar', 'Barra', 'Flexion de cadera con barra en espalda.'),
  (null, 'Peso muerto rumano', 'Espalda', 'Lumbar', 'Barra', '�?nfasis en cadena posterior con rodillas semiflexionadas.'),
  (null, 'Superman', 'Espalda', 'Lumbar', 'Peso corporal', 'Extension lumbar en el piso.'),
  (null, 'Extension lumbar en maquina', 'Espalda', 'Lumbar', 'Maquina', 'Extension guiada de zona lumbar.');

-- ============================================================
-- HOMBROS
-- ============================================================

-- Hombros / Anterior
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Press militar con barra', 'Hombros', 'Anterior', 'Barra', 'Press vertical de pie o sentado.'),
  (null, 'Press militar con mancuernas', 'Hombros', 'Anterior', 'Mancuerna', 'Variante con mayor rango de movimiento.'),
  (null, 'Elevacion frontal con mancuernas', 'Hombros', 'Anterior', 'Mancuerna', 'Aislamiento de deltoide anterior.'),
  (null, 'Elevacion frontal con disco', 'Hombros', 'Anterior', 'Otro', 'Variante con disco de peso.'),
  (null, 'Press Arnold', 'Hombros', 'Anterior', 'Mancuerna', 'Press con rotacion de muneca, involucra todo el hombro.'),
  (null, 'Press militar en maquina', 'Hombros', 'Anterior', 'Maquina', 'Press vertical guiado.');

-- Hombros / Lateral
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Elevaciones laterales con mancuernas', 'Hombros', 'Lateral', 'Mancuerna', 'Aislamiento clasico de deltoide lateral.'),
  (null, 'Elevaciones laterales en polea', 'Hombros', 'Lateral', 'Polea', 'Tension constante en el movimiento.'),
  (null, 'Elevaciones laterales en maquina', 'Hombros', 'Lateral', 'Maquina', 'Variante guiada.'),
  (null, 'Press lateral en maquina', 'Hombros', 'Lateral', 'Maquina', 'Maquina especifica de elevacion lateral.');

-- Hombros / Posterior
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Aperturas posteriores con mancuernas', 'Hombros', 'Posterior', 'Mancuerna', 'Conocido como pajaro, inclinado hacia adelante.'),
  (null, 'Pajaro en maquina contractora invertida', 'Hombros', 'Posterior', 'Maquina', 'Variante guiada del pajaro.'),
  (null, 'Aperturas posteriores en polea', 'Hombros', 'Posterior', 'Polea', 'Cruce de poleas para deltoide posterior.'),
  (null, 'Remo con agarre ancho', 'Hombros', 'Posterior', 'Barra', 'Remo con codos abiertos para enfatizar posterior de hombro.');

-- ============================================================
-- BRAZOS
-- ============================================================

-- Brazos / Biceps
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Curl con barra', 'Brazos', 'Biceps', 'Barra', 'Ejercicio base de biceps.'),
  (null, 'Curl con mancuernas', 'Brazos', 'Biceps', 'Mancuerna', 'Variante alterna o simultanea.'),
  (null, 'Curl martillo', 'Brazos', 'Biceps', 'Mancuerna', 'Agarre neutro, involucra braquial y antebrazo.'),
  (null, 'Curl en polea', 'Brazos', 'Biceps', 'Polea', 'Tension constante durante todo el recorrido.'),
  (null, 'Curl concentrado', 'Brazos', 'Biceps', 'Mancuerna', 'Aislamiento estricto apoyado en el muslo.'),
  (null, 'Curl en banco Scott', 'Brazos', 'Biceps', 'Barra', 'Curl predicador, aisla biceps evitando balanceo.'),
  (null, 'Curl en maquina', 'Brazos', 'Biceps', 'Maquina', 'Variante guiada de curl.');

-- Brazos / Triceps
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Press frances con barra', 'Brazos', 'Triceps', 'Barra', 'Extension de triceps acostado o sentado.'),
  (null, 'Extension de triceps en polea', 'Brazos', 'Triceps', 'Polea', 'Jalon hacia abajo, clasico de triceps.'),
  (null, 'Fondos en banco', 'Brazos', 'Triceps', 'Peso corporal', 'Dips apoyando manos en banco.'),
  (null, 'Fondos en paralelas', 'Brazos', 'Triceps', 'Peso corporal', 'Torso vertical para enfocar triceps.'),
  (null, 'Extension de triceps con mancuerna', 'Brazos', 'Triceps', 'Mancuerna', 'Extension por encima de la cabeza.'),
  (null, 'Patada de triceps con mancuerna', 'Brazos', 'Triceps', 'Mancuerna', 'Extension de codo inclinado hacia adelante.'),
  (null, 'Press cerrado con barra', 'Brazos', 'Triceps', 'Barra', 'Press de banca con agarre estrecho.');

-- Brazos / Antebrazos
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Curl de muneca con barra', 'Brazos', 'Antebrazos', 'Barra', 'Flexion de muneca sentado.'),
  (null, 'Curl de muneca invertido', 'Brazos', 'Antebrazos', 'Barra', 'Extension de muneca, trabaja antebrazo posterior.'),
  (null, 'Curl de muneca con mancuernas', 'Brazos', 'Antebrazos', 'Mancuerna', 'Variante unilateral.'),
  (null, 'Paseo del granjero', 'Brazos', 'Antebrazos', 'Mancuerna', 'Carga y camina, fuerza de agarre.'),
  (null, 'Extension de muneca con polea', 'Brazos', 'Antebrazos', 'Polea', 'Variante guiada.');

-- ============================================================
-- PIERNAS
-- ============================================================

-- Piernas / Cuadriceps
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Sentadilla libre con barra', 'Piernas', 'Cuadriceps', 'Barra', 'Ejercicio compuesto fundamental de piernas.'),
  (null, 'Sentadilla frontal', 'Piernas', 'Cuadriceps', 'Barra', 'Barra al frente, mayor enfasis en cuadriceps.'),
  (null, 'Prensa de piernas', 'Piernas', 'Cuadriceps', 'Maquina', 'Empuje de piernas en maquina inclinada.'),
  (null, 'Extension de cuadriceps en maquina', 'Piernas', 'Cuadriceps', 'Maquina', 'Aislamiento de cuadriceps sentado.'),
  (null, 'Sentadilla hack', 'Piernas', 'Cuadriceps', 'Maquina', 'Variante guiada de sentadilla.'),
  (null, 'Zancadas con mancuernas', 'Piernas', 'Cuadriceps', 'Mancuerna', 'Ejercicio unilateral de pierna.'),
  (null, 'Sentadilla bulgara', 'Piernas', 'Cuadriceps', 'Mancuerna', 'Sentadilla unilateral con pie trasero elevado.');

-- Piernas / Femoral
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Curl femoral acostado en maquina', 'Piernas', 'Femoral', 'Maquina', 'Aislamiento de isquiotibiales acostado.'),
  (null, 'Curl femoral sentado en maquina', 'Piernas', 'Femoral', 'Maquina', 'Variante sentado.'),
  (null, 'Curl femoral de pie en maquina', 'Piernas', 'Femoral', 'Maquina', 'Variante unilateral de pie.'),
  (null, 'Peso muerto rumano con mancuernas', 'Piernas', 'Femoral', 'Mancuerna', '�?nfasis en femoral con mancuernas.');

-- Piernas / Gemelos
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Elevacion de talones de pie en maquina', 'Piernas', 'Gemelos', 'Maquina', 'Ejercicio base de gemelos de pie.'),
  (null, 'Elevacion de talones sentado en maquina', 'Piernas', 'Gemelos', 'Maquina', '�?nfasis en soleo, sentado.'),
  (null, 'Elevacion de talones con mancuernas', 'Piernas', 'Gemelos', 'Mancuerna', 'Variante libre, de pie.'),
  (null, 'Elevacion de talones en prensa', 'Piernas', 'Gemelos', 'Maquina', 'Usando la maquina de prensa de piernas.'),
  (null, 'Salto a la cuerda', 'Piernas', 'Gemelos', 'Peso corporal', 'Trabajo de gemelos y coordinacion.');

-- ============================================================
-- CORE
-- ============================================================

-- Core / Recto abdominal
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Crunch abdominal', 'Core', 'Recto abdominal', 'Peso corporal', 'Ejercicio base de abdomen.'),
  (null, 'Elevacion de piernas colgado', 'Core', 'Recto abdominal', 'Peso corporal', 'Trabaja abdomen inferior, colgado de barra.'),
  (null, 'Crunch en polea alta', 'Core', 'Recto abdominal', 'Polea', 'Crunch de rodillas con resistencia de polea.'),
  (null, 'Crunch en maquina', 'Core', 'Recto abdominal', 'Maquina', 'Variante guiada.'),
  (null, 'Rueda abdominal', 'Core', 'Recto abdominal', 'Otro', 'Ejercicio exigente de abdomen y estabilidad.');

-- Core / Oblicuos
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Giros rusos', 'Core', 'Oblicuos', 'Otro', 'Rotacion de tronco con peso, sentado.'),
  (null, 'Crunch oblicuo lateral', 'Core', 'Oblicuos', 'Peso corporal', 'Flexion lateral de tronco.'),
  (null, 'Lenador en polea', 'Core', 'Oblicuos', 'Polea', 'Movimiento diagonal de rotacion con resistencia.'),
  (null, 'Elevacion de piernas lateral colgado', 'Core', 'Oblicuos', 'Peso corporal', 'Variante lateral colgado de barra.');

-- Core / Estabilizadores profundos
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Plancha abdominal', 'Core', 'Estabilizadores profundos', 'Peso corporal', 'Isometrico fundamental de estabilidad de core.'),
  (null, 'Plancha lateral', 'Core', 'Estabilizadores profundos', 'Peso corporal', 'Variante lateral, trabaja oblicuos profundos.'),
  (null, 'Bird dog', 'Core', 'Estabilizadores profundos', 'Peso corporal', 'Estabilidad en cuatro apoyos, brazo y pierna opuestos.'),
  (null, 'Dead bug', 'Core', 'Estabilizadores profundos', 'Peso corporal', 'Control de core acostado, movimiento contralateral.'),
  (null, 'Pallof press en polea', 'Core', 'Estabilizadores profundos', 'Polea', 'Anti-rotacion, gran ejercicio de estabilidad.');

-- ============================================================
-- GLUTEOS
-- ============================================================

-- Gluteos / Gluteo mayor
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Hip thrust con barra', 'Gluteos', 'Gluteo mayor', 'Barra', 'Ejercicio principal para gluteo mayor.'),
  (null, 'Puente de gluteo', 'Gluteos', 'Gluteo mayor', 'Peso corporal', 'Variante sin peso o con carga ligera.'),
  (null, 'Sentadilla sumo', 'Gluteos', 'Gluteo mayor', 'Mancuerna', 'Postura ancha, mayor activacion de gluteo.'),
  (null, 'Peso muerto sumo', 'Gluteos', 'Gluteo mayor', 'Barra', 'Variante de peso muerto con postura ancha.');

-- Gluteos / Gluteo medio
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Abduccion de cadera en maquina', 'Gluteos', 'Gluteo medio', 'Maquina', 'Aislamiento sentado de gluteo medio.'),
  (null, 'Abduccion de cadera con banda', 'Gluteos', 'Gluteo medio', 'Otro', 'Variante con mini banda de resistencia.'),
  (null, 'Patada lateral en polea', 'Gluteos', 'Gluteo medio', 'Polea', 'Abduccion de cadera con polea baja.'),
  (null, 'Almeja con banda', 'Gluteos', 'Gluteo medio', 'Otro', 'Ejercicio de activacion, acostado de lado.');

-- Gluteos / Gluteo menor
insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Elevacion de pierna lateral de pie', 'Gluteos', 'Gluteo menor', 'Peso corporal', 'Abduccion de cadera de pie.'),
  (null, 'Abduccion de cadera acostado', 'Gluteos', 'Gluteo menor', 'Peso corporal', 'Variante acostado de lado sin equipo.'),
  (null, 'Monster walk con banda', 'Gluteos', 'Gluteo menor', 'Otro', 'Caminata lateral con banda sobre rodillas o tobillos.');

-- ============================================================
-- CARDIO (sin subdivision adicional)
-- ============================================================

insert into public.exercises (
  created_by_user_id, name, muscle_group_parent, muscle_subgroup, equipment, description
) values
  (null, 'Cinta de correr', 'Cardio', 'Cardio', 'Maquina', 'Caminata o carrera continua o en intervalos.'),
  (null, 'Bicicleta estatica', 'Cardio', 'Cardio', 'Maquina', 'Cardio de bajo impacto.'),
  (null, 'Eliptica', 'Cardio', 'Cardio', 'Maquina', 'Cardio de bajo impacto, tren superior e inferior.'),
  (null, 'Escaladora', 'Cardio', 'Cardio', 'Maquina', 'Simulador de subir escaleras.'),
  (null, 'Remo (maquina de cardio)', 'Cardio', 'Cardio', 'Maquina', 'Cardio de cuerpo completo.'),
  (null, 'Saltar la cuerda', 'Cardio', 'Cardio', 'Peso corporal', 'Cardio de alta intensidad, bajo equipo.'),
  (null, 'Burpees', 'Cardio', 'Cardio', 'Peso corporal', 'Ejercicio compuesto de alta intensidad.'),
  (null, 'Mountain climbers', 'Cardio', 'Cardio', 'Peso corporal', 'Cardio con componente de core.');

-- ============================================================
-- Verificacion rapida (opcional)
-- ============================================================
-- select muscle_group_parent, muscle_subgroup, count(*)
-- from public.exercises
-- group by muscle_group_parent, muscle_subgroup
-- order by muscle_group_parent, muscle_subgroup;


