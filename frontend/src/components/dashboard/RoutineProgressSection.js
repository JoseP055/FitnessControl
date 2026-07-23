import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

import Card from "../ui/Card";
import RoutineCalendar from "../routines/RoutineCalendar";
import { getRoutineCalendar } from "../../services/api";
import { getLocalDateIso } from "../../utils/date";

function RoutineProgressSection({ routineId, routineName }) {
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!routineId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getRoutineCalendar(routineId)
      .then((data) => {
        if (isMounted) {
          setCalendar(data);
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(loadError.message || "No se pudo cargar el progreso de la rutina.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [routineId]);

  if (!routineId) {
    return (
      <Card glass>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <span className="fc-text-eyebrow">
            <TrendingUp size={14} />
            Progreso de la rutina
          </span>
          <p className="fc-card-text">Todavia no tenes una rutina activa para mostrar progreso.</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card glass>
        <p className="fc-card-text">Cargando progreso de la rutina...</p>
      </Card>
    );
  }

  const items = calendar?.items || [];
  const todayIso = getLocalDateIso();
  const pastOrTodayItems = items.filter((item) => item.date <= todayIso);
  const doneCount = pastOrTodayItems.filter((item) => item.status === "done").length;
  const skippedCount = pastOrTodayItems.filter((item) => item.status === "skipped").length;
  const totalCount = pastOrTodayItems.length;
  const percent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <span className="fc-text-eyebrow">
            <TrendingUp size={14} />
            Progreso de {routineName || "tu rutina"}
          </span>
          <span className="fc-pill">
            {doneCount}/{totalCount} sesiones ({percent}%)
          </span>
        </div>

        <div className="fc-progress">
          <div className="fc-progress__bar" style={{ width: `${percent}%` }} />
        </div>

        {skippedCount > 0 ? (
          <p className="fc-card-text" style={{ margin: 0 }}>
            {skippedCount} {skippedCount === 1 ? "sesion salteada" : "sesiones salteadas"} hasta hoy.
          </p>
        ) : null}

        {error ? <p className="fc-form-message">{error}</p> : null}

        {calendar ? (
          <RoutineCalendar startDate={calendar.start_date} endDate={calendar.end_date} items={items} />
        ) : null}
      </div>
    </Card>
  );
}

export default RoutineProgressSection;
