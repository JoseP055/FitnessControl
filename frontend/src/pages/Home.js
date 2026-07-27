import { ArrowRight, Dumbbell, LineChart, Sparkles, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";
import Button from "../components/ui/Button";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="fc-page fc-landing">
      <div className="fc-page__noise" />
      <span className="fc-hero-orb fc-hero-orb--primary" />
      <span className="fc-hero-orb fc-hero-orb--accent" />

      <div className="fc-landing__content">
        <div className="fc-landing__logo">
          <img src={logo} alt="FitnessControl" />
        </div>

        <span className="fc-text-eyebrow">
          <Sparkles size={14} />
          FitnessControl
        </span>

        <h1 className="fc-heading fc-landing__heading">Entrena con claridad.</h1>
        <p className="fc-subheading fc-landing__subheading">
          Rutinas, progreso, nutricion y amigos, todo organizado en un solo lugar.
        </p>

        <div className="fc-landing__features">
          <span className="fc-landing__feature">
            <Dumbbell size={16} />
            Rutinas
          </span>
          <span className="fc-landing__feature">
            <LineChart size={16} />
            Progreso
          </span>
          <span className="fc-landing__feature">
            <UtensilsCrossed size={16} />
            Nutricion
          </span>
        </div>

        <div className="fc-landing__actions">
          <Button onClick={() => navigate("/register")}>
            Registrarse
            <ArrowRight size={16} />
          </Button>
          <Button variant="ghost" onClick={() => navigate("/login")}>
            Ya tenes una cuenta? Iniciar sesion
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Home;
