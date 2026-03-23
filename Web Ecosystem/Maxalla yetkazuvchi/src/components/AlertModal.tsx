import React, { useEffect } from 'react';
import styles from './AlertModal.module.css';

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
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
    >
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <h2 id="alert-modal-title" className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.buttonPrimary} onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
