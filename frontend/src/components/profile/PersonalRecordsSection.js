import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Trophy, X } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import SectionLocked from "./SectionLocked";
import VisibilitySelector from "./VisibilitySelector";
import { getExercises } from "../../services/api";
import { deletePersonalRecord, updateVisibility, upsertPersonalRecord } from "../../services/socialClient";

const RECORD_TYPES = [
  { value: "peso", label: "Peso" },
  { value: "reps", label: "Reps" },
  { value: "tiempo", label: "Tiempo" },
  { value: "distancia", label: "Distancia" },
];

function emptyForm() {
  return { exercise_id: "", exercise_name: "", record_type: "peso", value: "", unit: "", notes: "" };
}

function PersonalRecordsSection({ userId, isSelf, section, onRefresh }) {
  const [form, setForm] = useState(emptyForm());
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSelf) {
      return;
    }

    getExercises()
      .then((response) => setCatalog(response.items || []))
      .catch(() => setCatalog([]));
  }, [isSelf]);

  const matches = useMemo(() => {
    const query = exerciseQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return catalog.filter((exercise) => exercise.name.toLowerCase().includes(query)).slice(0, 8);
  }, [exerciseQuery, catalog]);

  if (!isSelf && !section.visible) {
    return <SectionLocked label="Los records de este usuario no son visibles para vos." />;
  }

  const records = section.data || [];

  function selectExercise(exercise) {
    setForm((current) => ({ ...current, exercise_id: exercise.id, exercise_name: exercise.name }));
    setExerciseQuery("");
  }

  function clearExercise() {
    setForm((current) => ({ ...current, exercise_id: "", exercise_name: "" }));
  }

  async function handleAdd() {
    setError("");

    if (!form.exercise_name.trim() || !form.value) {
      setError("Elegi un ejercicio del catalogo y completa el valor del record.");
      return;
    }

    setSaving(true);

    try {
      await upsertPersonalRecord(userId, {
        exercise_id: form.exercise_id || null,
        exercise_name: form.exercise_name.trim(),
        record_type: form.record_type,
        value: Number.parseFloat(form.value),
        unit: form.unit.trim() || null,
        notes: form.notes.trim() || null,
      });
      setForm(emptyForm());
      await onRefresh();
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar el record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setBusyId(id);
    setError("");

    try {
      await deletePersonalRecord(id);
      await onRefresh();
    } catch (deleteError) {
      setError(deleteError.message || "No se pudo eliminar el record.");
    } finally {
      setBusyId("");
    }
  }

  async function handleVisibilityChange(value) {
    try {
      await updateVisibility(userId, "prs_visibility", value);
      await onRefresh();
    } catch (visibilityError) {
      setError(visibilityError.message || "No se pudo actualizar la visibilidad.");
    }
  }

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <span className="fc-text-eyebrow">
          <Trophy size={14} />
          Records personales
        </span>

        {records.length ? (
          <div className="fc-routine-list">
            {records.map((record) => (
              <div key={record.id} className="fc-friend-card">
                <div className="fc-friend-card__meta">
                  <strong>{record.exercise_name}</strong>
                  <span className="fc-pill">
                    {record.value} {record.unit || ""} · {RECORD_TYPES.find((type) => type.value === record.record_type)?.label}
                  </span>
                </div>
                {isSelf ? (
                  <div className="fc-friend-card__actions">
                    <Button
                      variant="ghost"
                      loading={busyId === record.id}
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="fc-card-text">Todavia no hay records cargados.</p>
        )}

        {isSelf ? (
          <>
            <div className="fc-add-panel">
              <p className="fc-add-panel__title">
                <Plus size={15} />
                Agregar record
              </p>

              <div style={{ display: "grid", gap: "0.5rem" }}>
                <span className="fc-field__label">Ejercicio (del catalogo)</span>
                {form.exercise_id ? (
                  <span className="fc-pill">
                    {form.exercise_name}
                    <button type="button" className="fc-pill-clear" onClick={clearExercise} aria-label="Cambiar ejercicio">
                      <X size={12} />
                    </button>
                  </span>
                ) : (
                  <div style={{ position: "relative" }}>
                    <input
                      className="fc-input"
                      placeholder="Buscar ejercicio del catalogo..."
                      value={exerciseQuery}
                      onChange={(event) => setExerciseQuery(event.target.value)}
                    />
                    {matches.length ? (
                      <div className="fc-autocomplete">
                        {matches.map((exercise) => (
                          <button
                            key={exercise.id}
                            type="button"
                            className="fc-autocomplete__item"
                            onClick={() => selectExercise(exercise)}
                          >
                            {exercise.name}
                            <small>{exercise.muscle_group_parent}</small>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                <Input
                  id="pr-value"
                  label="Valor"
                  type="number"
                  inputMode="decimal"
                  value={form.value}
                  onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                />
                <Input
                  id="pr-unit"
                  label="Unidad (opcional)"
                  placeholder="kg, seg, km..."
                  value={form.unit}
                  onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                />
              </div>

              <div className="fc-option-grid fc-option-grid--compact">
                {RECORD_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`fc-option-card ${form.record_type === type.value ? "is-selected" : ""}`}
                    onClick={() => setForm((current) => ({ ...current, record_type: type.value }))}
                  >
                    <span className="fc-option-card__label">{type.label}</span>
                  </button>
                ))}
              </div>

              {error ? <p className="fc-form-message">{error}</p> : null}
              <Button loading={saving} onClick={handleAdd}>
                Agregar record
              </Button>
            </div>
            <VisibilitySelector value={section.visibility} onChange={handleVisibilityChange} />
          </>
        ) : null}
      </div>
    </Card>
  );
}

export default PersonalRecordsSection;
