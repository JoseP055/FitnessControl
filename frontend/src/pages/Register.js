import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MailCheck, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

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

const heroTransition = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
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
    <div className="fc-page">
      <div className="fc-page__noise" />
      <div className="fc-auth-layout">
        <motion.section
          className="fc-auth-hero"
          variants={heroTransition}
          initial="hidden"
          animate="visible"
        >
          <div style={{ position: "relative" }}>
            <span className="fc-hero-orb fc-hero-orb--primary" />
            <span className="fc-hero-orb fc-hero-orb--accent" />

            <span className="fc-text-eyebrow">
              <Sparkles size={14} />
              FitnessControl
            </span>
            <div style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
              <h1 className="fc-heading">Creá tu cuenta.</h1>
              <p className="fc-subheading">
                Registrate para empezar a guardar tus rutinas y seguir tu progreso.
              </p>
            </div>
          </div>

          <div className="fc-abstract-visual" aria-hidden="true">
            <div className="fc-abstract-grid" />
            <motion.div
              style={{
                position: "absolute",
                top: "16%",
                left: "14%",
                width: "44%",
                height: "16%",
                borderRadius: "18px",
                border: "1px solid rgba(174, 147, 217, 0.16)",
                background:
                  "linear-gradient(135deg, rgba(145, 106, 140, 0.32), rgba(172, 79, 116, 0.2))",
                backdropFilter: "blur(12px)",
              }}
              animate={{ y: [0, -10, 0], rotate: [0, -1.5, 0] }}
              transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              style={{
                position: "absolute",
                right: "12%",
                top: "20%",
                width: "26%",
                height: "44%",
                borderRadius: "24px",
                border: "1px solid rgba(174, 147, 217, 0.18)",
                background: "rgba(23, 18, 28, 0.75)",
                boxShadow: "0 18px 40px rgba(10, 8, 14, 0.22)",
              }}
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              style={{
                position: "absolute",
                left: "18%",
                bottom: "18%",
                width: "60%",
                height: "12px",
                borderRadius: "999px",
                background:
                  "linear-gradient(90deg, rgba(172, 79, 116, 0.74), rgba(145, 106, 140, 0.52))",
              }}
              animate={{ scaleX: [0.7, 1, 0.84], opacity: [0.48, 0.9, 0.62] }}
              transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="fc-auth-quote">
            <strong>Un onboarding simple.</strong>
            <p style={{ margin: 0 }}>
              Creá tu cuenta ahora y en el siguiente paso terminás de configurar tu
              perfil.
            </p>
          </div>
        </motion.section>

        <motion.section
          className="fc-auth-panel"
          variants={panelTransition}
          initial="hidden"
          animate="visible"
        >
          <Card className="fc-auth-card" glass>
            <div style={{ display: "grid", gap: "1rem", marginBottom: "1.75rem" }}>
              <span className="fc-text-eyebrow">
                <MailCheck size={14} />
                Crear cuenta
              </span>
              <div style={{ display: "grid", gap: "0.65rem" }}>
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
                <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.66)" }}>
                  Completá los datos para crear tu cuenta.
                </p>
              </div>
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
                    Email válido
                  </span>
                </div>

                <Input
                  id="register-password"
                  label="Password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
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
                    Al menos un número
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
              <span>¿Ya tenés cuenta?</span>
              <Link className="fc-inline-link" to="/login">
                Iniciar sesión
              </Link>
            </div>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}

export default Register;
