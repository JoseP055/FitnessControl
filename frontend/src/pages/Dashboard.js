import { motion } from "framer-motion";
import {
  Activity,
  ClipboardList,
  LayoutGrid,
  LineChart,
  LogOut,
  User2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageLoader from "../components/ui/PageLoader";
import { useAuth } from "../context/AuthContext";
import { supabaseClient } from "../services/supabaseClient";

function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const tab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "resumen";
  }, [location.search]);

  const tabs = useMemo(
    () => [
      { value: "resumen", label: "Resumen", icon: LayoutGrid },
      { value: "rutinas", label: "Rutinas", icon: ClipboardList },
      { value: "progreso", label: "Progreso", icon: LineChart },
      { value: "perfil", label: "Perfil", icon: User2 },
    ],
    []
  );

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

  const activeTab = tabs.find((item) => item.value === tab) ? tab : "resumen";

  return (
    <div className="fc-page">
      <div className="fc-page__noise" />
      <div className="fc-dashboard">
        <aside className="fc-dashboard__sidebar">
          <div className="fc-dashboard__brand">
            <div className="fc-dashboard__logo">FC</div>
            <div>
              <div className="fc-dashboard__brand-title">FitnessControl</div>
              <div className="fc-dashboard__brand-subtitle">Tu espacio fitness</div>
            </div>
          </div>

          <nav className="fc-dashboard__nav" aria-label="Secciones">
            {tabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  className={`fc-nav-item ${isActive ? "is-active" : ""}`}
                  onClick={() => setTab(item.value)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="fc-dashboard__sidebar-footer">
            <button type="button" className="fc-nav-item" onClick={signOut}>
              <LogOut size={18} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        <main className="fc-dashboard__main">
          <header className="fc-dashboard__header">
            <div className="fc-dashboard__header-left">
              <div className="fc-avatar" aria-hidden="true">
                <span>{initials || "FC"}</span>
              </div>
              <div style={{ display: "grid", gap: "0.25rem" }}>
                <h1 className="fc-dashboard__title">Hola, {displayName}.</h1>
                <p className="fc-dashboard__subtitle">
                  Elegí un módulo para empezar. Todo lo que hagas acá queda guardado.
                </p>
              </div>
            </div>

            <Button variant="secondary" onClick={signOut}>
              <span className="fc-button__label">
                <LogOut size={16} />
                Salir
              </span>
            </Button>
          </header>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fc-dashboard__content"
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
                      Tu resumen se va a llenar a medida que registres rutinas y sesiones.
                    </p>
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
                      Ajustaremos recomendaciones y métricas según este objetivo.
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
                      Esto influye en la progresión y la intensidad sugerida.
                    </p>
                  </div>
                </Card>
              </div>
            ) : null}

            {activeTab === "rutinas" ? (
              <div className="fc-dashboard-grid">
                <Card glass>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <span className="fc-text-eyebrow">Rutinas</span>
                    <h2 className="fc-section-title">Tu biblioteca de rutinas</h2>
                    <p className="fc-card-text">
                      Todavía no tenés rutinas creadas. Cuando estés listo, armamos el CRUD.
                    </p>
                    <Button onClick={() => setTab("rutinas")}>Crear primera rutina</Button>
                  </div>
                </Card>
              </div>
            ) : null}

            {activeTab === "progreso" ? (
              <div className="fc-dashboard-grid">
                <Card glass>
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <span className="fc-text-eyebrow">Progreso</span>
                    <h2 className="fc-section-title">Tu avance</h2>
                    <p className="fc-card-text">
                      Cuando registres sesiones y medidas vas a ver gráficos acá.
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
                    <Button variant="secondary" onClick={() => navigate("/profile-setup")}>
                      Editar perfil
                    </Button>
                  </div>
                </Card>
              </div>
            ) : null}
          </motion.div>

          <nav className="fc-dashboard__mobile-nav" aria-label="Secciones">
            {tabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  className={`fc-mobile-nav-item ${isActive ? "is-active" : ""}`}
                  onClick={() => setTab(item.value)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
