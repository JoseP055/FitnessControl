import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const { session } = await signUp(email, password);

      if (session) {
        navigate("/", { replace: true });
        return;
      }

      setMessage("Registro exitoso. Revisa tu email para confirmar la cuenta.");
    } catch (signUpError) {
      setError(signUpError.message || "No se pudo registrar el usuario.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Crear cuenta</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Creando cuenta..." : "Registrarme"}
        </button>
      </form>

      {message ? <p>{message}</p> : null}
      {error ? <p>Error: {error}</p> : null}

      <p>
        ¿Ya tenes cuenta? <Link to="/login">Inicia sesion</Link>
      </p>
    </main>
  );
}

export default Register;
