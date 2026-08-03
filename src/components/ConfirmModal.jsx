import "../styles/confirm-modal.css";

export default function ConfirmModal({
  isOpen,
  title = "Conferma operazione",
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        <div className="confirm-modal__panel">
          <div className="confirm-modal__icon" aria-hidden="true">
            !
          </div>

          <div className="confirm-modal__content">
            <p className="section-eyebrow">Conferma richiesta</p>

            <h2 id="confirm-modal-title" className="confirm-modal__title">
              {title}
            </h2>

            <p id="confirm-modal-message" className="confirm-modal__message">
              {message}
            </p>
          </div>

          <div className="confirm-modal__actions">
            <button
              className="btn button-secondary"
              type="button"
              disabled={isLoading}
              onClick={onCancel}
            >
              {cancelLabel}
            </button>

            <button
              className="btn btn-danger"
              type="button"
              disabled={isLoading}
              onClick={onConfirm}
            >
              {isLoading ? "Operazione in corso..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>

      <button
        className="confirm-modal__backdrop"
        type="button"
        aria-label="Chiudi finestra di conferma"
        disabled={isLoading}
        onClick={onCancel}
      />
    </>
  );
}
