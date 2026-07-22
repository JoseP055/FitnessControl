import { motion } from "framer-motion";
import { ClipboardList, Dumbbell, Plus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageLoader from "../components/ui/PageLoader";
import { getRoutines } from "../services/api";

function RoutineList() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
              Creá, ordená y ajustá cada rutina con una estructura clara y rápida de editar.
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
                Siguiente paso
              </span>
              <p className="fc-card-text">
                Armá primero una base simple y después afiná series, repeticiones y descansos.
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
            <h2 className="fc-section-title">Todavía no tenés rutinas creadas</h2>
            <p className="fc-card-text">
              Empezá con una estructura simple y después agregá ejercicios desde el catálogo.
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
                    <span className="fc-pill">{routine.exercise_count || 0} ejercicios</span>
                  </div>

                  <p className="fc-card-text">
                    {routine.description || "Sin descripción todavía. Podés agregarla al editar."}
                  </p>

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
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default RoutineList;
