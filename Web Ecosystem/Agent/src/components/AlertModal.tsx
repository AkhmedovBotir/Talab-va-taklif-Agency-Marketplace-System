import React, { useEffect } from 'react';

type AlertModalProps = {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
};

export function AlertModal({ open, title = 'Xabar', message, onClose }: AlertModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modalOverlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
    >
      <div className="modalContainer" onClick={(e) => e.stopPropagation()}>
        <h2 id="alert-modal-title" className="modalTitle">{title}</h2>
        <p className="modalMessage">{message}</p>
        <div className="modalActions">
          <button type="button" className="modalButton modalButtonPrimary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
