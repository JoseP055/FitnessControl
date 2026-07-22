import { useState } from "react";
import { Trash2, Trophy } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import SectionLocked from "./SectionLocked";
import VisibilitySelector from "./VisibilitySelector";
import { deletePersonalRecord, updateVisibility, upsertPersonalRecord } from "../../services/socialClient";

const RECORD_TYPES = [
  { value: "peso", label: "Peso" },
  { value: "reps", label: "Reps" },
  { value: "tiempo", label: "Tiempo" },
  { value: "distancia", label: "Distancia" },
];

function emptyForm() {
  return { exercise_name: "", record_type: "peso", value: "", unit: "", notes: "" };
}

function PersonalRecordsSection({ userId, isSelf, section, onRefresh }) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  if (!isSelf && !section.visible) {
    return <SectionLocked label="Los records de este usuario no son visibles para vos." />;
  }

  const records = section.data || [];

  async function handleAdd() {
    setError("");

    if (!form.exercise_name.trim() || !form.value) {
      setError("Completa el ejercicio y el valor del record.");
      return;
    }

    setSaving(true);

    try {
      await upsertPersonalRecord(userId, {
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
            <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
              <Input
                id="pr-exercise-name"
                label="Ejercicio"
                value={form.exercise_name}
                onChange={(event) => setForm((current) => ({ ...current, exercise_name: event.target.value }))}
              />
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
            <VisibilitySelector value={section.visibility} onChange={handleVisibilityChange} />
          </>
        ) : null}
      </div>
    </Card>
  );
}

export default PersonalRecordsSection;
