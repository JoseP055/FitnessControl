import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  Check,
  ClipboardList,
  Pencil,
  SkipForward,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import RoutineCalendar from "../components/routines/RoutineCalendar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PageLoader from "../components/ui/PageLoader";
import {
  deleteRoutine,
  getRoutineCalendar,
  getRoutineOverview,
  upsertRoutineCompletion,
} from "../services/api";

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

  const weekdayLabels = useMemo(
    () => ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"],
    []
  );
  const monthLabels = useMemo(
    () => ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    []
  );

  function formatActiveDate(dateValue) {
    if (!dateValue) {
      return "Elegi una fecha";
    }

    const date = new Date(`${dateValue}T00:00:00`);
    const weekday = weekdayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1];
    return `${weekday} ${String(date.getDate()).padStart(2, "0")} ${monthLabels[date.getMonth()]}`;
  }

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

  async function refreshData(nextSelectedDate = selectedDate) {
    const calendarResponse = await getRoutineCalendar(routineId);
    setCalendar(calendarResponse);

    const availableDate =
      calendarResponse.items?.some((item) => item.date === nextSelectedDate)
        ? nextSelectedDate
        : calendarResponse.next_training_date || calendarResponse.items?.[0]?.date || "";

    setSelectedDate(availableDate);
  }

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

  async function updateCompletionStatus(item, nextStatus) {
    setBusyAction(`${item.routine_day_id}-${item.date}-${nextStatus}`);
    setError("");

    try {
      await upsertRoutineCompletion(routineId, {
        routine_day_id: item.routine_day_id,
        completion_date: item.date,
        status: nextStatus,
      });
      await refreshData(item.date);
    } catch (saveError) {
      setError(saveError.message || "No se pudo actualizar el estado del entrenamiento.");
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

  function renderStatusLabel(status) {
    switch (status) {
      case "done":
        return "Hecho";
      case "skipped":
        return "Omitido";
      default:
        return "Pendiente";
    }
  }

  return (
    <AppShell
      activeSection="rutinas"
      header={
        <div className="fc-shell-header">
          <div>
            <h1 className="fc-dashboard__title">{schedule?.name || "Rutina"}</h1>
            <p className="fc-dashboard__subtitle">
              {schedule?.description ||
                "Revisa la planificacion semanal y marca cada fecha como hecha, pendiente u omitida."}
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

        <div className="fc-routine-detail-layout">
          <Card glass className="fc-routine-detail-layout__calendar">
            <RoutineCalendar
              startDate={calendar?.start_date}
              endDate={calendar?.end_date}
              items={calendar?.items || []}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              interactive
            />
          </Card>

          <div className="fc-routine-detail-layout__side">
            <Card glass>
              <div className="fc-routine-summary">
                <span className="fc-text-eyebrow">
                  <CalendarCheck size={14} />
                  Fecha activa
                </span>
                <h2 className="fc-section-title">
                  {formatActiveDate(selectedDate)}
                </h2>
                <p className="fc-card-text">
                  {selectedItem
                    ? `Estado actual: ${renderStatusLabel(selectedItem.status)}`
                    : "Selecciona una fecha marcada en el calendario para ver su detalle."}
                </p>
                {selectedItem ? (
                  <div className="fc-routine-status-inline">
                    <Button
                      loading={busyAction === `${selectedItem.routine_day_id}-${selectedItem.date}-done`}
                      onClick={() => updateCompletionStatus(selectedItem, "done")}
                    >
                      <Check size={16} />
                      Hecho
                    </Button>
                    <Button
                      variant="secondary"
                      loading={busyAction === `${selectedItem.routine_day_id}-${selectedItem.date}-pending`}
                      onClick={() => updateCompletionStatus(selectedItem, "pending")}
                    >
                      <CalendarCheck size={16} />
                      Pendiente
                    </Button>
                    <Button
                      variant="ghost"
                      loading={busyAction === `${selectedItem.routine_day_id}-${selectedItem.date}-skipped`}
                      onClick={() => updateCompletionStatus(selectedItem, "skipped")}
                    >
                      <SkipForward size={16} />
                      Omitido
                    </Button>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        </div>

        <div className="fc-routine-summary-grid">
          {(schedule?.days || []).map((day) => (
            <Card key={day.id} glass className="fc-routine-summary-day">
              <div className="fc-routine-card__top">
                <div>
                  <span className="fc-text-eyebrow">Dia</span>
                  <h3 className="fc-section-title">
                    {day.muscle_groups?.length ? day.muscle_groups.join(" / ") : "Plan"}
                  </h3>
                </div>
                <span className="fc-pill">{day.exercise_count || 0} ejercicios</span>
              </div>
              <div className="fc-helper-list">
                {(day.muscle_groups || []).map((group) => (
                  <span key={group} className="fc-pill">
                    {group}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {selectedDay ? (
          <div className="fc-routine-exercises">
            {selectedDay.exercises.map((item) => {
              const exercise = item.exercise || {};
              return (
                <Card key={item.id} glass className="fc-routine-exercise-card">
                  <div className="fc-routine-exercise-card__top">
                    <div>
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
              Al seleccionar un dia programado vas a ver sus ejercicios y vas a poder marcarlo como hecho, pendiente u omitido.
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
