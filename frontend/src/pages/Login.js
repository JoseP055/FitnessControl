import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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
              <ShieldCheck size={14} />
              Acceso seguro
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                letterSpacing: "-0.04em",
              }}
            >
              Iniciar sesion
            </h2>
            <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.66)", textAlign: "center" }}>
              Inicia sesion para continuar donde lo dejaste.
            </p>
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
                placeholder="Tu contrasena"
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
            <span>Todavia no tenes cuenta?</span>
            <Link className="fc-inline-link" to="/register">
              Crear cuenta
            </Link>
          </div>
        </Card>
      </motion.section>
    </div>
  );
}

export default Login;
