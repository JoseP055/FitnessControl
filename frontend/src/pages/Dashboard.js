import { motion } from "framer-motion";
import { Activity, ArrowRight, ClipboardList, LineChart } from "lucide-react";
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
    const validTabs = ["resumen", "rutinas", "progreso"];
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
        return "Ganar musculo";
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
              Organiza tu semana, guarda tus avances y manten todo en un solo lugar.
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
                  Empeza por crear una rutina y este panel va a tomar vida con tus datos.
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
                  Ajustamos la experiencia visual y el seguimiento en funcion de este objetivo.
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
                  Este dato nos ayuda a ordenar mejor la progresion de tus rutinas.
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
                <h2 className="fc-section-title">Tu creador de rutinas ya esta listo</h2>
                <p className="fc-card-text">
                  Entra al modulo de rutinas para crear, ordenar y editar ejercicios con una interfaz completa.
                </p>
                <Button onClick={() => navigate("/routines")}>
                  Abrir modulo
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
                  Cuando registres sesiones y medidas, este bloque va a mostrar una lectura mas util de tu evolucion.
                </p>
                <div className="fc-progress fc-progress--tall">
                  <div className="fc-progress__bar" style={{ width: "34%" }} />
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </motion.div>
    </AppShell>
  );
}

export default Dashboard;
