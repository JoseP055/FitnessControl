import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signIn(email, password);
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (signInError) {
      setError(signInError.message || "No se pudo iniciar sesion.");
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
              <h1 className="fc-heading">Bienvenido de vuelta.</h1>
              <p className="fc-subheading">
                Iniciá sesión para seguir tu progreso y mantener tu racha en marcha.
              </p>
            </div>
          </div>

          <div className="fc-abstract-visual" aria-hidden="true">
            <div className="fc-abstract-grid" />
            <motion.div
              style={{
                position: "absolute",
                top: "14%",
                left: "12%",
                width: "38%",
                height: "18%",
                borderRadius: "18px",
                border: "1px solid rgba(174, 147, 217, 0.16)",
                background:
                  "linear-gradient(135deg, rgba(145, 106, 140, 0.34), rgba(172, 79, 116, 0.22))",
                backdropFilter: "blur(12px)",
              }}
              animate={{ y: [0, -8, 0], rotate: [0, 1.5, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              style={{
                position: "absolute",
                right: "10%",
                top: "22%",
                width: "24%",
                height: "42%",
                borderRadius: "24px",
                border: "1px solid rgba(174, 147, 217, 0.18)",
                background: "rgba(23, 18, 28, 0.75)",
                boxShadow: "0 18px 40px rgba(10, 8, 14, 0.22)",
              }}
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              style={{
                position: "absolute",
                left: "20%",
                bottom: "16%",
                width: "56%",
                height: "12px",
                borderRadius: "999px",
                background:
                  "linear-gradient(90deg, rgba(172, 79, 116, 0.75), rgba(145, 106, 140, 0.55))",
              }}
              animate={{ scaleX: [0.72, 1, 0.82], opacity: [0.5, 0.92, 0.65] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="fc-auth-metric-grid">
            <div className="fc-auth-metric">
              <strong>Rutinas</strong>
              <span>Guardá y repetí tus entrenamientos favoritos.</span>
            </div>
            <div className="fc-auth-metric">
              <strong>Progreso</strong>
              <span>Visualizá tu avance con claridad, sin ruido.</span>
            </div>
          </div>

          <div className="fc-auth-quote">
            <strong>Todo en un solo lugar.</strong>
            <p style={{ margin: 0 }}>
              Rutinas, medidas y registros organizados para que entrenar sea más simple.
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
                <ShieldCheck size={14} />
                Acceso seguro
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
                  Iniciar sesión
                </h2>
                <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.66)" }}>
                  Iniciá sesión para continuar donde lo dejaste.
                </p>
              </div>
            </div>

            <form className="fc-form" onSubmit={handleSubmit}>
              <div className="fc-form__row">
                <Input
                  id="login-email"
                  label="Email"
                  type="email"
                  placeholder="vos@ejemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />

                <Input
                  id="login-password"
                  label="Password"
                  type="password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button type="submit" loading={submitting}>
                <span className="fc-button__label">
                  Entrar ahora
                  <ArrowRight size={16} />
                </span>
              </Button>
            </form>

            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: error ? 1 : 0,
                height: error ? "auto" : 0,
                marginTop: error ? "1rem" : 0,
              }}
              transition={{ duration: 0.2 }}
            >
              {error ? (
                <div className="fc-form-message" role="alert">
                  <div className="fc-dot" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              ) : null}
            </motion.div>

            <div style={{ marginTop: "1.5rem" }} className="fc-login-footer">
              <span>¿Todavía no tenés cuenta?</span>
              <Link className="fc-inline-link" to="/register">
                Crear cuenta
              </Link>
            </div>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}

export default Login;
