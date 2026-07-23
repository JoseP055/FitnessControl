import { useEffect, useState } from "react";

function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const dateLabel = now.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
  const timeLabel = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="fc-live-clock">
      <span className="fc-live-clock__date">{dateLabel}</span>
      <span className="fc-live-clock__time">{timeLabel}</span>
    </div>
  );
}

export default LiveClock;
