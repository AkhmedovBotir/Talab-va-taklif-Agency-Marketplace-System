import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SnackbarVariant = 'success' | 'error' | 'info';

interface ShowSnackbarOptions {
  variant?: SnackbarVariant;
  /** ms, default 3800 */
  duration?: number;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface SnackbarContextValue {
  showSnackbar: (message: string, options?: ShowSnackbarOptions) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(undefined);

/** Web: eng yuqori qatlam (barcha kontent ustida) */
const snackModalRootWeb = {
  position: 'fixed' as const,
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  zIndex: 2147483647,
  elevation: 2147483647,
};

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return ctx;
}

interface SnackbarProviderProps {
  children: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const insets = useSafeAreaInsets();
  const [snack, setSnack] = useState<{
    message: string;
    variant: SnackbarVariant;
  } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmState, setConfirmState] = useState<
    | (ConfirmOptions & {
        confirmText: string;
        cancelText: string;
        destructive: boolean;
        resolve: (v: boolean) => void;
      })
    | null
  >(null);

  const hideSnackbar = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 24, duration: 200, useNativeDriver: true }),
    ]).start(() => setSnack(null));
  }, [opacity, translateY]);

  const showSnackbar = useCallback(
    (message: string, options?: ShowSnackbarOptions) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      const variant = options?.variant ?? 'info';
      const duration = options?.duration ?? 3800;
      setSnack({ message, variant });
      opacity.setValue(0);
      translateY.setValue(24);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
      hideTimer.current = setTimeout(hideSnackbar, duration);
    },
    [hideSnackbar, opacity, translateY]
  );

  const showConfirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        ...options,
        confirmText: options.confirmText ?? 'OK',
        cancelText: options.cancelText ?? 'Bekor qilish',
        destructive: options.destructive ?? false,
        resolve,
      });
    });
  }, []);

  const resolveConfirm = useCallback(
    (value: boolean) => {
      confirmState?.resolve(value);
      setConfirmState(null);
    },
    [confirmState]
  );

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  const bg: Record<SnackbarVariant, string> = {
    success: '#2e7d32',
    error: '#c62828',
    info: '#1a1a1a',
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar, showConfirm }}>
      {children}

      <Modal visible={confirmState != null} transparent animationType="fade" onRequestClose={() => resolveConfirm(false)}>
        <Pressable style={styles.confirmOverlay} onPress={() => resolveConfirm(false)}>
          <Pressable style={styles.confirmCard} onPress={(e) => e.stopPropagation()}>
            {confirmState ? (
              <>
                <Text style={styles.confirmTitle}>{confirmState.title}</Text>
                <Text style={styles.confirmBody}>{confirmState.message}</Text>
                <View style={styles.confirmActions}>
                  <TouchableOpacity style={styles.btnGhost} onPress={() => resolveConfirm(false)}>
                    <Text style={styles.btnGhostText}>{confirmState.cancelText}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.btnPrimary,
                      confirmState.destructive && styles.btnDestructive,
                    ]}
                    onPress={() => resolveConfirm(true)}
                  >
                    <Text style={styles.btnPrimaryText}>{confirmState.confirmText}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Alohida Modal — barcha ekran va boshqa Modal lar ustida */}
      <Modal
        visible={snack != null}
        transparent
        animationType="none"
        statusBarTranslucent
        presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
        onRequestClose={hideSnackbar}
      >
        <View
          style={[
            styles.snackModalRoot,
            Platform.OS === 'web' && snackModalRootWeb,
            { paddingBottom: Math.max(insets.bottom, 12) + 8 },
          ]}
          pointerEvents="box-none"
        >
          {snack ? (
            <Animated.View
              pointerEvents="box-none"
              style={[
                styles.snackOuter,
                {
                  opacity,
                  transform: [{ translateY }],
                },
              ]}
            >
              <View style={[styles.snackInner, { backgroundColor: bg[snack.variant] }]} pointerEvents="auto">
                <Text style={styles.snackMessage}>{snack.message}</Text>
                <TouchableOpacity onPress={hideSnackbar} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Text style={styles.snackAction}>Yopish</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </SnackbarContext.Provider>
  );
}

const styles = StyleSheet.create({
  snackModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  snackOuter: {
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
    zIndex: 2147483647,
    elevation: 2147483647,
  },
  snackInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    maxWidth: 560,
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  snackMessage: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  snackAction: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    width: '100%',
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  confirmBody: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 22,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  btnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  btnGhostText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  btnDestructive: {
    backgroundColor: '#FF3B30',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
