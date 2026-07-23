import { useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";
import SectionLocked from "./SectionLocked";
import VisibilitySelector from "./VisibilitySelector";
import { deleteGymScheduleDay, updateVisibility, upsertGymScheduleDay } from "../../services/socialClient";

const WEEKDAY_LABELS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

function GymScheduleSection({ userId, isSelf, section, onRefresh }) {
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  if (!isSelf && !section.visible) {
    return <SectionLocked label="El usuario tiene el horario de gym oculto." />;
  }

  const days = section.data || [];
  const byDay = new Map(days.map((day) => [day.day_of_week, day]));

  function toggleDay(dayOfWeek) {
    setError("");
    setSelectedDays((current) => {
      if (current.includes(dayOfWeek)) {
        return current.filter((day) => day !== dayOfWeek);
      }

      if (current.length === 0) {
        const existing = byDay.get(dayOfWeek);
        setStartTime(existing?.start_time?.slice(0, 5) || "18:00");
        setEndTime(existing?.end_time?.slice(0, 5) || "19:00");
      }

      return [...current, dayOfWeek].sort();
    });
  }

  async function handleSaveDays() {
    setError("");

    if (startTime >= endTime) {
      setError("La hora de fin debe ser posterior a la de inicio.");
      return;
    }

    setSaving(true);

    try {
      await Promise.all(
        selectedDays.map((dayOfWeek) =>
          upsertGymScheduleDay(userId, {
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
          })
        )
      );
      setSelectedDays([]);
      await onRefresh();
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar el horario.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setBusyId(id);
    setError("");

    try {
      await deleteGymScheduleDay(id);
      setSelectedDays([]);
      await onRefresh();
    } catch (deleteError) {
      setError(deleteError.message || "No se pudo eliminar el horario.");
    } finally {
      setBusyId("");
    }
  }

  async function handleVisibilityChange(value) {
    try {
      await updateVisibility(userId, "gym_schedule_visibility", value);
      await onRefresh();
    } catch (visibilityError) {
      setError(visibilityError.message || "No se pudo actualizar la visibilidad.");
    }
  }

  const selectedLabel = selectedDays.map((day) => WEEKDAY_LABELS[day]).join(", ");
  const singleExisting = selectedDays.length === 1 ? byDay.get(selectedDays[0]) : null;

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <span className="fc-text-eyebrow">
          <CalendarClock size={14} />
          Horario de gym
        </span>
        {isSelf ? (
          <p className="fc-card-text">Elegi uno o varios dias y asignales el mismo horario, por ejemplo Lunes, Martes y Miercoles de 18 a 19.</p>
        ) : null}

        <div className="fc-day-picker">
          {WEEKDAY_LABELS.map((label, index) => {
            const scheduled = byDay.get(index);
            return (
              <button
                key={label}
                type="button"
                className={`fc-day-picker__day ${scheduled ? "is-scheduled" : ""} ${selectedDays.includes(index) ? "is-selected" : ""}`}
                onClick={() => (isSelf ? toggleDay(index) : null)}
                disabled={!isSelf}
              >
                <span>{label.slice(0, 3)}</span>
                {scheduled ? (
                  <small>
                    {scheduled.start_time?.slice(0, 5)}-{scheduled.end_time?.slice(0, 5)}
                  </small>
                ) : null}
              </button>
            );
          })}
        </div>

        {!days.length ? <p className="fc-card-text">Todavia no hay horario cargado.</p> : null}

        {isSelf && selectedDays.length ? (
          <div className="fc-add-panel">
            <p className="fc-add-panel__title">
              <Plus size={15} />
              Horario para {selectedLabel}
            </p>
            <div className="fc-inline-form">
              <input
                className="fc-input"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
              <input
                className="fc-input"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
              <Button loading={saving} onClick={handleSaveDays}>
                Guardar {selectedDays.length > 1 ? `${selectedDays.length} dias` : selectedLabel}
              </Button>
              {singleExisting ? (
                <Button
                  variant="ghost"
                  loading={busyId === singleExisting.id}
                  onClick={() => handleDelete(singleExisting.id)}
                >
                  <Trash2 size={16} />
                </Button>
              ) : null}
            </div>
            {error ? <p className="fc-form-message">{error}</p> : null}
          </div>
        ) : null}

        {isSelf ? <VisibilitySelector value={section.visibility} onChange={handleVisibilityChange} /> : null}
      </div>
    </Card>
  );
}

export default GymScheduleSection;
