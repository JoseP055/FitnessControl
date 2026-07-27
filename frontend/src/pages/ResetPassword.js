import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import PageLoader from "../components/ui/PageLoader";
import { useAuth } from "../context/AuthContext";

const panelTransition = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

function passwordChecks(value) {
  const trimmed = value || "";
  return {
    length: trimmed.length >= 8,
    letter: /[a-zA-Z]/.test(trimmed),
    number: /[0-9]/.test(trimmed),
  };
}

function ResetPassword() {
  const navigate = useNavigate();
  const { session, loading, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const checks = passwordChecks(password);
  const passwordValid = checks.length && checks.letter && checks.number;
  const matches = password && password === confirmPassword;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!matches) {
      setError("Las contrasenas no coinciden.");
      return;
    }

    setSubmitting(true);

    try {
      await updatePassword(password);
      setDone(true);
      window.setTimeout(() => navigate("/", { replace: true }), 1800);
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar la contrasena.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <PageLoader label="Verificando enlace..." />;
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
              Nueva contrasena
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
                letterSpacing: "-0.04em",
              }}
            >
              Crea tu nueva contrasena
            </h2>
          </div>

          {!session ? (
            <div style={{ display: "grid", gap: "1rem", justifyItems: "center", textAlign: "center" }}>
              <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.7)" }}>
                Este enlace no es valido o ya expiro. Pedi uno nuevo para continuar.
              </p>
              <Link className="fc-inline-link" to="/forgot-password">
                Pedir un nuevo enlace
              </Link>
            </div>
          ) : done ? (
            <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.75)", textAlign: "center" }}>
              Contrasena actualizada. Te estamos redirigiendo...
            </p>
          ) : (
            <>
              <form className="fc-form" onSubmit={handleSubmit}>
                <div className="fc-form__row">
                  <Input
                    id="reset-password"
                    label="Nueva contrasena"
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

                  <Input
                    id="reset-password-confirm"
                    label="Repetir contrasena"
                    type="password"
                    placeholder="Repeti tu contrasena"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <Button type="submit" loading={submitting} disabled={!passwordValid || !matches}>
                  <span className="fc-button__label">
                    Guardar contrasena
                    <ArrowRight size={16} />
                  </span>
                </Button>
              </form>

              {error ? (
                <div className="fc-form-message" role="alert" style={{ marginTop: "1rem" }}>
                  <div className="fc-dot" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              ) : null}
            </>
          )}
        </Card>
      </motion.section>
    </div>
  );
}

export default ResetPassword;
