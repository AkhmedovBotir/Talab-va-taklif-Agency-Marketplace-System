import { useEffect } from 'react';

export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: SnackbarType;
  duration?: number;
  onDismiss?: () => void;
  action?: { label: string; onPress: () => void };
}

const colors: Record<SnackbarType, string> = {
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF',
};

export default function Snackbar({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  action,
}: SnackbarProps) {
  useEffect(() => {
    if (visible && duration > 0 && !action) {
      const t = setTimeout(() => onDismiss?.(), duration);
      return () => clearTimeout(t);
    }
  }, [visible, duration, action, onDismiss]);

  if (!visible) return null;

  const bg = colors[type];

  return (
    <div className="snackbar-wrap">
      <div className="snackbar" style={{ backgroundColor: bg }}>
        <span className="snackbar-msg">{message}</span>
        {action ? (
          <button type="button" className="snackbar-action" onClick={action.onPress}>
            {action.label}
          </button>
        ) : (
          <button type="button" className="snackbar-close" onClick={onDismiss} aria-label="Yopish">
            ×
          </button>
        )}
      </div>
    </div>
  );
}
