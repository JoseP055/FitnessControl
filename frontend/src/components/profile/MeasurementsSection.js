import { useEffect, useState } from "react";
import { Calculator, Plus, Ruler, Target } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import SectionLocked from "./SectionLocked";
import VisibilitySelector from "./VisibilitySelector";
import { updateVisibility, updateWeightGoal, upsertMeasurement } from "../../services/socialClient";
import { supabaseClient } from "../../services/supabaseClient";
import { estimateBodyFatPercent } from "../../utils/bodyComposition";

const FIELDS = [
  { key: "height_cm", label: "Altura (cm)" },
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

function MeasurementsSection({ userId, isSelf, section, weightGoalKg, onRefresh }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ageGender, setAgeGender] = useState({ age: null, gender: null });
  const [measurementDate, setMeasurementDate] = useState(todayIso());
  const [goalInput, setGoalInput] = useState(weightGoalKg ?? "");
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalError, setGoalError] = useState("");

  useEffect(() => {
    setGoalInput(weightGoalKg ?? "");
  }, [weightGoalKg]);

  useEffect(() => {
    if (!isSelf || !supabaseClient) {
      return;
    }

    supabaseClient
      .from("profiles")
      .select("age, gender")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAgeGender({ age: data.age, gender: data.gender });
        }
      });
  }, [isSelf, userId]);

  if (!isSelf && !section.visible) {
    return <SectionLocked label="El usuario tiene las medidas ocultas." />;
  }

  const latest = section.data;

  function handleField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleEstimateBodyFat() {
    setError("");

    const weightKg = Number.parseFloat(form.weight_kg || latest?.weight_kg);
    const heightCm = Number.parseFloat(form.height_cm || latest?.height_cm);
    const estimate = estimateBodyFatPercent({
      weight_kg: weightKg,
      height_cm: heightCm,
      age: ageGender.age,
      gender: ageGender.gender,
    });

    if (estimate === null) {
      setError("Para calcular necesito tu altura, peso, edad y genero (completa tu perfil si falta alguno).");
      return;
    }

    handleField("body_fat_percent", String(estimate));
  }

  async function handleSave() {
    setError("");

    if (!measurementDate) {
      setError("Elegi una fecha para la medida.");
      return;
    }

    if (measurementDate > todayIso()) {
      setError("No podes registrar una medida en una fecha futura.");
      return;
    }

    const payload = { measurement_date: measurementDate };
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
      setMeasurementDate(todayIso());
      await onRefresh();
    } catch (saveError) {
      setError(saveError.message || "No se pudo registrar la medida.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveGoal() {
    setGoalError("");

    const parsed = goalInput === "" ? null : Number.parseFloat(goalInput);
    if (goalInput !== "" && (Number.isNaN(parsed) || parsed <= 0)) {
      setGoalError("Ingresa un peso valido para tu meta.");
      return;
    }

    setSavingGoal(true);

    try {
      await updateWeightGoal(userId, parsed);
      await onRefresh();
    } catch (saveError) {
      setGoalError(saveError.message || "No se pudo guardar la meta de peso.");
    } finally {
      setSavingGoal(false);
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
                <Target size={15} />
                Meta de peso
              </p>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 160px" }}>
                  <Input
                    id="weight-goal-input"
                    label="Peso objetivo (kg)"
                    type="number"
                    inputMode="decimal"
                    value={goalInput}
                    onChange={(event) => setGoalInput(event.target.value)}
                  />
                </div>
                <Button loading={savingGoal} onClick={handleSaveGoal}>
                  Guardar meta
                </Button>
              </div>
              {goalError ? <p className="fc-form-message">{goalError}</p> : null}
            </div>

            <div className="fc-add-panel">
              <p className="fc-add-panel__title">
                <Plus size={15} />
                Registrar nueva medida
              </p>
              <div style={{ maxWidth: "200px" }}>
                <Input
                  id="measurement-date"
                  label="Fecha"
                  type="date"
                  max={todayIso()}
                  value={measurementDate}
                  onChange={(event) => setMeasurementDate(event.target.value)}
                />
              </div>
              <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                {FIELDS.map((field) =>
                  field.key === "body_fat_percent" ? (
                    <div key={field.key} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 140px" }}>
                        <Input
                          id={`measurement-${field.key}`}
                          label={field.label}
                          type="number"
                          inputMode="decimal"
                          value={form[field.key] || ""}
                          onChange={(event) => handleField(field.key, event.target.value)}
                        />
                      </div>
                      <Button variant="secondary" onClick={handleEstimateBodyFat}>
                        <Calculator size={14} />
                        Calcular aprox
                      </Button>
                    </div>
                  ) : (
                    <Input
                      key={field.key}
                      id={`measurement-${field.key}`}
                      label={field.label}
                      type="number"
                      inputMode="decimal"
                      value={form[field.key] || ""}
                      onChange={(event) => handleField(field.key, event.target.value)}
                    />
                  )
                )}
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
