import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ShowConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Qizil “Rad etish” / “Chiqish” uslubi */
  destructive?: boolean;
};

export type ShowAlertOptions = {
  title: string;
  message: string;
  okText?: string;
};

type DialogPayload =
  | ({ mode: 'confirm' } & ShowConfirmOptions)
  | ({ mode: 'alert' } & ShowAlertOptions);

interface DialogContextValue {
  showConfirm: (options: ShowConfirmOptions) => Promise<boolean>;
  showAlert: (options: ShowAlertOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog DialogProvider ichida ishlatilishi kerak');
  }
  return ctx;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<DialogPayload | null>(null);
  const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);
  const alertResolveRef = useRef<(() => void) | null>(null);

  const finishConfirm = useCallback((value: boolean) => {
    const r = confirmResolveRef.current;
    confirmResolveRef.current = null;
    setVisible(false);
    setPayload(null);
    r?.(value);
  }, []);

  const finishAlert = useCallback(() => {
    const r = alertResolveRef.current;
    alertResolveRef.current = null;
    setVisible(false);
    setPayload(null);
    r?.();
  }, []);

  const showConfirm = useCallback((options: ShowConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      confirmResolveRef.current = resolve;
      setPayload({ mode: 'confirm', ...options });
      setVisible(true);
    });
  }, []);

  const showAlert = useCallback((options: ShowAlertOptions) => {
    return new Promise<void>((resolve) => {
      alertResolveRef.current = resolve;
      setPayload({ mode: 'alert', ...options });
      setVisible(true);
    });
  }, []);

  const value = useMemo(
    () => ({ showConfirm, showAlert }),
    [showConfirm, showAlert]
  );

  const isWeb = Platform.OS === 'web';
  const cardMaxWidth = Math.min(400, windowWidth - 32);
  const maxDialogHeight = Math.min(windowHeight * 0.72, windowHeight - insets.top - insets.bottom - 48);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (payload?.mode === 'confirm') finishConfirm(false);
          else finishAlert();
        }}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (payload?.mode === 'confirm') finishConfirm(false);
            else finishAlert();
          }}
        >
          <Pressable
            style={[
              styles.cardWrap,
              {
                paddingTop: Math.max(insets.top, 16),
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[
                styles.card,
                {
                  width: cardMaxWidth,
                  maxWidth: '100%',
                  ...(isWeb
                    ? ({
                        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                      } as object)
                    : null),
                },
              ]}
            >
              {payload && (
                <>
                  <Text style={styles.title}>{payload.title}</Text>
                  <ScrollView
                    style={{ maxHeight: maxDialogHeight }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator
                  >
                    <Text style={styles.message}>{payload.message}</Text>
                  </ScrollView>
                  <View
                    style={[
                      styles.actions,
                      payload.mode === 'alert' && styles.actionsAlert,
                    ]}
                  >
                    {payload.mode === 'confirm' ? (
                      <>
                        <TouchableOpacity
                          style={[styles.btn, styles.btnSecondary, styles.btnFlex]}
                          onPress={() => finishConfirm(false)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.btnSecondaryText}>
                            {payload.cancelText ?? 'Bekor qilish'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.btn,
                            payload.destructive ? styles.btnDanger : styles.btnPrimary,
                            styles.btnFlex,
                          ]}
                          onPress={() => finishConfirm(true)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.btnPrimaryText}>
                            {payload.confirmText ?? 'OK'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={[styles.btn, styles.btnPrimary, styles.btnAlertOk]}
                        onPress={finishAlert}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.btnPrimaryText}>
                          {payload.okText ?? 'OK'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cardWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    textAlign: 'center',
    paddingBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
    justifyContent: 'center',
  },
  actionsAlert: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  btn: {
    minHeight: 44,
    minWidth: 120,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFlex: {
    flex: 1,
  },
  btnAlertOk: {
    alignSelf: 'stretch',
    width: '100%',
  },
  btnSecondary: {
    backgroundColor: '#E5E5EA',
  },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  btnPrimary: {
    backgroundColor: '#007AFF',
  },
  btnDanger: {
    backgroundColor: '#FF3B30',
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
