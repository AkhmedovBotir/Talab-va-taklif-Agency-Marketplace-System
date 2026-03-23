import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ModalMode = 'alert' | 'confirm';

interface ModalOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

interface ModalState {
  open: boolean;
  mode: ModalMode;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  showAlert: (message: string, options?: ModalOptions) => Promise<void>;
  showConfirm: (message: string, options?: ModalOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const openModal = useCallback(
    (mode: ModalMode, message: string, options?: ModalOptions) => {
      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
        setState({
          open: true,
          mode,
          message,
          title: options?.title,
          confirmText: options?.confirmText,
          cancelText: options?.cancelText,
        });
      });
    },
    []
  );

  const handleClose = useCallback((result: boolean) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setState(null);
    if (resolver) resolver(result);
  }, []);

  const showAlert = useCallback(
    async (message: string, options?: ModalOptions) => {
      await openModal('alert', message, {
        confirmText: options?.confirmText ?? 'Tushunarli',
        title: options?.title,
      });
    },
    [openModal]
  );

  const showConfirm = useCallback(
    (message: string, options?: ModalOptions) => {
      return openModal('confirm', message, options);
    },
    [openModal]
  );

  const value: ModalContextType = {
    showAlert,
    showConfirm,
  };

  const current = state;

  return (
    <ModalContext.Provider value={value}>
      {children}
      {current?.open && (
        <div className="modalOverlay">
          <div className="modalContainer" role="dialog" aria-modal="true">
            {current.title && <div className="modalTitle">{current.title}</div>}
            <div className="modalMessage">{current.message}</div>
            <div className="modalActions">
              {current.mode === 'confirm' && (
                <button
                  type="button"
                  className="modalButton modalButtonSecondary"
                  onClick={() => handleClose(false)}
                >
                  {current.cancelText ?? 'Bekor qilish'}
                </button>
              )}
              <button
                type="button"
                className="modalButton modalButtonPrimary"
                onClick={() => handleClose(true)}
              >
                {current.confirmText ?? 'Ha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (ctx === undefined) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return ctx;
}

