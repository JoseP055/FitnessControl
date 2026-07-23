import { useEffect, useRef, useState } from "react";

const HEIGHT = 180;
const PADDING_X = 14;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 28;

function formatAxisDate(time, useMonthLabels) {
  const date = new Date(time);
  return useMonthLabels
    ? date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" })
    : date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
}

function WeightLineChart({ points, weightGoalKg }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [hoverIndex, setHoverIndex] = useState(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const plotWidth = width - PADDING_X * 2;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const dates = points.map((point) => new Date(`${point.measurement_date}T00:00:00`).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateRange = maxDate - minDate || 1;

  const values = points.map((point) => point.weight_kg);
  const rangeMin = Math.min(...values, weightGoalKg || Infinity);
  const rangeMax = Math.max(...values, weightGoalKg || -Infinity);
  const valueRange = rangeMax - rangeMin || 1;
  const valuePadding = valueRange * 0.2;
  const paddedMin = rangeMin - valuePadding;
  const paddedMax = rangeMax + valuePadding;
  const paddedRange = paddedMax - paddedMin || 1;

  function xForDate(time) {
    return PADDING_X + ((time - minDate) / dateRange) * plotWidth;
  }

  function yForValue(value) {
    return PADDING_TOP + plotHeight - ((value - paddedMin) / paddedRange) * plotHeight;
  }

  const coords = points.map((point, index) => ({
    x: xForDate(dates[index]),
    y: yForValue(point.weight_kg),
    point,
  }));

  const linePath = coords.map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x.toFixed(2)},${coord.y.toFixed(2)}`).join(" ");
  const baseline = PADDING_TOP + plotHeight;
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(2)},${baseline.toFixed(2)} L${coords[0].x.toFixed(2)},${baseline.toFixed(2)} Z`;

  const goalY = weightGoalKg ? yForValue(weightGoalKg) : null;
  const spanDays = (maxDate - minDate) / 86400000;
  const useMonthLabels = spanDays > 60;

  const labelIndices =
    coords.length <= 4 ? coords.map((_, index) => index) : [0, Math.round((coords.length - 1) / 2), coords.length - 1];

  function handlePointerMove(event) {
    if (!containerRef.current) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const targetX = PADDING_X + ((event.clientX - rect.left) / rect.width) * plotWidth;

    let nearestIndex = 0;
    let nearestDistance = Infinity;
    coords.forEach((coord, index) => {
      const distance = Math.abs(coord.x - targetX);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setHoverIndex(nearestIndex);
  }

  const hovered = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <div
      ref={containerRef}
      className="fc-weight-chart"
      onMouseMove={handlePointerMove}
      onMouseLeave={() => setHoverIndex(null)}
      role="img"
      aria-label={`Linea de tiempo de peso, de ${formatAxisDate(minDate, useMonthLabels)} a ${formatAxisDate(maxDate, useMonthLabels)}`}
    >
      <svg viewBox={`0 0 ${width} ${HEIGHT}`} width="100%" height={HEIGHT} className="fc-weight-chart__svg">
        {goalY !== null ? (
          <>
            <line x1={PADDING_X} y1={goalY} x2={width - PADDING_X} y2={goalY} className="fc-weight-chart__goal-line" />
            <text x={width - PADDING_X} y={goalY - 6} textAnchor="end" className="fc-weight-chart__goal-label">
              Meta {weightGoalKg} kg
            </text>
          </>
        ) : null}

        <path d={areaPath} className="fc-weight-chart__area" />
        <path d={linePath} className="fc-weight-chart__line" />

        {hovered ? (
          <line
            x1={hovered.x}
            y1={PADDING_TOP}
            x2={hovered.x}
            y2={baseline}
            className="fc-weight-chart__crosshair"
          />
        ) : null}

        {coords.map((coord, index) => (
          <circle
            key={coord.point.measurement_date}
            cx={coord.x}
            cy={coord.y}
            r={index === coords.length - 1 || index === hoverIndex ? 5 : 3}
            className="fc-weight-chart__dot"
          />
        ))}

        {labelIndices.map((index) => (
          <text
            key={`label-${coords[index].point.measurement_date}`}
            x={coords[index].x}
            y={HEIGHT - 8}
            textAnchor={index === 0 ? "start" : index === coords.length - 1 ? "end" : "middle"}
            className="fc-weight-chart__axis-label"
          >
            {formatAxisDate(dates[index], useMonthLabels)}
          </text>
        ))}
      </svg>

      {hovered ? (
        <div
          className="fc-weight-chart__tooltip"
          style={{ left: `${Math.min(92, Math.max(8, (hovered.x / width) * 100))}%` }}
        >
          <strong>{hovered.point.weight_kg} kg</strong>
          <span>{formatAxisDate(dates[hoverIndex], useMonthLabels)}</span>
        </div>
      ) : null}
    </div>
  );
}

export default WeightLineChart;
