-- 005_seed_exercises.sql
-- Inserta un catálogo inicial global de ejercicios comunes para probar el módulo de rutinas.
-- Se ejecuta después de `002_routines_exercises.sql`.

insert into public.exercises (created_by_user_id, name, muscle_group, equipment, description)
select
  null,
  seed.name,
  seed.muscle_group,
  seed.equipment,
  seed.description
from (
  values
    ('Press de banca', 'pecho', 'barra', 'Empuje horizontal clásico para desarrollar pecho, hombros y tríceps.'),
    ('Flexiones', 'pecho', 'peso corporal', 'Ejercicio básico de empuje que trabaja pecho, hombros y core.'),
    ('Aperturas con mancuernas', 'pecho', 'mancuernas', 'Movimiento de aislamiento para pecho con recorrido controlado.'),
    ('Dominadas', 'espalda', 'barra de dominadas', 'Tirón vertical que fortalece espalda y bíceps.'),
    ('Remo con barra', 'espalda', 'barra', 'Tirón horizontal para ganar grosor y fuerza en la espalda.'),
    ('Jalón al pecho', 'espalda', 'polea', 'Alternativa guiada para trabajar dorsales y parte alta de la espalda.'),
    ('Sentadilla', 'piernas', 'barra', 'Patrón base de piernas para cuádriceps, glúteos y core.'),
    ('Peso muerto', 'piernas', 'barra', 'Movimiento global para cadena posterior, fuerza y estabilidad.'),
    ('Prensa de piernas', 'piernas', 'máquina', 'Ejercicio guiado para desarrollar fuerza en piernas.'),
    ('Zancadas', 'piernas', 'mancuernas', 'Trabajo unilateral para piernas, glúteos y equilibrio.'),
    ('Press militar', 'hombros', 'barra', 'Empuje vertical para hombros y tríceps.'),
    ('Elevaciones laterales', 'hombros', 'mancuernas', 'Aislamiento del deltoide medio para amplitud de hombro.'),
    ('Curl de bíceps', 'brazos', 'mancuernas', 'Flexión de codo enfocada en bíceps.'),
    ('Fondos en paralelas', 'brazos', 'paralelas', 'Empuje para tríceps, pecho y hombros.'),
    ('Extensión de tríceps en polea', 'brazos', 'polea', 'Aislamiento para tríceps con recorrido controlado.'),
    ('Plancha', 'core', 'peso corporal', 'Isométrico para estabilidad del core y control postural.'),
    ('Crunch abdominal', 'core', 'peso corporal', 'Flexión de tronco enfocada en abdomen.'),
    ('Elevación de piernas', 'core', 'peso corporal', 'Ejercicio para abdomen inferior y control lumbo-pélvico.')
) as seed(name, muscle_group, equipment, description)
where not exists (
  select 1
  from public.exercises existing
  where existing.created_by_user_id is null
    and lower(existing.name) = lower(seed.name)
);
