import { ArrowLeft, ClipboardList, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import PageLoader from "../components/ui/PageLoader";
import { getRoutineDetail, updateRoutine } from "../services/api";

function RoutineEditForm() {
  const navigate = useNavigate();
  const { routineId } = useParams();

  const [form, setForm] = useState({
    name: "",
    description: "",
    duration_months: "1",
    start_date: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRoutine() {
      try {
        const data = await getRoutineDetail(routineId);
        setForm({
          name: data.name || "",
          description: data.description || "",
          duration_months: String(data.duration_months || 1),
          start_date: data.start_date || "",
        });
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar la rutina.");
      } finally {
        setLoading(false);
      }
    }

    loadRoutine();
  }, [routineId]);

  const helperText = useMemo(() => {
    if (!form.name.trim()) {
      return "Dale un nombre claro y fácil de reconocer.";
    }

    if (form.name.trim().length < 4) {
      return "Un nombre un poco más descriptivo te va a ayudar después.";
    }

    return "Se ve bien. Los cambios se aplican sobre la rutina actual.";
  }, [form.name]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Poné un nombre para la rutina.");
      return;
    }

    if (!form.start_date) {
      setError("Elegí una fecha de inicio.");
      return;
    }

    setSaving(true);

    try {
      await updateRoutine(routineId, {
        name: form.name.trim(),
        description: form.description.trim(),
        duration_months: Number(form.duration_months),
        start_date: form.start_date,
      });
      navigate(`/routines/${routineId}`);
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
            <h1 className="fc-dashboard__title">Editar rutina</h1>
            <p className="fc-dashboard__subtitle">
              Ajustá los datos generales sin tocar la estructura semanal.
            </p>
          </div>

          <Button variant="ghost" onClick={() => navigate(`/routines/${routineId}`)}>
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
              Datos generales
            </span>

            <Input
              id="routine-name-edit"
              label="Nombre"
              placeholder="Ej. Torso fuerza / Piernas A / Full body"
              value={form.name}
              helperText={helperText}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />

            <div className="fc-field">
              <label className="fc-field__label" htmlFor="routine-description-edit">
                Descripción
              </label>
              <textarea
                id="routine-description-edit"
                className="fc-input fc-textarea"
                rows={5}
                placeholder="Opcional. Podés indicar el enfoque de la rutina."
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>

            <div className="fc-grid-3">
              <Input
                id="routine-duration-edit"
                label="Duración (meses)"
                type="number"
                min="1"
                max="24"
                value={form.duration_months}
                onChange={(event) =>
                  setForm((current) => ({ ...current, duration_months: event.target.value }))
                }
              />
              <Input
                id="routine-start-date-edit"
                label="Fecha de inicio"
                type="date"
                value={form.start_date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, start_date: event.target.value }))
                }
              />
            </div>

            {error ? <p className="fc-form-message">{error}</p> : null}

            <div className="fc-form-actions">
              <Button type="submit" loading={saving}>
                <Save size={16} />
                Guardar cambios
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(`/routines/${routineId}`)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>

        <Card glass>
          <div className="fc-routine-helper">
            <span className="fc-text-eyebrow">Nota</span>
            <h2 className="fc-section-title">La estructura semanal se conserva</h2>
            <p className="fc-card-text">
              Esta pantalla actualiza nombre, descripción, duración y fecha de inicio. Los días y ejercicios siguen tal como ya fueron definidos.
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export default RoutineEditForm;
