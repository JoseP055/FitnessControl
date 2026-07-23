import { motion } from "framer-motion";
import { Activity, ArrowRight, ClipboardList, Droplet, Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageLoader from "../components/ui/PageLoader";
import RecentPRsSection from "../components/dashboard/RecentPRsSection";
import RoutineProgressSection from "../components/dashboard/RoutineProgressSection";
import TodayWorkoutSection from "../components/dashboard/TodayWorkoutSection";
import WeightTrendSection from "../components/dashboard/WeightTrendSection";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/api";
import { DEFAULT_WATER_GOAL_ML, estimateWaterGoalMl, getWaterToday } from "../services/nutritionClient";
import { supabaseClient } from "../services/supabaseClient";

function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const toIso = (value) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;

  return { start: toIso(monday), end: toIso(sunday) };
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [stats, setStats] = useState({
    weeklyDoneCount: 0,
    streak: null,
    routinePreview: null,
    measurements: [],
    prs: [],
    waterMl: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

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
            "user_id, full_name, age, gender, height_cm, weight_kg, goal, goals, experience_level"
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

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      if (!supabaseClient || !user?.id) {
        if (isMounted) {
          setLoadingStats(false);
        }
        return;
      }

      const { start, end } = getCurrentWeekRange();

      const [weeklyResult, profileSummary, measurementsResult, prsResult, waterMl] = await Promise.all([
        supabaseClient
          .from("workout_completions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "done")
          .gte("completion_date", start)
          .lte("completion_date", end),
        getProfile(user.id).catch(() => null),
        supabaseClient
          .from("body_measurements")
          .select("measurement_date, weight_kg")
          .eq("user_id", user.id)
          .order("measurement_date", { ascending: false })
          .limit(6),
        supabaseClient
          .from("personal_records")
          .select("id, exercise_name, record_type, value, unit, achieved_date")
          .eq("user_id", user.id)
          .order("achieved_date", { ascending: false })
          .limit(3),
        getWaterToday(user.id).catch(() => 0),
      ]);

      if (isMounted) {
        setStats({
          weeklyDoneCount: weeklyResult.count || 0,
          streak: profileSummary?.sections?.streak?.data || null,
          routinePreview: profileSummary?.sections?.routine_preview?.data || null,
          measurements: measurementsResult.data || [],
          prs: prsResult.data || [],
          waterMl,
        });
        setLoadingStats(false);
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [user, statsRefreshKey]);

  function refreshStats() {
    setStatsRefreshKey((current) => current + 1);
  }

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
          <div className="fc-dashboard-stack">
            <TodayWorkoutSection onCompletionChange={refreshStats} />
            <div className="fc-dashboard-grid">
            <Card glass>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <span className="fc-text-eyebrow">
                  <Activity size={14} />
                  Resumen
                </span>
                <div className="fc-metric">
                  <span className="fc-metric__value">{loadingStats ? "-" : stats.weeklyDoneCount}</span>
                  <span className="fc-metric__label">Entrenos completados esta semana</span>
                </div>
                <p className="fc-card-text">
                  {stats.routinePreview
                    ? `Rutina actual: ${stats.routinePreview.name}`
                    : "Empeza por crear una rutina y este panel va a tomar vida con tus datos."}
                </p>
                <Button onClick={() => navigate("/routines")}>
                  Ir a rutinas
                  <ArrowRight size={16} />
                </Button>
              </div>
            </Card>

            <Card glass>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <span className="fc-text-eyebrow">
                  <Flame size={14} />
                  Racha
                </span>
                <div className="fc-metric">
                  <span className="fc-metric__value">{stats.streak?.current_streak ?? 0}</span>
                  <span className="fc-metric__label">
                    {stats.streak?.routine_name ? `dias seguidos en ${stats.streak.routine_name}` : "dias seguidos"}
                  </span>
                </div>
                <p className="fc-card-text">
                  Se calcula sobre los dias programados de tu rutina actual que marcaste como hechos.
                </p>
              </div>
            </Card>

            <Card glass>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <span className="fc-text-eyebrow">
                  <Droplet size={14} />
                  Agua hoy
                </span>
                <div className="fc-metric">
                  <span className="fc-metric__value">{(stats.waterMl / 1000).toFixed(2)} L</span>
                  <span className="fc-metric__label">
                    Objetivo: {((estimateWaterGoalMl(profile?.weight_kg) || DEFAULT_WATER_GOAL_ML) / 1000).toFixed(1)} L
                  </span>
                </div>
                <Button variant="secondary" onClick={() => navigate("/nutrition")}>
                  Ir a nutricion
                  <ArrowRight size={16} />
                </Button>
              </div>
            </Card>

            <Card glass>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <span className="fc-text-eyebrow">Objetivo</span>
                <div className="fc-metric">
                  <span className="fc-metric__value">
                    {profile?.goals?.length
                      ? profile.goals.map((value) => goalLabel(value)).join(" + ")
                      : goalLabel(profile?.goal)}
                  </span>
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
            <RoutineProgressSection
              routineId={stats.routinePreview?.routine_id}
              routineName={stats.routinePreview?.name}
            />
            <WeightTrendSection measurements={stats.measurements} />
            <RecentPRsSection prs={stats.prs} />
          </div>
        ) : null}
      </motion.div>
    </AppShell>
  );
}

export default Dashboard;
