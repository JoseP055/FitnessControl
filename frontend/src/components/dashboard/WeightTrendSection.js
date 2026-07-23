import { LineChart, Target } from "lucide-react";

import Card from "../ui/Card";

function formatShortDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateTime(isoTimestamp) {
  if (!isoTimestamp) {
    return "";
  }

  const date = new Date(isoTimestamp);
  const datePart = date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  const timePart = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
}

function formatSignedKg(value) {
  if (value === 0) {
    return "0 kg";
  }
  return value > 0 ? `+${value.toFixed(1)} kg` : `${value.toFixed(1)} kg`;
}

function buildGoalMessage(latestWeight, weightGoalKg) {
  const diff = latestWeight - weightGoalKg;
  if (Math.abs(diff) < 0.05) {
    return "Meta alcanzada.";
  }
  if (diff > 0) {
    return `Te faltan ${diff.toFixed(1)} kg para tu meta de ${weightGoalKg} kg.`;
  }
  return `Superaste tu meta de ${weightGoalKg} kg por ${Math.abs(diff).toFixed(1)} kg.`;
}

function WeightTrendSection({ measurements, weightGoalKg }) {
  const points = (measurements || [])
    .filter((entry) => entry.weight_kg !== null && entry.weight_kg !== undefined)
    .slice()
    .reverse();

  if (points.length === 0) {
    return (
      <Card glass>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <span className="fc-text-eyebrow">
            <LineChart size={14} />
            Peso
          </span>
          <p className="fc-card-text">
            Registra tu peso al menos dos veces (en Perfil) para ver tu tendencia aca.
          </p>
          {weightGoalKg ? (
            <p className="fc-card-text" style={{ margin: 0 }}>
              Tu meta actual es <strong>{weightGoalKg} kg</strong>.
            </p>
          ) : null}
        </div>
      </Card>
    );
  }

  const latest = points[points.length - 1];

  if (points.length === 1) {
    return (
      <Card glass>
        <div style={{ display: "grid", gap: "0.9rem" }}>
          <span className="fc-text-eyebrow">
            <LineChart size={14} />
            Peso
          </span>

          <div className="fc-metric">
            <span className="fc-metric__value">{latest.weight_kg} kg</span>
            <span className="fc-metric__label">Ultima actualizacion: {formatDateTime(latest.updated_at)}</span>
          </div>

          <p className="fc-card-text">
            Registra tu peso una vez mas para ver tu tendencia y el ritmo de cambio.
          </p>

          {weightGoalKg ? (
            <p className="fc-card-text" style={{ margin: 0 }}>
              <Target size={14} style={{ verticalAlign: "-2px", marginRight: "0.3rem" }} />
              {buildGoalMessage(latest.weight_kg, weightGoalKg)}
            </p>
          ) : null}
        </div>
      </Card>
    );
  }

  const values = points.map((point) => point.weight_kg);
  const first = points[0];
  const previous = points[points.length - 2];

  const rangeMin = Math.min(...values, weightGoalKg || Infinity);
  const rangeMax = Math.max(...values, weightGoalKg || -Infinity);
  const range = rangeMax - rangeMin || 1;

  const deltaTotal = latest.weight_kg - first.weight_kg;
  const deltaPrevious = latest.weight_kg - previous.weight_kg;

  const daysBetween = Math.max(
    1,
    Math.round((new Date(`${latest.measurement_date}T00:00:00`) - new Date(`${first.measurement_date}T00:00:00`)) / 86400000)
  );
  const weeklyRate = (deltaTotal / daysBetween) * 7;

  let goalProgressPercent = null;
  if (weightGoalKg) {
    const totalChange = weightGoalKg - first.weight_kg;
    goalProgressPercent =
      Math.abs(totalChange) > 0.001
        ? Math.max(0, Math.min(100, Math.round(((latest.weight_kg - first.weight_kg) / totalChange) * 100)))
        : 100;
  }

  const goalHeightPercent = weightGoalKg ? 18 + ((weightGoalKg - rangeMin) / range) * 82 : null;

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "0.9rem" }}>
        <span className="fc-text-eyebrow">
          <LineChart size={14} />
          Peso
        </span>

        <div className="fc-metric">
          <span className="fc-metric__value">{latest.weight_kg} kg</span>
          <span className="fc-metric__label">Ultima actualizacion: {formatDateTime(latest.updated_at)}</span>
        </div>

        <div className="fc-kv-grid">
          <div className="fc-kv">
            <span className="fc-kv__label">Desde el ultimo registro</span>
            <span className="fc-kv__value">
              {formatSignedKg(deltaPrevious)} <small>({formatShortDate(previous.measurement_date)})</small>
            </span>
          </div>
          <div className="fc-kv">
            <span className="fc-kv__label">Desde {formatShortDate(first.measurement_date)}</span>
            <span className="fc-kv__value">{formatSignedKg(deltaTotal)}</span>
          </div>
          <div className="fc-kv">
            <span className="fc-kv__label">Ritmo promedio</span>
            <span className="fc-kv__value">{formatSignedKg(weeklyRate)} /semana</span>
          </div>
        </div>

        <div className="fc-sparkline" role="img" aria-label={`Tendencia de peso: de ${first.weight_kg} a ${latest.weight_kg} kg`}>
          {goalHeightPercent !== null ? (
            <div className="fc-sparkline__goal-line" style={{ bottom: `${goalHeightPercent}%` }} />
          ) : null}
          {points.map((point, index) => {
            const heightPercent = 18 + ((point.weight_kg - rangeMin) / range) * 82;
            const isLatest = index === points.length - 1;
            return (
              <div
                key={point.measurement_date}
                className={`fc-sparkline__bar ${isLatest ? "is-latest" : ""}`}
                style={{ height: `${heightPercent}%` }}
                title={`${formatShortDate(point.measurement_date)}: ${point.weight_kg} kg`}
              />
            );
          })}
        </div>

        {weightGoalKg ? (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <p className="fc-card-text" style={{ margin: 0 }}>
              <Target size={14} style={{ verticalAlign: "-2px", marginRight: "0.3rem" }} />
              {buildGoalMessage(latest.weight_kg, weightGoalKg)}
            </p>
            {goalProgressPercent !== null ? (
              <div className="fc-progress">
                <div className="fc-progress__bar" style={{ width: `${goalProgressPercent}%` }} />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export default WeightTrendSection;
