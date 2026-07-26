import Card from "../ui/Card";
import InfoTooltip from "../ui/InfoTooltip";
import StreakFlame from "../ui/StreakFlame";
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
  const streakCount = streak?.current_streak ?? 0;

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <span className="fc-text-eyebrow">
          Racha
          <InfoTooltip text="Se calcula sobre los dias programados de tu rutina actual que marcaste como hechos." />
        </span>

        {streak ? (
          <div className="fc-streak-badge">
            <StreakFlame count={streakCount} size={38} />
            <div>
              <span className="fc-streak-badge__value">{streakCount}</span>
              <span className="fc-streak-badge__label">
                {" "}
                {streakCount === 1 ? "dia seguido" : "dias seguidos"} en {streak.routine_name}
              </span>
            </div>
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
