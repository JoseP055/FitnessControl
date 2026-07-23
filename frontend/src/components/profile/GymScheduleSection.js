import { useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";
import SectionLocked from "./SectionLocked";
import VisibilitySelector from "./VisibilitySelector";
import { deleteGymScheduleDay, updateVisibility, upsertGymScheduleDay } from "../../services/socialClient";

const WEEKDAY_LABELS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

function GymScheduleSection({ userId, isSelf, section, onRefresh }) {
  const [selectedDay, setSelectedDay] = useState(null);
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

  function openDay(dayOfWeek) {
    const existing = byDay.get(dayOfWeek);
    setSelectedDay(dayOfWeek);
    setStartTime(existing?.start_time?.slice(0, 5) || "18:00");
    setEndTime(existing?.end_time?.slice(0, 5) || "19:00");
    setError("");
  }

  async function handleSaveDay() {
    setError("");

    if (startTime >= endTime) {
      setError("La hora de fin debe ser posterior a la de inicio.");
      return;
    }

    setSaving(true);

    try {
      await upsertGymScheduleDay(userId, {
        day_of_week: selectedDay,
        start_time: startTime,
        end_time: endTime,
      });
      setSelectedDay(null);
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

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <span className="fc-text-eyebrow">
          <CalendarClock size={14} />
          Horario de gym
        </span>

        <div className="fc-day-picker">
          {WEEKDAY_LABELS.map((label, index) => {
            const scheduled = byDay.get(index);
            return (
              <button
                key={label}
                type="button"
                className={`fc-day-picker__day ${scheduled ? "is-scheduled" : ""} ${selectedDay === index ? "is-selected" : ""}`}
                onClick={() => (isSelf ? openDay(index) : null)}
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

        {isSelf && selectedDay !== null ? (
          <div className="fc-add-panel">
            <p className="fc-add-panel__title">
              <Plus size={15} />
              Horario para {WEEKDAY_LABELS[selectedDay]}
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
              <Button loading={saving} onClick={handleSaveDay}>
                Guardar {WEEKDAY_LABELS[selectedDay]}
              </Button>
              {byDay.get(selectedDay) ? (
                <Button
                  variant="ghost"
                  loading={busyId === byDay.get(selectedDay)?.id}
                  onClick={() => handleDelete(byDay.get(selectedDay).id)}
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
