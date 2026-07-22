import { LineChart } from "lucide-react";

import Card from "../ui/Card";

function formatShortDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function WeightTrendSection({ measurements }) {
  const points = (measurements || [])
    .filter((entry) => entry.weight_kg !== null && entry.weight_kg !== undefined)
    .slice()
    .reverse();

  if (points.length < 2) {
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
        </div>
      </Card>
    );
  }

  const values = points.map((point) => point.weight_kg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const latest = points[points.length - 1];
  const first = points[0];
  const delta = latest.weight_kg - first.weight_kg;

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "0.9rem" }}>
        <span className="fc-text-eyebrow">
          <LineChart size={14} />
          Peso
        </span>

        <div className="fc-metric">
          <span className="fc-metric__value">{latest.weight_kg} kg</span>
          <span className="fc-metric__label">
            {delta === 0 ? "Sin cambios" : delta > 0 ? `+${delta.toFixed(1)} kg` : `${delta.toFixed(1)} kg`} desde{" "}
            {formatShortDate(first.measurement_date)}
          </span>
        </div>

        <div className="fc-sparkline" role="img" aria-label={`Tendencia de peso: de ${first.weight_kg} a ${latest.weight_kg} kg`}>
          {points.map((point, index) => {
            const heightPercent = 18 + ((point.weight_kg - min) / range) * 82;
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
      </div>
    </Card>
  );
}

export default WeightTrendSection;
