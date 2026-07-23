import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Download, Sparkles, Target } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";
import { getTodaysTraining, toggleTodaysExercise } from "../../services/api";
import { downloadWorkoutReportPdf } from "../../utils/workoutReport";

function TodayWorkoutSection() {
  const navigate = useNavigate();
  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load() {
    try {
      const data = await getTodaysTraining();
      setTraining(data);
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el entrenamiento de hoy.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggle(exercise) {
    setBusyId(exercise.routine_exercise_id);
    setError("");

    try {
      await toggleTodaysExercise(exercise.routine_exercise_id, !exercise.completed);
      await load();
    } catch (toggleError) {
      setError(toggleError.message || "No se pudo actualizar el ejercicio.");
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return (
      <Card glass>
        <p className="fc-card-text">Cargando entrenamiento de hoy...</p>
      </Card>
    );
  }

  if (!training?.has_training_today) {
    return (
      <Card glass>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <span className="fc-text-eyebrow">
            <Target size={14} />
            Hoy
          </span>
          <p className="fc-card-text">No tenes entrenamiento programado para hoy. Aprovecha para descansar.</p>
        </div>
      </Card>
    );
  }

  const completedCount = training.exercises.filter((exercise) => exercise.completed).length;
  const progressPercent = training.exercises.length
    ? Math.round((completedCount / training.exercises.length) * 100)
    : 0;

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <span className="fc-text-eyebrow">
              <Target size={14} />
              Hoy toca: {training.routine_name}
            </span>
            <div className="fc-helper-list" style={{ marginTop: "0.5rem" }}>
              {training.muscle_groups.map((group) => (
                <span key={group} className="fc-pill">
                  {group}
                </span>
              ))}
            </div>
          </div>
          <span className="fc-pill">
            {completedCount}/{training.exercises.length} completados
          </span>
        </div>

        <div className="fc-progress">
          <div className="fc-progress__bar" style={{ width: `${progressPercent}%` }} />
        </div>

        {error ? <p className="fc-form-message">{error}</p> : null}

        <div className="fc-routine-list">
          {training.exercises.map((exercise) => (
            <div key={exercise.routine_exercise_id} className="fc-today-exercise">
              <button
                type="button"
                className={`fc-today-exercise__check ${exercise.completed ? "is-done" : ""}`}
                onClick={() => handleToggle(exercise)}
                disabled={busyId === exercise.routine_exercise_id}
                aria-label={exercise.completed ? "Marcar como pendiente" : "Marcar como hecho"}
              >
                {exercise.completed ? <Check size={16} /> : null}
              </button>
              <div className="fc-today-exercise__info">
                <div className={exercise.completed ? "fc-today-exercise__name is-done" : "fc-today-exercise__name"}>
                  {exercise.name}
                </div>
                <small className="fc-text-eyebrow">
                  {exercise.duration_minutes
                    ? `${exercise.duration_minutes} min`
                    : `${exercise.sets_planned || "-"} series x ${exercise.reps_planned || "-"} reps`}
                  {exercise.rest_seconds ? ` · Descanso ${exercise.rest_seconds}s` : ""}
                </small>
              </div>
            </div>
          ))}
        </div>

        {training.all_completed ? (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={() => downloadWorkoutReportPdf(training)}>
              <Download size={16} />
              Descargar reporte PDF
            </Button>
          </div>
        ) : (
          <Button onClick={() => navigate("/focus")}>
            <Sparkles size={16} />
            Modo enfoque
          </Button>
        )}
      </div>
    </Card>
  );
}

export default TodayWorkoutSection;
