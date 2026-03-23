import React, { useEffect } from 'react';

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title = 'Tasdiqlash',
  message,
  confirmLabel = 'Ha',
  cancelLabel = 'Bekor',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modalOverlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="modalContainer" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-modal-title" className="modalTitle">{title}</h2>
        <p className="modalMessage">{message}</p>
        <div className="modalActions">
          <button type="button" className="modalButton modalButtonSecondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="modalButton modalButtonPrimary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
