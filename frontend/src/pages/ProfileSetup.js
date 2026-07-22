import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Dumbbell, Flame, Target, Timer, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import PageLoader from "../components/ui/PageLoader";
import { useAuth } from "../context/AuthContext";
import { supabaseClient } from "../services/supabaseClient";

const stepTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } },
};

function ProfileSetup() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [goal, setGoal] = useState("");
  const [experience, setExperience] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const steps = useMemo(
    () => [
      { key: "basic", label: "Datos" },
      { key: "goal", label: "Objetivo" },
      { key: "level", label: "Nivel" },
    ],
    []
  );

  const goalOptions = useMemo(
    () => [
      { value: "perder_peso", label: "Perder peso", icon: Flame },
      { value: "ganar_musculo", label: "Ganar músculo", icon: Dumbbell },
      { value: "mantenerse", label: "Mantenerse", icon: Target },
      { value: "resistencia", label: "Resistencia", icon: Timer },
    ],
    []
  );

  const experienceOptions = useMemo(
    () => [
      { value: "principiante", label: "Principiante", icon: Zap },
      { value: "intermedio", label: "Intermedio", icon: Target },
      { value: "avanzado", label: "Avanzado", icon: Dumbbell },
    ],
    []
  );

  if (loading) {
    return <PageLoader label="Cargando perfil..." />;
  }

  if (!user) {
    return <PageLoader label="Redirigiendo..." />;
  }

  function next() {
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function back() {
    setStep((current) => Math.max(current - 1, 0));
  }

  const basicValid = fullName.trim().length >= 2;
  const goalValid = Boolean(goal);
  const levelValid = Boolean(experience);

  async function handleFinish() {
    setError("");

    if (!supabaseClient) {
      setError("El cliente de Supabase no está configurado.");
      return;
    }

    if (!basicValid || !goalValid || !levelValid) {
      setError("Completá los campos requeridos para continuar.");
      return;
    }

    setSaving(true);

    const payload = {
      user_id: user.id,
      full_name: fullName.trim(),
      age: age ? Number.parseInt(age, 10) : null,
      gender: gender ? gender.trim() : null,
      height_cm: heightCm ? Number.parseFloat(heightCm) : null,
      weight_kg: weightKg ? Number.parseFloat(weightKg) : null,
      goal,
      experience_level: experience,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error: upsertError } = await supabaseClient
        .from("profiles")
        .upsert(payload, { onConflict: "user_id" });

      if (upsertError) {
        throw upsertError;
      }

      navigate("/dashboard", { replace: true });
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fc-page">
      <div className="fc-page__noise" />
      <div style={{ position: "relative", zIndex: 1, padding: "2rem" }}>
        <div style={{ maxWidth: "980px", margin: "0 auto", display: "grid", gap: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              <span className="fc-text-eyebrow">Perfil</span>
              <h1 style={{ margin: 0, fontFamily: "var(--font-display)", letterSpacing: "-0.04em", fontSize: "clamp(1.9rem, 4vw, 2.8rem)" }}>
                Configurá tu perfil
              </h1>
              <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.68)" }}>
                Un par de datos para personalizar tu experiencia.
              </p>
            </div>

            <div style={{ display: "grid", gap: "0.5rem", minWidth: "260px" }}>
              <div className="fc-stepper">
                {steps.map((stepInfo, index) => (
                  <div
                    key={stepInfo.key}
                    className={`fc-stepper__dot ${index <= step ? "is-active" : ""}`}
                    aria-label={stepInfo.label}
                  />
                ))}
              </div>
              <div className="fc-stepper__label">
                Paso {step + 1} / {steps.length}: {steps[step].label}
              </div>
            </div>
          </div>

          <Card glass>
            <motion.div key={steps[step].key} {...stepTransition}>
              {step === 0 ? (
                <div style={{ display: "grid", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gap: "0.35rem" }}>
                    <h2 style={{ margin: 0, fontFamily: "var(--font-display)", letterSpacing: "-0.03em", fontSize: "1.5rem" }}>
                      Datos básicos
                    </h2>
                    <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.68)" }}>
                      Estos datos se usan para personalizar tus recomendaciones.
                    </p>
                  </div>

                  <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                    <Input
                      id="profile-name"
                      label="Nombre"
                      placeholder="Tu nombre"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                    />
                    <Input
                      id="profile-age"
                      label="Edad (opcional)"
                      type="number"
                      inputMode="numeric"
                      value={age}
                      onChange={(event) => setAge(event.target.value)}
                    />
                    <Input
                      id="profile-gender"
                      label="Género (opcional)"
                      placeholder="Opcional"
                      value={gender}
                      onChange={(event) => setGender(event.target.value)}
                    />
                    <Input
                      id="profile-height"
                      label="Altura (cm, opcional)"
                      type="number"
                      inputMode="decimal"
                      value={heightCm}
                      onChange={(event) => setHeightCm(event.target.value)}
                    />
                    <Input
                      id="profile-weight"
                      label="Peso actual (kg, opcional)"
                      type="number"
                      inputMode="decimal"
                      value={weightKg}
                      onChange={(event) => setWeightKg(event.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div style={{ display: "grid", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gap: "0.35rem" }}>
                    <h2 style={{ margin: 0, fontFamily: "var(--font-display)", letterSpacing: "-0.03em", fontSize: "1.5rem" }}>
                      Objetivo
                    </h2>
                    <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.68)" }}>
                      Elegí el foco principal para tu plan.
                    </p>
                  </div>

                  <div className="fc-option-grid">
                    {goalOptions.map((option) => {
                      const Icon = option.icon;
                      const selected = goal === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`fc-option-card ${selected ? "is-selected" : ""}`}
                          onClick={() => setGoal(option.value)}
                        >
                          <span className="fc-option-card__icon">
                            <Icon size={18} />
                          </span>
                          <span className="fc-option-card__label">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div style={{ display: "grid", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gap: "0.35rem" }}>
                    <h2 style={{ margin: 0, fontFamily: "var(--font-display)", letterSpacing: "-0.03em", fontSize: "1.5rem" }}>
                      Nivel de experiencia
                    </h2>
                    <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.68)" }}>
                      Esto nos ayuda a ajustar la intensidad y progresión.
                    </p>
                  </div>

                  <div className="fc-option-grid">
                    {experienceOptions.map((option) => {
                      const Icon = option.icon;
                      const selected = experience === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`fc-option-card ${selected ? "is-selected" : ""}`}
                          onClick={() => setExperience(option.value)}
                        >
                          <span className="fc-option-card__icon">
                            <Icon size={18} />
                          </span>
                          <span className="fc-option-card__label">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </Card>

          {error ? (
            <div className="fc-form-message" role="alert">
              <div className="fc-dot" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <Button variant="ghost" onClick={back} disabled={step === 0}>
              <span className="fc-button__label">
                <ArrowLeft size={16} />
                Atrás
              </span>
            </Button>

            {step < steps.length - 1 ? (
              <Button onClick={next} disabled={(step === 0 && !basicValid) || (step === 1 && !goalValid)}>
                <span className="fc-button__label">
                  Siguiente
                  <ArrowRight size={16} />
                </span>
              </Button>
            ) : (
              <Button onClick={handleFinish} loading={saving} disabled={!levelValid}>
                <span className="fc-button__label">
                  Finalizar
                  <ArrowRight size={16} />
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSetup;

