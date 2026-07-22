import { ArrowLeft, ClipboardList, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import PageLoader from "../components/ui/PageLoader";
import { createRoutine, getRoutineDetail, updateRoutine } from "../services/api";

function RoutineForm() {
  const navigate = useNavigate();
  const { routineId } = useParams();
  const isEditing = Boolean(routineId);

  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRoutine() {
      if (!isEditing) {
        return;
      }

      try {
        const data = await getRoutineDetail(routineId);
        setForm({
          name: data.name || "",
          description: data.description || "",
        });
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar la rutina.");
      } finally {
        setLoading(false);
      }
    }

    loadRoutine();
  }, [isEditing, routineId]);

  const helperText = useMemo(() => {
    if (!form.name.trim()) {
      return "Dale un nombre fácil de reconocer.";
    }

    if (form.name.trim().length < 4) {
      return "Un poco más descriptivo te va a ayudar a encontrarla rápido.";
    }

    return "Se ve bien. Después podés ajustar ejercicios y orden.";
  }, [form.name]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Poné un nombre para la rutina.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      };

      if (isEditing) {
        await updateRoutine(routineId, payload);
        navigate(`/routines/${routineId}`);
      } else {
        const createdRoutine = await createRoutine(payload);
        navigate(`/routines/${createdRoutine.id}`);
      }
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar la rutina.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PageLoader label="Cargando rutina..." />;
  }

  return (
    <AppShell
      activeSection="rutinas"
      header={
        <div className="fc-shell-header">
          <div>
            <h1 className="fc-dashboard__title">
              {isEditing ? "Editar rutina" : "Nueva rutina"}
            </h1>
            <p className="fc-dashboard__subtitle">
              Definí una base clara. Después vas a poder sumar ejercicios y ajustar el orden.
            </p>
          </div>

          <Button variant="ghost" onClick={() => navigate(isEditing ? `/routines/${routineId}` : "/routines")}>
            <ArrowLeft size={16} />
            Volver
          </Button>
        </div>
      }
    >
      <div className="fc-routine-form-layout">
        <Card glass>
          <form className="fc-form" onSubmit={handleSubmit}>
            <span className="fc-text-eyebrow">
              <ClipboardList size={14} />
              Datos base
            </span>

            <Input
              id="routine-name"
              label="Nombre"
              placeholder="Ej. Torso fuerza / Piernas A / Full body"
              value={form.name}
              helperText={helperText}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />

            <div className="fc-field">
              <label className="fc-field__label" htmlFor="routine-description">
                Descripción
              </label>
              <textarea
                id="routine-description"
                className="fc-input fc-textarea"
                placeholder="Opcional. Podés usarlo para indicar enfoque, frecuencia o sensaciones."
                rows={5}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>

            {error ? <p className="fc-form-message">{error}</p> : null}

            <div className="fc-form-actions">
              <Button type="submit" loading={saving}>
                <Save size={16} />
                {isEditing ? "Guardar cambios" : "Crear rutina"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(isEditing ? `/routines/${routineId}` : "/routines")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>

        <Card glass>
          <div className="fc-routine-helper">
            <span className="fc-text-eyebrow">Consejo</span>
            <h2 className="fc-section-title">Hacela fácil de ubicar</h2>
            <p className="fc-card-text">
              Un buen nombre evita dudas cuando empieces a acumular rutinas. Pensala por día, objetivo o bloque.
            </p>
            <div className="fc-helper-list">
              <span className="fc-pill">Empuje superior</span>
              <span className="fc-pill">Piernas fuerza</span>
              <span className="fc-pill">Full body express</span>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export default RoutineForm;
