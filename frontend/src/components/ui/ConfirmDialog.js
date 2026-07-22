import { AlertTriangle, X } from "lucide-react";

import Button from "./Button";

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fc-dialog-root" role="dialog" aria-modal="true" aria-labelledby="fc-dialog-title">
      <button
        type="button"
        className="fc-dialog-backdrop"
        aria-label="Cerrar dialogo"
        onClick={onCancel}
      />

      <div className="fc-dialog-card">
        <div className="fc-dialog-card__header">
          <div className="fc-dialog-card__icon">
            <AlertTriangle size={18} />
          </div>

          <button
            type="button"
            className="fc-dialog-card__close"
            aria-label="Cerrar dialogo"
            onClick={onCancel}
          >
            <X size={16} />
          </button>
        </div>

        <div className="fc-dialog-card__body">
          <h2 id="fc-dialog-title" className="fc-section-title">
            {title}
          </h2>
          <p className="fc-card-text">{description}</p>
        </div>

        <div className="fc-dialog-card__actions">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
