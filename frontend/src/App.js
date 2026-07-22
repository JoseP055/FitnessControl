import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import PageLoader from "./components/ui/PageLoader";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ProfileSetup from "./pages/ProfileSetup";
import Register from "./pages/Register";
import RoutineDetail from "./pages/RoutineDetail";
import RoutineEditForm from "./pages/RoutineEditForm";
import RoutineForm from "./pages/RoutineForm";
import RoutineList from "./pages/RoutineList";
import { supabaseClient } from "./services/supabaseClient";

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader label="Cargando sesion..." />;
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
    async function checkProfile() {
      try {
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

        setDestination(completed ? "/dashboard" : "/profile-setup");
      } catch (gateError) {
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

  if (loading) {
    return <PageLoader label="Cargando autenticacion..." />;
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
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <Profile />
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
            <RoutineEditForm />
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
