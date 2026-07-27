import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

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

function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      await requestPasswordReset(email.trim());
      setMessage("Si el email existe, te enviamos un enlace para restablecer tu contrasena.");
    } catch (resetError) {
      setError(resetError.message || "No se pudo enviar el correo de recuperacion.");
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
              <KeyRound size={14} />
              Recuperar acceso
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
                letterSpacing: "-0.04em",
              }}
            >
              Olvidaste tu contrasena?
            </h2>
            <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.66)", textAlign: "center" }}>
              Ingresa tu email y te mandamos un enlace para crear una nueva.
            </p>
          </div>

          <form className="fc-form" onSubmit={handleSubmit}>
            <div className="fc-form__row">
              <Input
                id="forgot-email"
                label="Email"
                type="email"
                placeholder="vos@ejemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <Button type="submit" loading={submitting}>
              <span className="fc-button__label">
                Enviar enlace
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
            <Link className="fc-inline-link" to="/login">
              <ArrowLeft size={14} style={{ verticalAlign: "-2px", marginRight: "0.3rem" }} />
              Volver a iniciar sesion
            </Link>
          </div>
        </Card>
      </motion.section>
    </div>
  );
}

export default ForgotPassword;
