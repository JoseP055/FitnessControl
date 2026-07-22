import { motion } from "framer-motion";
import { CalendarDays, ClipboardList, Dumbbell, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PageLoader from "../components/ui/PageLoader";
import { deleteRoutine, getRoutines } from "../services/api";

function RoutineList() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyRoutineId, setBusyRoutineId] = useState("");
  const [routineToDelete, setRoutineToDelete] = useState(null);

  useEffect(() => {
    async function loadRoutines() {
      try {
        const response = await getRoutines();
        setRoutines(response.items || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar tus rutinas.");
      } finally {
        setLoading(false);
      }
    }

    loadRoutines();
  }, []);

  async function handleDeleteRoutine() {
    if (!routineToDelete?.id) {
      return;
    }

    setBusyRoutineId(routineToDelete.id);
    setError("");

    try {
      await deleteRoutine(routineToDelete.id);
      setRoutines((current) => current.filter((routine) => routine.id !== routineToDelete.id));
      setRoutineToDelete(null);
    } catch (deleteError) {
      setError(deleteError.message || "No se pudo eliminar la rutina.");
    } finally {
      setBusyRoutineId("");
    }
  }

  const summary = useMemo(() => {
    const totalExercises = routines.reduce(
      (accumulator, routine) => accumulator + (routine.exercise_count || 0),
      0
    );

    return {
      totalRoutines: routines.length,
      totalExercises,
    };
  }, [routines]);

  if (loading) {
    return <PageLoader label="Cargando rutinas..." />;
  }

  return (
    <AppShell
      activeSection="rutinas"
      header={
        <div className="fc-shell-header">
          <div>
            <h1 className="fc-dashboard__title">Tus rutinas</h1>
            <p className="fc-dashboard__subtitle">
              Crea, ordena y ajusta cada rutina con una estructura clara y rapida de editar.
            </p>
          </div>

          <Button onClick={() => navigate("/routines/new")}>
            <Plus size={16} />
            Nueva rutina
          </Button>
        </div>
      }
    >
      <div className="fc-dashboard-stack">
        <div className="fc-dashboard-grid">
          <Card glass>
            <div className="fc-routine-summary">
              <span className="fc-text-eyebrow">
                <ClipboardList size={14} />
                Biblioteca
              </span>
              <div className="fc-metric">
                <span className="fc-metric__value">{summary.totalRoutines}</span>
                <span className="fc-metric__label">Rutinas activas</span>
              </div>
            </div>
          </Card>

          <Card glass>
            <div className="fc-routine-summary">
              <span className="fc-text-eyebrow">
                <Dumbbell size={14} />
                Ejercicios
              </span>
              <div className="fc-metric">
                <span className="fc-metric__value">{summary.totalExercises}</span>
                <span className="fc-metric__label">Ejercicios planificados</span>
              </div>
            </div>
          </Card>

          <Card glass>
            <div className="fc-routine-summary">
              <span className="fc-text-eyebrow">
                <Sparkles size={14} />
                Estado
              </span>
              <p className="fc-card-text">
                El wizard nuevo te deja planear duracion, dias, grupos musculares y calendario en un solo flujo.
              </p>
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

        {routines.length === 0 ? (
          <Card glass className="fc-empty-state">
            <div className="fc-empty-state__icon">
              <ClipboardList size={30} />
            </div>
              <h2 className="fc-section-title">Todavia no tenes rutinas creadas</h2>
            <p className="fc-card-text">
              Empeza con una estructura simple y despues agrega ejercicios desde el catalogo.
            </p>
            <Button onClick={() => navigate("/routines/new")}>
              <Plus size={16} />
              Crear primera rutina
            </Button>
          </Card>
        ) : (
          <div className="fc-routine-list">
            {routines.map((routine, index) => (
              <motion.div
                key={routine.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.18 }}
              >
                <Card glass className="fc-routine-card">
                  <div className="fc-routine-card__top">
                    <div>
                      <span className="fc-text-eyebrow">Rutina</span>
                      <h2 className="fc-section-title">{routine.name}</h2>
                    </div>
                    <span className="fc-pill">{routine.day_count || 0} dias / {routine.exercise_count || 0} ejercicios</span>
                  </div>

                  <p className="fc-card-text">
                    {routine.description || "Sin descripcion todavia. Podes agregarla al editar."}
                  </p>

                  <div className="fc-helper-list">
                    <span className="fc-pill">
                      <CalendarDays size={12} />
                      {routine.start_date || "Sin inicio"}
                    </span>
                    <span className="fc-pill">
                      {routine.duration_months || 1} {routine.duration_months === 1 ? "mes" : "meses"}
                    </span>
                  </div>

                  <div className="fc-routine-card__actions">
                    <Button onClick={() => navigate(`/routines/${routine.id}`)}>
                      Abrir
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/routines/${routine.id}/edit`)}
                    >
                      Editar datos
                    </Button>
                    <Button
                      variant="ghost"
                      loading={busyRoutineId === routine.id}
                      onClick={() => setRoutineToDelete(routine)}
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <ConfirmDialog
          open={Boolean(routineToDelete)}
          title="Eliminar rutina"
          description={`Vas a borrar ${routineToDelete?.name || "esta rutina"} junto con su planificacion. Esto no se puede deshacer.`}
          confirmLabel="Eliminar"
          cancelLabel="Volver"
          loading={busyRoutineId === routineToDelete?.id}
          onCancel={() => setRoutineToDelete(null)}
          onConfirm={handleDeleteRoutine}
        />
      </div>
    </AppShell>
  );
}

export default RoutineList;
