import { useEffect, useState } from "react";

import { healthCheck } from "./services/api";
import { supabaseClient } from "./services/supabaseClient";

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHealth() {
      try {
        const data = await healthCheck();
        setHealth(data);
      } catch (requestError) {
        setError(requestError.message);
      }
    }

    loadHealth();
  }, []);

  return (
    <main>
      <h1>FitnessControl</h1>
      <p>Entorno local listo para validar frontend, backend y Supabase.</p>
      <p>
        Cliente Supabase en frontend: {supabaseClient ? "configurado" : "pendiente"}
      </p>
      {health ? (
        <pre>{JSON.stringify(health, null, 2)}</pre>
      ) : (
        <p>Consultando `GET /health`...</p>
      )}
      {error ? <p>Error: {error}</p> : null}
    </main>
  );
}

export default App;
