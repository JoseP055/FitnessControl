import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import RoutineCalendar from "../components/routines/RoutineCalendar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PageLoader from "../components/ui/PageLoader";
import { deleteRoutine, getRoutineOverview } from "../services/api";

function capitalize(value) {
  if (!value) {
    return "Sin grupo";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function RoutineDetail() {
  const navigate = useNavigate();
  const { routineId } = useParams();

  const [schedule, setSchedule] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const overview = await getRoutineOverview(routineId);
        const scheduleResponse = overview?.schedule || null;
        const calendarResponse = overview?.calendar || null;

        setSchedule(scheduleResponse);
        setCalendar(calendarResponse);
        setSelectedDate(
          calendarResponse.next_training_date || calendarResponse.items?.[0]?.date || ""
        );
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar la rutina.");
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [routineId]);

  async function handleDeleteRoutine() {
    setBusyAction("delete-routine");
    setError("");

    try {
      await deleteRoutine(routineId);
      navigate("/routines");
    } catch (deleteError) {
      setError(deleteError.message || "No se pudo eliminar la rutina.");
    } finally {
      setBusyAction("");
    }
  }

  if (loading) {
    return <PageLoader label="Cargando detalle de la rutina..." />;
  }

  const selectedItems = (calendar?.items || []).filter((item) => item.date === selectedDate);
  const selectedItem = selectedItems[0] || null;
  const selectedDay = schedule?.days?.find((day) => day.id === selectedItem?.routine_day_id) || null;
  const totalExercises = schedule?.days?.reduce(
    (accumulator, day) => accumulator + (day.exercise_count || 0),
    0
  );

  return (
    <AppShell
      activeSection="rutinas"
      header={
        <div className="fc-shell-header">
          <div>
            <h1 className="fc-dashboard__title">{schedule?.name || "Rutina"}</h1>
            <p className="fc-dashboard__subtitle">
              {schedule?.description || "Revisa la planificacion semanal de tu rutina."}
            </p>
          </div>

          <div className="fc-shell-actions">
            <Button variant="ghost" onClick={() => navigate("/routines")}>
              <ArrowLeft size={16} />
              Volver
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/routines/${routineId}/edit`)}>
              <Pencil size={16} />
              Editar datos
            </Button>
          </div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="fc-dashboard-stack"
      >
        <div className="fc-dashboard-grid">
          <Card glass>
            <div className="fc-routine-summary">
              <span className="fc-text-eyebrow">
                <ClipboardList size={14} />
                Estructura
              </span>
              <div className="fc-metric">
                <span className="fc-metric__value">{schedule?.day_count || 0}</span>
                <span className="fc-metric__label">Dias activos por semana</span>
              </div>
            </div>
          </Card>

          <Card glass>
            <div className="fc-routine-summary">
              <span className="fc-text-eyebrow">
                <CalendarDays size={14} />
                Calendario
              </span>
              <div className="fc-metric">
                <span className="fc-metric__value">{calendar?.total_scheduled_sessions || 0}</span>
                <span className="fc-metric__label">Sesiones programadas</span>
              </div>
            </div>
          </Card>

          <Card glass>
            <div className="fc-routine-summary">
              <span className="fc-text-eyebrow">
                <CalendarCheck size={14} />
                Ejercicios
              </span>
              <div className="fc-metric">
                <span className="fc-metric__value">{totalExercises || 0}</span>
                <span className="fc-metric__label">Ejercicios planificados</span>
              </div>
            </div>
          </Card>
        </div>

        {error ? (
          <Card glass>
            <p className="fc-form-message" style={{ margin: 0 }}>
              {error}
            </p>
          </Card>
        ) : null}

        <Card glass>
          <RoutineCalendar
            startDate={calendar?.start_date}
            endDate={calendar?.end_date}
            items={calendar?.items || []}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            interactive
          />
        </Card>

        {selectedDay ? (
          <div className="fc-routine-exercises">
            {selectedDay.exercises.map((item) => {
              const exercise = item.exercise || {};
              return (
                <Card key={item.id} glass className="fc-routine-exercise-card">
                  <div className="fc-routine-exercise-card__top">
                    <div className="fc-routine-exercise-card__name">
                      <span className="fc-text-eyebrow">#{item.exercise_order}</span>
                      <h2 className="fc-section-title">{exercise.name || "Ejercicio"}</h2>
                    </div>
                    <div className="fc-catalog-item__meta">
                      <span className="fc-pill">{exercise.muscle_group_parent || "Sin grupo"}</span>
                      <span className="fc-pill">{exercise.muscle_subgroup || "Sin subgrupo"}</span>
                    </div>
                  </div>

                  <div className="fc-kv-grid">
                    <div className="fc-kv">
                      <span className="fc-kv__label">Series</span>
                      <span className="fc-kv__value">{item.sets_planned || "-"}</span>
                    </div>
                    <div className="fc-kv">
                      <span className="fc-kv__label">
                        {item.duration_minutes ? "Duracion" : "Reps"}
                      </span>
                      <span className="fc-kv__value">
                        {item.duration_minutes ? `${item.duration_minutes} min` : item.reps_planned || "-"}
                      </span>
                    </div>
                    <div className="fc-kv">
                      <span className="fc-kv__label">Descanso</span>
                      <span className="fc-kv__value">{item.rest_seconds ? `${item.rest_seconds}s` : "-"}</span>
                    </div>
                  </div>

                  {item.notes ? <p className="fc-card-text">{item.notes}</p> : null}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card glass className="fc-empty-state">
            <div className="fc-empty-state__icon">
              <CalendarDays size={28} />
            </div>
            <h2 className="fc-section-title">Elegi una fecha del calendario</h2>
            <p className="fc-card-text">
              Al seleccionar un dia programado vas a ver sus ejercicios.
            </p>
          </Card>
        )}

        {(schedule?.legacy_exercises || []).length ? (
          <Card glass>
            <div className="fc-routine-summary">
              <span className="fc-text-eyebrow">Compatibilidad</span>
              <h2 className="fc-section-title">Ejercicios legacy</h2>
              <p className="fc-card-text">
                Esta rutina todavia tiene ejercicios del flujo anterior sin dia semanal asignado. Podes mantenerlos como referencia y crear una rutina nueva con el wizard para usar calendario completo.
              </p>
            </div>
          </Card>
        ) : null}

        <Card glass>
          <div className="fc-danger-zone">
            <div>
              <span className="fc-text-eyebrow">Zona delicada</span>
              <h2 className="fc-section-title">Eliminar rutina</h2>
              <p className="fc-card-text">
                Borra la estructura completa y todos los ejercicios planificados de esta rutina.
              </p>
            </div>
            <Button
              variant="danger"
              loading={busyAction === "delete-routine"}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 size={16} />
              Eliminar rutina
            </Button>
          </div>
        </Card>

        <ConfirmDialog
          open={confirmDeleteOpen}
          title="Eliminar rutina"
          description="Esto borra la rutina completa. No se puede deshacer."
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          loading={busyAction === "delete-routine"}
          onCancel={() => setConfirmDeleteOpen(false)}
          onConfirm={handleDeleteRoutine}
        />
      </motion.div>
    </AppShell>
  );
}

export default RoutineDetail;
