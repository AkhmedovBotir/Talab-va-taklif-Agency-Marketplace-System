import React from 'react';
import styles from './ConfirmModal.module.css';

export interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
}

export function ConfirmModal({
  open,
  title = "Tasdiqlash",
  message,
  confirmText = "Ha",
  cancelText = "Bekor qilish",
  onConfirm,
  onCancel,
  loading = false,
  danger = false,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={() => !loading && onCancel()}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={[styles.btn, styles.cancelBtn].join(' ')}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={[styles.btn, danger ? styles.dangerBtn : styles.confirmBtn].join(' ')}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Kutilmoqda...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
