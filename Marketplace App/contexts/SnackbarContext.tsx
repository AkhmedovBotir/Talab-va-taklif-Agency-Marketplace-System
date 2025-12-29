import React, { createContext, useContext, useState, ReactNode } from 'react';
import Snackbar, { SnackbarType } from '../components/ui/Snackbar';

interface SnackbarContextType {
  showSnackbar: (message: string, type?: SnackbarType, duration?: number, action?: { label: string; onPress: () => void }) => void;
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
  const [action, setAction] = useState<{ label: string; onPress: () => void } | undefined>(undefined);

  const showSnackbar = (
    msg: string,
    snackbarType: SnackbarType = 'info',
    snackbarDuration: number = 3000,
    snackbarAction?: { label: string; onPress: () => void }
  ) => {
    setMessage(msg);
    setType(snackbarType);
    setDuration(snackbarDuration);
    setAction(snackbarAction);
    setVisible(true);
  };

  const showSuccess = (msg: string, snackbarDuration: number = 3000) => {
    showSnackbar(msg, 'success', snackbarDuration);
  };

  const showError = (msg: string, snackbarDuration: number = 4000) => {
    showSnackbar(msg, 'error', snackbarDuration);
  };

  const showInfo = (msg: string, snackbarDuration: number = 3000) => {
    showSnackbar(msg, 'info', snackbarDuration);
  };

  const showWarning = (msg: string, snackbarDuration: number = 3000) => {
    showSnackbar(msg, 'warning', snackbarDuration);
  };

  const handleDismiss = () => {
    setVisible(false);
    setAction(undefined);
  };

  return (
    <SnackbarContext.Provider
      value={{
        showSnackbar,
        showSuccess,
        showError,
        showInfo,
        showWarning,
      }}
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
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}

