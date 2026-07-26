import { Flame } from "lucide-react";

function StreakFlame({ count = 0, size = 32 }) {
  const isLit = count > 0;

  return (
    <span className={`fc-streak-flame ${isLit ? "is-lit" : "is-unlit"}`} aria-hidden="true">
      <Flame size={size} fill={isLit ? "currentColor" : "none"} strokeWidth={isLit ? 1.5 : 1.75} />
    </span>
  );
}

export default StreakFlame;
