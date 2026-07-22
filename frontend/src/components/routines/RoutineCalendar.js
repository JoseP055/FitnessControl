const WEEKDAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function toIsoDate(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const [year, month, day] = toIsoDate(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addMonths(baseDate, months) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const day = baseDate.getDate();
  const target = new Date(year, month + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(day, lastDay));
}

function getMonthBlocks(startDate, endDate) {
  const blocks = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (cursor <= endDate) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const visibleStartOffset = (cursor.getDay() + 6) % 7;
    const days = [];

    for (let index = 0; index < visibleStartOffset; index += 1) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      days.push(new Date(year, month, day));
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    blocks.push({
      key: `${year}-${month}`,
      label: `${MONTH_LABELS[month]} ${year}`,
      days,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return blocks;
}

function RoutineCalendar({
  startDate,
  endDate,
  items = [],
  selectedDate = "",
  onSelectDate,
  interactive = false,
}) {
  const normalizedStart = parseDate(startDate);
  const normalizedEnd = parseDate(endDate);

  if (!normalizedStart || !normalizedEnd) {
    return (
      <div className="fc-routine-calendar fc-routine-calendar--empty">
        <p className="fc-card-text" style={{ margin: 0 }}>
          Defini una fecha de inicio y una duracion para ver el calendario.
        </p>
      </div>
    );
  }

  const months = getMonthBlocks(normalizedStart, normalizedEnd);
  const itemsByDate = items.reduce((accumulator, item) => {
    const dateKey = toIsoDate(item.date);
    if (!accumulator[dateKey]) {
      accumulator[dateKey] = [];
    }
    accumulator[dateKey].push(item);
    return accumulator;
  }, {});

  return (
    <div className="fc-routine-calendar">
      {months.map((month) => (
        <div key={month.key} className="fc-routine-calendar__month">
          <div className="fc-routine-calendar__month-header">
            <h3 className="fc-section-title" style={{ margin: 0, fontSize: "1.05rem" }}>
              {month.label}
            </h3>
          </div>

          <div className="fc-routine-calendar__table">
            <div className="fc-routine-calendar__weekdays">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="fc-routine-calendar__grid">
              {month.days.map((currentDate, index) => {
                if (!currentDate) {
                  return (
                    <div
                      key={`empty-${month.key}-${index}`}
                      className="fc-routine-calendar__cell is-empty"
                    />
                  );
                }

                const isoDate = toIsoDate(currentDate);
                const dayItems = itemsByDate[isoDate] || [];
                const selected = selectedDate === isoDate;
                const isToday = isoDate === toIsoDate(new Date());
                const hasTraining = dayItems.length > 0;
                const hasDone = dayItems.some((item) => item.status === "done");
                const hasSkipped = dayItems.some((item) => item.status === "skipped");
                const statusClass = hasDone
                  ? "is-done"
                  : hasSkipped
                    ? "is-skipped"
                    : hasTraining
                      ? "is-pending"
                      : "";

                const content = (
                  <>
                    <span className="fc-routine-calendar__day-number">{currentDate.getDate()}</span>
                    {hasTraining ? (
                      <span className="fc-routine-calendar__badge">
                        {dayItems.length} {dayItems.length === 1 ? "sesion" : "sesiones"}
                      </span>
                    ) : null}
                  </>
                );

                if (!interactive) {
                  return (
                    <div
                      key={isoDate}
                      className={`fc-routine-calendar__cell ${hasTraining ? "has-training" : ""} ${statusClass} ${selected ? "is-selected" : ""} ${isToday ? "is-today" : ""}`}
                    >
                      {content}
                    </div>
                  );
                }

                return (
                  <button
                    key={isoDate}
                    type="button"
                    className={`fc-routine-calendar__cell ${hasTraining ? "has-training" : ""} ${statusClass} ${selected ? "is-selected" : ""} ${isToday ? "is-today" : ""}`}
                    onClick={() => onSelectDate?.(isoDate)}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function buildCalendarPreview({ startDate, durationMonths, selectedDays }) {
  if (!startDate || !durationMonths || !selectedDays?.length) {
    return {
      startDate: startDate || "",
      endDate: "",
      items: [],
      totalScheduledSessions: 0,
      nextTrainingDate: null,
    };
  }

  const start = parseDate(startDate);
  if (!start) {
    return {
      startDate,
      endDate: "",
      items: [],
      totalScheduledSessions: 0,
      nextTrainingDate: null,
    };
  }

  const end = new Date(addMonths(start, durationMonths));
  end.setDate(end.getDate() - 1);

  const items = [];
  const selectedWeekdays = selectedDays.map((day) => day.day_of_week);
  const todayIso = toIsoDate(new Date());

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const weekday = (cursor.getDay() + 6) % 7;
    if (!selectedWeekdays.includes(weekday)) {
      continue;
    }

    const dayConfig = selectedDays.find((day) => day.day_of_week === weekday);
    items.push({
      date: toIsoDate(cursor),
      routine_day_id: dayConfig?.id || `draft-${weekday}`,
      status: "pending",
      muscle_subgroups: dayConfig?.muscle_subgroups || [],
      muscle_groups: dayConfig?.muscle_subgroups || [],
      exercise_count: dayConfig?.exercises?.length || 0,
    });
  }

  const nextTrainingDate = items.find((item) => item.date >= todayIso)?.date || items[0]?.date || null;

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
    items,
    totalScheduledSessions: items.length,
    nextTrainingDate,
  };
}

export default RoutineCalendar;
