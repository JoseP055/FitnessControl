import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  return (
    <span className="fc-info-tooltip" ref={containerRef}>
      <button
        type="button"
        className="fc-info-tooltip__trigger"
        onClick={() => setOpen((current) => !current)}
        aria-label="Mas informacion"
        aria-expanded={open}
      >
        <Info size={12} />
      </button>
      {open ? (
        <span className="fc-info-tooltip__bubble" role="tooltip">
          {text}
        </span>
      ) : null}
    </span>
  );
}

export default InfoTooltip;
