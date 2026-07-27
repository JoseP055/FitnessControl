import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MailCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";

const panelTransition = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function passwordChecks(value) {
  const trimmed = value || "";
  return {
    length: trimmed.length >= 8,
    letter: /[a-zA-Z]/.test(trimmed),
    number: /[0-9]/.test(trimmed),
  };
}

function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailValid = email ? isValidEmail(email) : false;
  const checks = passwordChecks(password);
  const passwordValid = checks.length && checks.letter && checks.number;

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

      setMessage("Te enviamos un correo para confirmar tu cuenta.");
    } catch (signUpError) {
      setError(signUpError.message || "No se pudo registrar el usuario.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fc-page fc-auth-page--single">
      <div className="fc-page__noise" />
      <span className="fc-hero-orb fc-hero-orb--primary" />
      <span className="fc-hero-orb fc-hero-orb--accent" />

      <motion.section
        className="fc-auth-panel"
        variants={panelTransition}
        initial="hidden"
        animate="visible"
      >
        <Card className="fc-auth-card" glass>
          <div style={{ display: "grid", justifyItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <Link to="/" className="fc-auth-logo">
              <img src={logo} alt="FitnessControl" />
            </Link>
            <span className="fc-text-eyebrow">
              <MailCheck size={14} />
              Crear cuenta
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                letterSpacing: "-0.04em",
              }}
            >
              Registrate
            </h2>
            <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.66)", textAlign: "center" }}>
              Completa los datos para crear tu cuenta.
            </p>
          </div>

          <form className="fc-form" onSubmit={handleSubmit}>
            <div className="fc-form__row">
              <Input
                id="register-email"
                label="Email"
                type="email"
                placeholder="vos@ejemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
              <div className="fc-validation">
                <span
                  className={`fc-validation__item ${
                    email ? (emailValid ? "is-valid" : "is-invalid") : ""
                  }`}
                >
                  Email valido
                </span>
              </div>

              <Input
                id="register-password"
                label="Password"
                type="password"
                placeholder="Minimo 8 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
              />

              <div className="fc-validation">
                <span
                  className={`fc-validation__item ${
                    password ? (checks.length ? "is-valid" : "is-invalid") : ""
                  }`}
                >
                  8+ caracteres
                </span>
                <span
                  className={`fc-validation__item ${
                    password ? (checks.letter ? "is-valid" : "is-invalid") : ""
                  }`}
                >
                  Al menos una letra
                </span>
                <span
                  className={`fc-validation__item ${
                    password ? (checks.number ? "is-valid" : "is-invalid") : ""
                  }`}
                >
                  Al menos un numero
                </span>
              </div>
            </div>

            <Button type="submit" loading={submitting} disabled={!emailValid || !passwordValid}>
              <span className="fc-button__label">
                Crear cuenta
                <ArrowRight size={16} />
              </span>
            </Button>
          </form>

          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: message || error ? 1 : 0,
              height: message || error ? "auto" : 0,
              marginTop: message || error ? "1rem" : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            {message ? <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.75)" }}>{message}</p> : null}
            {error ? (
              <div className="fc-form-message" role="alert" style={{ marginTop: message ? "0.75rem" : 0 }}>
                <div className="fc-dot" aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : null}
          </motion.div>

          <div style={{ marginTop: "1.5rem" }} className="fc-login-footer">
            <span>Ya tenes cuenta?</span>
            <Link className="fc-inline-link" to="/login">
              Iniciar sesion
            </Link>
          </div>
        </Card>
      </motion.section>
    </div>
  );
}

export default Register;
