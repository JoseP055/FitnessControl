import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import PageLoader from "./components/ui/PageLoader";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Register from "./pages/Register";
import RoutineDetail from "./pages/RoutineDetail";
import RoutineForm from "./pages/RoutineForm";
import RoutineList from "./pages/RoutineList";
import { supabaseClient } from "./services/supabaseClient";

const DEBUG_URL = "http://127.0.0.1:7777/event";
const DEBUG_SESSION_ID = "post-login-blank";

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // #region debug-point A:protected-route
    fetch(DEBUG_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION_ID,
        runId: "pre-fix",
        hypothesisId: "A",
        location: "App.js:ProtectedRoute",
        msg: "[DEBUG] ProtectedRoute state",
        data: {
          pathname: location.pathname,
          search: location.search,
          hasSession: Boolean(session),
          loading,
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [loading, location.pathname, location.search, session]);

  if (loading) {
    return <PageLoader label="Cargando sesión..." />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function PostLoginGate() {
  const { user } = useAuth();
  const [destination, setDestination] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // #region debug-point A:post-login-gate-state
    fetch(DEBUG_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION_ID,
        runId: "pre-fix",
        hypothesisId: "A",
        location: "App.js:PostLoginGate",
        msg: "[DEBUG] PostLoginGate state",
        data: {
          userId: user?.id ?? null,
          checking,
          destination,
          error,
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [checking, destination, error, user]);

  useEffect(() => {
    async function checkProfile() {
      try {
        // #region debug-point A:check-profile-start
        fetch(DEBUG_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: DEBUG_SESSION_ID,
            runId: "pre-fix",
            hypothesisId: "A",
            location: "App.js:checkProfile:start",
            msg: "[DEBUG] Starting profile check",
            data: {
              hasSupabaseClient: Boolean(supabaseClient),
              userId: user?.id ?? null,
            },
            ts: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        if (!supabaseClient) {
          setDestination("/profile-setup");
          return;
        }

        if (!user?.id) {
          setDestination("/login");
          return;
        }

        const { data, error: queryError } = await supabaseClient
          .from("profiles")
          .select("user_id, full_name, goal, experience_level")
          .eq("user_id", user.id)
          .maybeSingle();

        if (queryError) {
          throw queryError;
        }

        const completed =
          Boolean(data?.user_id) &&
          Boolean(data?.full_name) &&
          Boolean(data?.goal) &&
          Boolean(data?.experience_level);

        // #region debug-point A:check-profile-success
        fetch(DEBUG_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: DEBUG_SESSION_ID,
            runId: "pre-fix",
            hypothesisId: "A",
            location: "App.js:checkProfile:success",
            msg: "[DEBUG] Profile check resolved",
            data: {
              completed,
              hasProfile: Boolean(data?.user_id),
              fullName: data?.full_name ?? null,
              goal: data?.goal ?? null,
              experienceLevel: data?.experience_level ?? null,
            },
            ts: Date.now(),
          }),
        }).catch(() => {});
        // #endregion

        setDestination(completed ? "/dashboard" : "/profile-setup");
      } catch (gateError) {
        // #region debug-point A:check-profile-error
        fetch(DEBUG_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: DEBUG_SESSION_ID,
            runId: "pre-fix",
            hypothesisId: "A",
            location: "App.js:checkProfile:error",
            msg: "[DEBUG] Profile check failed",
            data: {
              message: gateError?.message ?? "unknown",
            },
            ts: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        setError(gateError.message || "No se pudo verificar el perfil.");
        setDestination("/profile-setup");
      } finally {
        setChecking(false);
      }
    }

    checkProfile();
  }, [user]);

  if (checking) {
    return <PageLoader label="Preparando tu cuenta..." />;
  }

  if (destination) {
    return <Navigate to={destination} replace />;
  }

  return (
    <div className="fc-page">
      <div className="fc-page__noise" />
      <div style={{ position: "relative", zIndex: 1, padding: "2rem" }}>
        <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.72)" }}>
          {error || "Redirigiendo..."}
        </p>
      </div>
    </div>
  );
}

function App() {
  const { session, loading } = useAuth();

  useEffect(() => {
    // #region debug-point E:app-state
    fetch(DEBUG_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION_ID,
        runId: "pre-fix",
        hypothesisId: "E",
        location: "App.js:App",
        msg: "[DEBUG] App render state",
        data: {
          hasSession: Boolean(session),
          loading,
        },
        ts: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [loading, session]);

  if (loading) {
    return <PageLoader label="Cargando autenticación..." />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PostLoginGate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routines"
        element={
          <ProtectedRoute>
            <RoutineList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routines/new"
        element={
          <ProtectedRoute>
            <RoutineForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routines/:routineId"
        element={
          <ProtectedRoute>
            <RoutineDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routines/:routineId/edit"
        element={
          <ProtectedRoute>
            <RoutineForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={session ? <Navigate to="/" replace /> : <Register />}
      />
      <Route
        path="*"
        element={
          <main>
            <p>Ruta no encontrada.</p>
            <Link to={session ? "/" : "/login"}>Volver</Link>
          </main>
        }
      />
    </Routes>
  );
}

export default App;
