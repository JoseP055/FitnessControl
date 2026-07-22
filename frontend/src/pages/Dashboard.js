import { motion } from "framer-motion";
import { Activity, ArrowRight, ClipboardList, LineChart, User2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageLoader from "../components/ui/PageLoader";
import { useAuth } from "../context/AuthContext";
import { supabaseClient } from "../services/supabaseClient";

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [weightKg, setWeightKg] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);
  const [weightMessage, setWeightMessage] = useState("");

  const tab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "resumen";
  }, [location.search]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!supabaseClient || !user?.id) {
        if (isMounted) {
          setLoadingProfile(false);
        }
        return;
      }

      try {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select(
            "user_id, full_name, age, gender, height_cm, weight_kg, goal, experience_level"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (isMounted) {
          setProfile(data);
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const activeTab = useMemo(() => {
    const validTabs = ["resumen", "rutinas", "progreso", "perfil"];
    return validTabs.includes(tab) ? tab : "resumen";
  }, [tab]);

  if (loadingProfile) {
    return <PageLoader label="Cargando dashboard..." />;
  }

  const displayName = profile?.full_name?.trim() || "Atleta";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  function setTab(nextTab) {
    navigate(`/dashboard?tab=${nextTab}`, { replace: true });
  }

  function goalLabel(value) {
    switch (value) {
      case "perder_peso":
        return "Perder peso";
      case "ganar_musculo":
        return "Ganar músculo";
      case "mantenerse":
        return "Mantenerse";
      case "resistencia":
        return "Resistencia";
      default:
        return "Sin definir";
    }
  }

  function levelLabel(value) {
    switch (value) {
      case "principiante":
        return "Principiante";
      case "intermedio":
        return "Intermedio";
      case "avanzado":
        return "Avanzado";
      default:
        return "Sin definir";
    }
  }

  async function saveWeight() {
    setWeightMessage("");

    if (!supabaseClient || !user?.id) {
      setWeightMessage("No se pudo registrar el peso.");
      return;
    }

    const parsed = Number.parseFloat(weightKg);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setWeightMessage("Ingresá un peso válido.");
      return;
    }

    setSavingWeight(true);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const measurementDate = `${yyyy}-${mm}-${dd}`;

    try {
      const payload = {
        user_id: user.id,
        measurement_date: measurementDate,
        weight_kg: parsed,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseClient
        .from("body_measurements")
        .upsert(payload, { onConflict: "user_id,measurement_date" });

      if (error) {
        throw error;
      }

      const { data: updatedProfile, error: profileError } = await supabaseClient
        .from("profiles")
        .update({ weight_kg: parsed, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .select("weight_kg")
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!updatedProfile) {
        throw new Error("Primero completá tu perfil para poder registrar tu peso.");
      }

      setProfile((current) => ({
        ...(current || {}),
        weight_kg: updatedProfile.weight_kg,
      }));

      setWeightMessage("Peso registrado.");
      setWeightKg("");
    } catch (saveError) {
      setWeightMessage(saveError.message || "No se pudo registrar el peso.");
    } finally {
      setSavingWeight(false);
    }
  }

  return (
    <AppShell
      activeSection={activeTab}
      header={
        <div className="fc-dashboard__header-left">
          <div className="fc-avatar" aria-hidden="true">
            <span>{initials || "FC"}</span>
          </div>
          <div style={{ display: "grid", gap: "0.25rem" }}>
            <h1 className="fc-dashboard__title">Hola, {displayName}.</h1>
            <p className="fc-dashboard__subtitle">
              Organizá tu semana, guardá tus avances y mantené todo en un solo lugar.
            </p>
          </div>
        </div>
      }
    >
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="fc-dashboard-stack"
      >
        {activeTab === "resumen" ? (
          <div className="fc-dashboard-grid">
            <Card glass>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <span className="fc-text-eyebrow">
                  <Activity size={14} />
                  Resumen
                </span>
                <div className="fc-metric">
                  <span className="fc-metric__value">0</span>
                  <span className="fc-metric__label">Entrenos esta semana</span>
                </div>
                <div className="fc-progress">
                  <div className="fc-progress__bar" style={{ width: "12%" }} />
                </div>
                <p className="fc-card-text">
                  Empezá por crear una rutina y este panel va a tomar vida con tus datos.
                </p>
                <Button onClick={() => navigate("/routines")}>
                  Ir a rutinas
                  <ArrowRight size={16} />
                </Button>
              </div>
            </Card>

            <Card glass>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <span className="fc-text-eyebrow">Objetivo</span>
                <div className="fc-metric">
                  <span className="fc-metric__value">{goalLabel(profile?.goal)}</span>
                  <span className="fc-metric__label">Foco actual</span>
                </div>
                <p className="fc-card-text">
                  Ajustamos la experiencia visual y el seguimiento en función de este objetivo.
                </p>
              </div>
            </Card>

            <Card glass>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <span className="fc-text-eyebrow">Nivel</span>
                <div className="fc-metric">
                  <span className="fc-metric__value">
                    {levelLabel(profile?.experience_level)}
                  </span>
                  <span className="fc-metric__label">Experiencia</span>
                </div>
                <p className="fc-card-text">
                  Este dato nos ayuda a ordenar mejor la progresión de tus rutinas.
                </p>
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === "rutinas" ? (
          <div className="fc-dashboard-grid">
            <Card glass>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <span className="fc-text-eyebrow">
                  <ClipboardList size={14} />
                  Rutinas
                </span>
                <h2 className="fc-section-title">Tu creador de rutinas ya está listo</h2>
                <p className="fc-card-text">
                  Entrá al módulo de rutinas para crear, ordenar y editar ejercicios con una interfaz completa.
                </p>
                <Button onClick={() => navigate("/routines")}>
                  Abrir módulo
                  <ArrowRight size={16} />
                </Button>
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === "progreso" ? (
          <div className="fc-dashboard-grid">
            <Card glass>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <span className="fc-text-eyebrow">
                  <LineChart size={14} />
                  Progreso
                </span>
                <h2 className="fc-section-title">Tu avance</h2>
                <p className="fc-card-text">
                  Cuando registres sesiones y medidas, este bloque va a mostrar una lectura más útil de tu evolución.
                </p>
                <div className="fc-progress fc-progress--tall">
                  <div className="fc-progress__bar" style={{ width: "34%" }} />
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === "perfil" ? (
          <div className="fc-dashboard-grid">
            <Card glass>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <span className="fc-text-eyebrow">
                  <User2 size={14} />
                  Perfil
                </span>
                <h2 className="fc-section-title">{displayName}</h2>
                <div className="fc-kv-grid">
                  <div className="fc-kv">
                    <span className="fc-kv__label">Objetivo</span>
                    <span className="fc-kv__value">{goalLabel(profile?.goal)}</span>
                  </div>
                  <div className="fc-kv">
                    <span className="fc-kv__label">Nivel</span>
                    <span className="fc-kv__value">
                      {levelLabel(profile?.experience_level)}
                    </span>
                  </div>
                  <div className="fc-kv">
                    <span className="fc-kv__label">Altura</span>
                    <span className="fc-kv__value">
                      {profile?.height_cm ? `${profile.height_cm} cm` : "—"}
                    </span>
                  </div>
                  <div className="fc-kv">
                    <span className="fc-kv__label">Peso</span>
                    <span className="fc-kv__value">
                      {profile?.weight_kg ? `${profile.weight_kg} kg` : "—"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-display)",
                      letterSpacing: "-0.03em",
                      fontSize: "1.15rem",
                    }}
                  >
                    Registrar nuevo peso
                  </h3>
                  <div className="fc-inline-form">
                    <input
                      className="fc-input"
                      inputMode="decimal"
                      placeholder="Peso (kg)"
                      value={weightKg}
                      onChange={(event) => setWeightKg(event.target.value)}
                    />
                    <Button loading={savingWeight} onClick={saveWeight}>
                      Guardar
                    </Button>
                  </div>
                  {weightMessage ? (
                    <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.72)" }}>
                      {weightMessage}
                    </p>
                  ) : null}
                </div>
                <Button variant="secondary" onClick={() => navigate("/profile-setup")}>
                  Editar perfil
                </Button>
              </div>
            </Card>
          </div>
        ) : null}
      </motion.div>
    </AppShell>
  );
}

export default Dashboard;
