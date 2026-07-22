import { Trophy } from "lucide-react";

import Card from "../ui/Card";

const RECORD_TYPE_LABEL = {
  peso: "Peso",
  reps: "Reps",
  tiempo: "Tiempo",
  distancia: "Distancia",
};

function RecentPRsSection({ prs }) {
  return (
    <Card glass>
      <div style={{ display: "grid", gap: "0.9rem" }}>
        <span className="fc-text-eyebrow">
          <Trophy size={14} />
          Records recientes
        </span>

        {prs && prs.length ? (
          <div className="fc-routine-list">
            {prs.map((pr) => (
              <div key={pr.id} className="fc-friend-card">
                <div className="fc-friend-card__meta">
                  <div>
                    <div>{pr.exercise_name}</div>
                    <small className="fc-text-eyebrow">{RECORD_TYPE_LABEL[pr.record_type]}</small>
                  </div>
                </div>
                <span className="fc-pill">
                  {pr.value} {pr.unit || ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="fc-card-text">Todavia no registraste records personales en tu perfil.</p>
        )}
      </div>
    </Card>
  );
}

export default RecentPRsSection;
