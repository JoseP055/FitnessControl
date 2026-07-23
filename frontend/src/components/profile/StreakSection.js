import { Flame } from "lucide-react";

import Card from "../ui/Card";
import SectionLocked from "./SectionLocked";
import VisibilitySelector from "./VisibilitySelector";
import { updateVisibility } from "../../services/socialClient";

function StreakSection({ userId, isSelf, section, onRefresh }) {
  if (!isSelf && !section.visible) {
    return <SectionLocked label="El usuario tiene la racha oculta." />;
  }

  async function handleVisibilityChange(value) {
    await updateVisibility(userId, "streak_visibility", value);
    await onRefresh();
  }

  const streak = section.data;

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <span className="fc-text-eyebrow">
          <Flame size={14} />
          Racha
        </span>

        {streak ? (
          <div className="fc-streak-badge">
            <span className="fc-streak-badge__value">{streak.current_streak}</span>
            <span className="fc-streak-badge__label">
              {streak.current_streak === 1 ? "dia seguido" : "dias seguidos"} en {streak.routine_name}
            </span>
          </div>
        ) : (
          <p className="fc-card-text">Todavia no hay una rutina activa para calcular la racha.</p>
        )}

        {isSelf ? <VisibilitySelector value={section.visibility} onChange={handleVisibilityChange} /> : null}
      </div>
    </Card>
  );
}

export default StreakSection;
