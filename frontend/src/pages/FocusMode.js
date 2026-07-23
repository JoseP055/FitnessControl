import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Download, SkipForward, X } from "lucide-react";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageLoader from "../components/ui/PageLoader";
import { getTodaysTraining, toggleTodaysExercise } from "../services/api";
import { downloadWorkoutReportPdf } from "../utils/workoutReport";

function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function FocusMode() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("exercise");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [finishedTraining, setFinishedTraining] = useState(null);
  const [busy, setBusy] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    getTodaysTraining()
      .then((data) => {
        if (!data.has_training_today) {
          setPhase("no-training");
        } else {
          const remaining = data.exercises.filter((exercise) => !exercise.completed);
          if (!remaining.length) {
            setPhase("done");
            setFinishedTraining(data);
          } else {
            setPending(remaining);
            setPhase("exercise");
          }
        }
      })
      .catch((loadError) => setError(loadError.message || "No se pudo cargar el entrenamiento de hoy."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (phase !== "resting") {
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          clearInterval(intervalRef.current);
          advance();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [phase]);

  function advance() {
    setCurrentIndex((current) => {
      const nextIndex = current + 1;
      if (nextIndex >= pending.length) {
        finishSession();
        return current;
      }
      setPhase("exercise");
      return nextIndex;
    });
  }

  async function finishSession() {
    setPhase("done");
    try {
      const data = await getTodaysTraining();
      setFinishedTraining(data);
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar el resumen final.");
    }
  }

  async function handleCompleteExercise() {
    const exercise = pending[currentIndex];
    setBusy(true);
    setError("");

    try {
      await toggleTodaysExercise(exercise.routine_exercise_id, true);

      if (exercise.rest_seconds > 0) {
        setRemainingSeconds(exercise.rest_seconds);
        setPhase("resting");
      } else {
        advance();
      }
    } catch (completeError) {
      setError(completeError.message || "No se pudo marcar el ejercicio.");
    } finally {
      setBusy(false);
    }
  }

  function handleSkipRest() {
    clearInterval(intervalRef.current);
    advance();
  }

  if (loading) {
    return <PageLoader label="Preparando modo enfoque..." />;
  }

  const currentExercise = pending[currentIndex];
  const nextExercise = pending[currentIndex + 1];

  return (
    <div className="fc-page">
      <div className="fc-page__noise" />
      <div style={{ position: "relative", zIndex: 1, padding: "2rem", maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <span className="fc-text-eyebrow">Modo enfoque</span>
          <Button variant="ghost" onClick={() => navigate("/dashboard?tab=resumen")}>
            <X size={16} />
            Salir
          </Button>
        </div>

        <Card glass>
          {error ? <p className="fc-form-message">{error}</p> : null}

          {phase === "no-training" ? (
            <div className="fc-focus-screen">
              <p className="fc-card-text">No tenes entrenamiento programado para hoy.</p>
              <Button onClick={() => navigate("/dashboard?tab=resumen")}>Volver al resumen</Button>
            </div>
          ) : null}

          {phase === "exercise" && currentExercise ? (
            <div className="fc-focus-screen">
              <span className="fc-text-eyebrow">
                Ejercicio {currentIndex + 1} / {pending.length}
              </span>
              <h1 className="fc-focus-screen__exercise">{currentExercise.name}</h1>
              <p className="fc-card-text">
                {currentExercise.duration_minutes
                  ? `${currentExercise.duration_minutes} min`
                  : `${currentExercise.sets_planned || "-"} series x ${currentExercise.reps_planned || "-"} reps`}
              </p>
              {currentExercise.notes ? <p className="fc-card-text">{currentExercise.notes}</p> : null}
              <Button loading={busy} onClick={handleCompleteExercise}>
                <Check size={18} />
                Completar ejercicio
              </Button>
            </div>
          ) : null}

          {phase === "resting" ? (
            <div className="fc-focus-screen">
              <span className="fc-text-eyebrow">Descanso</span>
              <div className="fc-focus-screen__timer">{formatSeconds(remainingSeconds)}</div>
              <p className="fc-card-text">
                {nextExercise ? `Preparando: ${nextExercise.name}` : "Preparando el cierre de la sesion..."}
              </p>
              <Button variant="ghost" onClick={handleSkipRest}>
                <SkipForward size={16} />
                Saltar descanso
              </Button>
            </div>
          ) : null}

          {phase === "done" ? (
            <div className="fc-focus-screen">
              <span className="fc-text-eyebrow">Listo</span>
              <h1 className="fc-focus-screen__exercise">Entrenamiento completado</h1>
              <p className="fc-card-text">Marcaste todos los ejercicios de hoy. Buen trabajo.</p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                {finishedTraining ? (
                  <Button variant="secondary" onClick={() => downloadWorkoutReportPdf(finishedTraining)}>
                    <Download size={16} />
                    Descargar reporte PDF
                  </Button>
                ) : null}
                <Button onClick={() => navigate("/dashboard?tab=resumen")}>Volver al resumen</Button>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

export default FocusMode;
