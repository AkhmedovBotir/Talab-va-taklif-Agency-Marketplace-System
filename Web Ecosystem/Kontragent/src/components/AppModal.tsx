import styles from './AppModal.module.css';

export interface AppModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  confirmDanger?: boolean;
}

export function AppModal({
  open,
  onClose,
  title,
  message,
  variant = 'alert',
  confirmText = 'OK',
  cancelText = 'Bekor qilish',
  onConfirm,
  confirmDanger = false,
}: AppModalProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttons}>
          {variant === 'confirm' && (
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className={[styles.btnPrimary, confirmDanger && styles.btnDanger].filter(Boolean).join(' ')}
            onClick={variant === 'alert' ? onClose : handleConfirm}
          >
            {variant === 'alert' ? 'OK' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
