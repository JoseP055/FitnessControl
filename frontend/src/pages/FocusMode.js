import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Download, Play, SkipForward, X } from "lucide-react";

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

// Por ejercicio: si es "por tiempo" (duration_minutes), cada serie es un
// timer que cuenta la duracion de esa serie. Si es "por repeticiones", cada
// serie se completa a mano (no hay forma de medir reps automaticamente). El
// descanso (rest_seconds) es SIEMPRE entre series de un mismo ejercicio: con
// N series hay N-1 descansos. Al terminar la ultima serie, el ejercicio
// completo se marca hecho y se pasa al siguiente sin descanso adicional.
function FocusMode() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState([]);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [phase, setPhase] = useState("set-manual");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [finishedTraining, setFinishedTraining] = useState(null);
  const [busy, setBusy] = useState(false);
  const intervalRef = useRef(null);

  const currentExercise = pending[exerciseIndex];
  const totalSets = currentExercise?.sets_planned || 1;

  function enterSet(exercise) {
    setPhase(exercise.duration_minutes ? "set-ready" : "set-manual");
  }

  useEffect(() => {
    getTodaysTraining()
      .then((data) => {
        if (!data.has_training_today) {
          setPhase("no-training");
          return;
        }

        const remaining = data.exercises.filter((exercise) => !exercise.completed);
        if (!remaining.length) {
          setPhase("done");
          setFinishedTraining(data);
          return;
        }

        setPending(remaining);
        enterSet(remaining[0]);
      })
      .catch((loadError) => setError(loadError.message || "No se pudo cargar el entrenamiento de hoy."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (phase !== "working" && phase !== "resting") {
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          clearInterval(intervalRef.current);
          if (phase === "working") {
            handleSetFinished();
          } else {
            goToNextSet();
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line
  }, [phase]);

  function goToNextSet() {
    setSetNumber((current) => current + 1);
    enterSet(currentExercise);
  }

  function startDurationSet() {
    setRemainingSeconds((currentExercise.duration_minutes || 1) * 60);
    setPhase("working");
  }

  async function handleSetFinished() {
    clearInterval(intervalRef.current);

    if (setNumber < totalSets) {
      const rest = currentExercise.rest_seconds || 0;
      if (rest > 0) {
        setRemainingSeconds(rest);
        setPhase("resting");
      } else {
        goToNextSet();
      }
      return;
    }

    setBusy(true);
    setError("");

    try {
      await toggleTodaysExercise(currentExercise.routine_exercise_id, true);
      advanceToNextExercise();
    } catch (completeError) {
      setError(completeError.message || "No se pudo marcar el ejercicio.");
    } finally {
      setBusy(false);
    }
  }

  function advanceToNextExercise() {
    const nextIndex = exerciseIndex + 1;
    if (nextIndex >= pending.length) {
      finishSession();
      return;
    }

    setExerciseIndex(nextIndex);
    setSetNumber(1);
    enterSet(pending[nextIndex]);
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

  function handleSkipRest() {
    clearInterval(intervalRef.current);
    goToNextSet();
  }

  if (loading) {
    return <PageLoader label="Preparando modo enfoque..." />;
  }

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

          {(phase === "set-ready" || phase === "working" || phase === "set-manual") && currentExercise ? (
            <div className="fc-focus-screen">
              <span className="fc-text-eyebrow">
                Ejercicio {exerciseIndex + 1} / {pending.length} · Serie {setNumber} / {totalSets}
              </span>
              <h1 className="fc-focus-screen__exercise">{currentExercise.name}</h1>

              {phase === "working" ? (
                <div className="fc-focus-screen__timer">{formatSeconds(remainingSeconds)}</div>
              ) : (
                <p className="fc-card-text">
                  {currentExercise.duration_minutes
                    ? `${currentExercise.duration_minutes} min por serie`
                    : `${currentExercise.reps_planned || "-"} reps`}
                </p>
              )}

              {currentExercise.notes ? <p className="fc-card-text">{currentExercise.notes}</p> : null}

              {phase === "set-ready" ? (
                <Button onClick={startDurationSet}>
                  <Play size={18} />
                  Comenzar serie
                </Button>
              ) : null}

              {phase === "working" ? (
                <Button loading={busy} variant="secondary" onClick={handleSetFinished}>
                  <Check size={18} />
                  Termine antes
                </Button>
              ) : null}

              {phase === "set-manual" ? (
                <Button loading={busy} onClick={handleSetFinished}>
                  <Check size={18} />
                  Completar serie
                </Button>
              ) : null}
            </div>
          ) : null}

          {phase === "resting" ? (
            <div className="fc-focus-screen">
              <span className="fc-text-eyebrow">Descanso</span>
              <div className="fc-focus-screen__timer">{formatSeconds(remainingSeconds)}</div>
              <p className="fc-card-text">
                Preparando serie {setNumber + 1} / {totalSets} de {currentExercise?.name}
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
