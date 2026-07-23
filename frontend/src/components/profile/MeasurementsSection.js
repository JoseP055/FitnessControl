import { useState } from "react";
import { Plus, Ruler } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import SectionLocked from "./SectionLocked";
import VisibilitySelector from "./VisibilitySelector";
import { updateVisibility, upsertMeasurement } from "../../services/socialClient";

const FIELDS = [
  { key: "weight_kg", label: "Peso (kg)" },
  { key: "body_fat_percent", label: "% grasa corporal" },
  { key: "chest_cm", label: "Pecho (cm)" },
  { key: "waist_cm", label: "Cintura (cm)" },
  { key: "hips_cm", label: "Cadera (cm)" },
  { key: "arms_cm", label: "Brazos (cm)" },
  { key: "thighs_cm", label: "Piernas (cm)" },
];

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function MeasurementsSection({ userId, isSelf, section, onRefresh }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!isSelf && !section.visible) {
    return <SectionLocked label="Las medidas de este usuario no son visibles para vos." />;
  }

  async function handleSave() {
    setError("");

    const payload = { measurement_date: todayIso() };
    let hasValue = false;

    for (const field of FIELDS) {
      const raw = form[field.key];
      if (raw !== undefined && raw !== "") {
        payload[field.key] = Number.parseFloat(raw);
        hasValue = true;
      }
    }

    if (!hasValue) {
      setError("Ingresa al menos un valor.");
      return;
    }

    setSaving(true);

    try {
      await upsertMeasurement(userId, payload);
      setForm({});
      await onRefresh();
    } catch (saveError) {
      setError(saveError.message || "No se pudo registrar la medida.");
    } finally {
      setSaving(false);
    }
  }

  async function handleVisibilityChange(value) {
    try {
      await updateVisibility(userId, "measurements_visibility", value);
      await onRefresh();
    } catch (visibilityError) {
      setError(visibilityError.message || "No se pudo actualizar la visibilidad.");
    }
  }

  const latest = section.data;

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <span className="fc-text-eyebrow">
          <Ruler size={14} />
          Medidas corporales
        </span>

        {latest ? (
          <div className="fc-kv-grid">
            {FIELDS.map((field) => (
              <div className="fc-kv" key={field.key}>
                <span className="fc-kv__label">{field.label}</span>
                <span className="fc-kv__value">
                  {latest[field.key] !== null && latest[field.key] !== undefined ? latest[field.key] : "-"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="fc-card-text">Todavia no hay medidas registradas.</p>
        )}

        {isSelf ? (
          <>
            <div className="fc-add-panel">
              <p className="fc-add-panel__title">
                <Plus size={15} />
                Registrar nueva medida
              </p>
              <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                {FIELDS.map((field) => (
                  <Input
                    key={field.key}
                    id={`measurement-${field.key}`}
                    label={field.label}
                    type="number"
                    inputMode="decimal"
                    value={form[field.key] || ""}
                    onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  />
                ))}
              </div>
              {error ? <p className="fc-form-message">{error}</p> : null}
              <Button loading={saving} onClick={handleSave}>
                Registrar medida de hoy
              </Button>
            </div>
            <VisibilitySelector value={section.visibility} onChange={handleVisibilityChange} />
          </>
        ) : null}
      </div>
    </Card>
  );
}

export default MeasurementsSection;
