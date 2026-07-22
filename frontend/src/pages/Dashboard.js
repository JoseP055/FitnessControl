import { User2 } from "lucide-react";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="fc-page">
      <div className="fc-page__noise" />
      <div style={{ position: "relative", zIndex: 1, padding: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.04em",
                fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              }}
            >
              Hola{user?.email ? `, ${user.email}` : ""}.
            </h1>
            <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.68)" }}>
              Tu dashboard va a vivir acá.
            </p>
          </div>

          <Button variant="secondary" onClick={signOut}>
            Cerrar sesión
          </Button>
        </div>

        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <Card glass>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <span className="fc-text-eyebrow">
                <User2 size={14} />
                Perfil
              </span>
              <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.72)" }}>
                Completaste tu perfil. Próximo paso: rutinas y progreso.
              </p>
            </div>
          </Card>
          <Card glass>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <span className="fc-text-eyebrow">Rutinas</span>
              <p style={{ margin: 0, color: "rgba(242, 238, 245, 0.72)" }}>
                Estado vacío listo para diseñar (crear primera rutina).
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
