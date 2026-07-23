import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import PageLoader from "../components/ui/PageLoader";
import { EXPERIENCE_OPTIONS, GENDER_OPTIONS, GOAL_OPTIONS } from "../constants/profileOptions";
import { useAuth } from "../context/AuthContext";
import { USERNAME_PATTERN } from "../services/socialClient";
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
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [goals, setGoals] = useState([]);
  const [experience, setExperience] = useState("principiante");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const steps = useMemo(
    () => [
      { key: "basic", label: "Datos" },
      { key: "goal", label: "Objetivo" },
      { key: "level", label: "Nivel" },
    ],
    []
  );

  const goalOptions = GOAL_OPTIONS;
  const experienceOptions = EXPERIENCE_OPTIONS;
  const genderOptions = GENDER_OPTIONS;

  useEffect(() => {
    let isMounted = true;

    async function loadExistingProfile() {
      if (!supabaseClient || !user?.id) {
        if (isMounted) {
          setLoadingExisting(false);
        }
        return;
      }

      try {
        const { data, error: queryError } = await supabaseClient
          .from("profiles")
          .select(
            "user_id, full_name, username, age, gender, height_cm, weight_kg, goal, goals, experience_level"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (queryError) {
          throw queryError;
        }

        if (isMounted && data?.user_id) {
          setIsEditing(true);
          setFullName(data.full_name || "");
          setUsername(data.username || "");
          setAge(data.age ? String(data.age) : "");
          setGender(data.gender || "");
          setHeightCm(data.height_cm ? String(data.height_cm) : "");
          setWeightKg(data.weight_kg ? String(data.weight_kg) : "");
          setGoals(data.goals?.length ? data.goals : data.goal ? [data.goal] : []);
          setExperience(data.experience_level || "principiante");
        }
      } finally {
        if (isMounted) {
          setLoadingExisting(false);
        }
      }
    }

    loadExistingProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading) {
    return <PageLoader label="Cargando perfil..." />;
  }

  if (!user) {
    return <PageLoader label="Redirigiendo..." />;
  }

  if (loadingExisting) {
    return <PageLoader label="Cargando perfil..." />;
  }

  function scrollToTop() {
    // En iOS Safari, si habia un input enfocado el teclado se cierra recien
    // despues de este tick y su animacion pisa el scroll inmediato, dejandolo
    // sin efecto visible. Se saca el foco y se espera un instante antes de
    // scrollear para que nuestro scroll sea lo ultimo que se aplique.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, 120);
  }

  function next() {
    setStep((current) => Math.min(current + 1, steps.length - 1));
    scrollToTop();
  }

  function back() {
    setStep((current) => Math.max(current - 1, 0));
    scrollToTop();
  }

  function toggleGoal(value) {
    setGoals((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  const usernameValid = !username.trim() || USERNAME_PATTERN.test(username.trim().toLowerCase());
  const basicValid = fullName.trim().length >= 2 && age.trim() !== "" && Boolean(gender) && usernameValid;
  const levelValid = Boolean(experience);

  async function handleFinish() {
    setError("");

    if (!supabaseClient) {
      setError("El cliente de Supabase no esta configurado.");
      return;
    }

    if (!basicValid || !levelValid) {
      setError("Completa los campos requeridos para continuar.");
      return;
    }

    setSaving(true);

    const payload = {
      user_id: user.id,
      full_name: fullName.trim(),
      username: username.trim() ? username.trim().toLowerCase() : null,
      age: Number.parseInt(age, 10),
      gender,
      height_cm: heightCm ? Number.parseFloat(heightCm) : null,
      weight_kg: weightKg ? Number.parseFloat(weightKg) : null,
      goal: goals[0] || null,
      goals: goals.length ? goals : null,
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

      navigate("/dashboard?tab=perfil", { replace: true });
    } catch (saveError) {
      if (saveError.code === "23505") {
        setError("Ese nombre de usuario ya esta en uso.");
      } else {
        setError(saveError.message || "No se pudo guardar el perfil.");
      }
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
                {isEditing ? "Editar perfil" : "Configura tu perfil"}
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
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  <div style={{ display: "grid", gap: "0.35rem" }}>
                    <h2 style={{ margin: 0, fontFamily: "var(--font-display)", letterSpacing: "-0.03em", fontSize: "1.5rem" }}>
                      Datos basicos
                    </h2>
                    <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.68)" }}>
                      Nombre, usuario, edad y genero son obligatorios. El resto lo podes completar ahora o mas adelante desde tu perfil.
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
                      id="profile-username"
                      label="Usuario"
                      placeholder="tu_usuario"
                      helperText="Minusculas, numeros y guion bajo. Sirve para que tus amigos te encuentren."
                      value={username}
                      onChange={(event) => setUsername(event.target.value.toLowerCase())}
                    />
                    {username.trim() && !usernameValid ? (
                      <p className="fc-form-message" style={{ gridColumn: "1 / -1", margin: 0 }}>
                        El usuario debe tener 3-24 caracteres: minusculas, numeros y guion bajo.
                      </p>
                    ) : null}
                    <Input
                      id="profile-age"
                      label="Edad"
                      type="number"
                      inputMode="numeric"
                      value={age}
                      onChange={(event) => setAge(event.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gap: "0.5rem" }}>
                    <span className="fc-field__label">Genero</span>
                    <div className="fc-option-grid fc-option-grid--compact">
                      {genderOptions.map((option) => {
                        const Icon = option.icon;
                        const selected = gender === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`fc-option-card ${selected ? "is-selected" : ""}`}
                            onClick={() => setGender(option.value)}
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

                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <span className="fc-text-eyebrow">Opcional, editable mas adelante</span>
                    <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                      <Input
                        id="profile-height"
                        label="Altura (cm)"
                        type="number"
                        inputMode="decimal"
                        value={heightCm}
                        onChange={(event) => setHeightCm(event.target.value)}
                      />
                      <Input
                        id="profile-weight"
                        label="Peso actual (kg)"
                        type="number"
                        inputMode="decimal"
                        value={weightKg}
                        onChange={(event) => setWeightKg(event.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div style={{ display: "grid", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gap: "0.35rem" }}>
                    <h2 style={{ margin: 0, fontFamily: "var(--font-display)", letterSpacing: "-0.03em", fontSize: "1.5rem" }}>
                      Objetivo (opcional)
                    </h2>
                    <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.68)" }}>
                      Podes elegir uno, varios, o ninguno por ahora.
                    </p>
                  </div>

                  <div className="fc-option-grid">
                    {goalOptions.map((option) => {
                      const Icon = option.icon;
                      const selected = goals.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`fc-option-card ${selected ? "is-selected" : ""}`}
                          onClick={() => toggleGoal(option.value)}
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
                      Esto nos ayuda a ajustar la intensidad y progresion.
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
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Button variant="ghost" onClick={back} disabled={step === 0}>
                <span className="fc-button__label">
                  <ArrowLeft size={16} />
                  Atras
                </span>
              </Button>

              {isEditing ? (
                <Button variant="secondary" onClick={() => navigate("/dashboard?tab=perfil", { replace: true })}>
                  Volver sin guardar
                </Button>
              ) : null}
            </div>
            {step < steps.length - 1 ? (
              <Button onClick={next} disabled={step === 0 && !basicValid}>
                <span className="fc-button__label">
                  Siguiente
                  <ArrowRight size={16} />
                </span>
              </Button>
            ) : (
              <Button onClick={handleFinish} loading={saving} disabled={!levelValid}>
                <span className="fc-button__label">
                  {isEditing ? "Guardar cambios" : "Finalizar"}
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
