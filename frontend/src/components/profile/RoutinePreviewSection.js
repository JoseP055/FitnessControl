import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";
import SectionLocked from "./SectionLocked";
import VisibilitySelector from "./VisibilitySelector";
import { updateVisibility } from "../../services/socialClient";

function RoutinePreviewSection({ userId, isSelf, section, onRefresh }) {
  const navigate = useNavigate();

  if (!isSelf && !section.visible) {
    return <SectionLocked label="El usuario tiene la rutina oculta." />;
  }

  async function handleVisibilityChange(value) {
    await updateVisibility(userId, "routine_preview_visibility", value);
    await onRefresh();
  }

  const routine = section.data;

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <span className="fc-text-eyebrow">
          <ClipboardList size={14} />
          Rutina actual
        </span>

        {routine ? (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <h2 className="fc-section-title">{routine.name}</h2>
            {routine.description ? <p className="fc-card-text">{routine.description}</p> : null}
            <div className="fc-helper-list">
              <span className="fc-pill">{routine.day_count} dias / {routine.exercise_count} ejercicios</span>
              {routine.muscle_groups.map((group) => (
                <span key={group} className="fc-pill">
                  {group}
                </span>
              ))}
            </div>
            {isSelf ? (
              <Button variant="secondary" onClick={() => navigate(`/routines/${routine.routine_id}`)}>
                Ver rutina completa
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="fc-card-text">Todavia no hay una rutina para mostrar.</p>
        )}

        {isSelf ? <VisibilitySelector value={section.visibility} onChange={handleVisibilityChange} /> : null}
      </div>
    </Card>
  );
}

export default RoutinePreviewSection;
