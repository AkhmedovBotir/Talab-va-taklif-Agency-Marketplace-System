import { createContext, useContext, useState, ReactNode } from 'react';
import Snackbar, { SnackbarType } from '../components/ui/Snackbar';

interface SnackbarContextType {
  showSnackbar: (
    message: string,
    type?: SnackbarType,
    duration?: number,
    action?: { label: string; onPress: () => void }
  ) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SnackbarType>('info');
  const [duration, setDuration] = useState(3000);
  const [action, setAction] = useState<{ label: string; onPress: () => void } | undefined>(
    undefined
  );

  const showSnackbar = (
    msg: string,
    t: SnackbarType = 'info',
    d: number = 3000,
    a?: { label: string; onPress: () => void }
  ) => {
    setMessage(msg);
    setType(t);
    setDuration(d);
    setAction(a);
    setVisible(true);
  };

  const showSuccess = (msg: string, d = 3000) => showSnackbar(msg, 'success', d);
  const showError = (msg: string, d = 4000) => showSnackbar(msg, 'error', d);
  const showInfo = (msg: string, d = 3000) => showSnackbar(msg, 'info', d);
  const showWarning = (msg: string, d = 3000) => showSnackbar(msg, 'warning', d);

  const handleDismiss = () => {
    setVisible(false);
    setAction(undefined);
  };

  return (
    <SnackbarContext.Provider
      value={{ showSnackbar, showSuccess, showError, showInfo, showWarning }}
    >
      {children}
      <Snackbar
        visible={visible}
        message={message}
        type={type}
        duration={duration}
        onDismiss={handleDismiss}
        action={action}
      />
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (ctx === undefined) throw new Error('useSnackbar must be used within SnackbarProvider');
  return ctx;
}
