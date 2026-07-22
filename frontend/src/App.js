import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { getCurrentUserProfile, healthCheck } from "./services/api";
import { supabaseClient } from "./services/supabaseClient";

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Cargando sesion...</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function Dashboard() {
  const { user, signOut } = useAuth();
  const [health, setHealth] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [healthData, profileData] = await Promise.all([
          healthCheck(),
          getCurrentUserProfile(),
        ]);
        setHealth(healthData);
        setProfile(profileData);
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    loadData();
  }, []);

  return (
    <main>
      <h1>FitnessControl</h1>
      <p>Sesion iniciada con: {user?.email || "sin email"}</p>
      <p>
        Cliente Supabase en frontend: {supabaseClient ? "configurado" : "pendiente"}
      </p>

      <button type="button" onClick={signOut}>
        Cerrar sesion
      </button>

      {health ? (
        <pre>{JSON.stringify(health, null, 2)}</pre>
      ) : (
        <p>Consultando `GET /health`...</p>
      )}

      {profile ? (
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      ) : (
        <p>Consultando `GET /me`...</p>
      )}

      {error ? <p>Error: {error}</p> : null}
    </main>
  );
}

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return <p>Cargando autenticacion....</p>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
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
