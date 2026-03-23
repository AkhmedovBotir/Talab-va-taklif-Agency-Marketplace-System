import React from 'react';
import styles from './Modal.module.css';

export type ModalVariant = 'info' | 'success' | 'error';

/** Alert: message + OK */
export interface AlertModalProps {
  open: boolean;
  variant?: ModalVariant;
  title?: string;
  message: string;
  onClose: () => void;
}

export function AlertModal({ open, variant = 'info', title, message, onClose }: AlertModalProps) {
  if (!open) return null;
  const defaultTitle = variant === 'error' ? 'Xatolik' : variant === 'success' ? 'Muvaffaqiyat' : 'Xabar';
  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div className={`${styles.dialog} ${styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`]}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className={styles.title}>{title ?? defaultTitle}</h2>
        <p className={styles.message}>{message}</p>
        <div className={`${styles.actions} ${styles.actionsSingle}`}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

/** Confirm: message + Cancel + Confirm */
export interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title = 'Tasdiqlash',
  message,
  confirmLabel = 'Ha',
  cancelLabel = 'Bekor qilish',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;
  const btnClass = variant === 'danger' ? styles.btnDanger : styles.btnPrimary;
  return (
    <div className={styles.overlay} onClick={onCancel} role="presentation">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.btnOutline}`} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={`${styles.btn} ${btnClass}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
