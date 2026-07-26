import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

const BUBBLE_WIDTH = 230;
const VIEWPORT_MARGIN = 12;

function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const bubbleRef = useRef(null);

  // Las tarjetas (.fc-card) usan overflow:hidden para el borde con gradiente,
  // asi que un popover posicionado dentro de ellas queda cortado. Se renderiza
  // en un portal a document.body con position:fixed, calculando la posicion a
  // mano, para que nunca quede recortado sin importar en que tarjeta se use.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, rect.left),
      window.innerWidth - BUBBLE_WIDTH - VIEWPORT_MARGIN
    );

    setPosition({ top: rect.bottom + 8, left });
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleOutside(event) {
      if (
        triggerRef.current?.contains(event.target) ||
        bubbleRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleDismiss() {
      setOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [open]);

  return (
    <span className="fc-info-tooltip">
      <button
        ref={triggerRef}
        type="button"
        className="fc-info-tooltip__trigger"
        onClick={() => setOpen((current) => !current)}
        aria-label="Mas informacion"
        aria-expanded={open}
      >
        <Info size={12} />
      </button>
      {open && position
        ? createPortal(
            <span
              ref={bubbleRef}
              className="fc-info-tooltip__bubble"
              role="tooltip"
              style={{ top: `${position.top}px`, left: `${position.left}px` }}
            >
              {text}
            </span>,
            document.body
          )
        : null}
    </span>
  );
}

export default InfoTooltip;
