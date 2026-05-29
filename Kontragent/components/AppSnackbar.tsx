import { Ionicons } from '@expo/vector-icons';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SnackbarVariant = 'error' | 'success' | 'info';

const DEFAULT_DURATION_MS = 5000;

export type ShowSnackbarOptions = {
  title?: string;
  variant?: SnackbarVariant;
  /**
   * Default: 5000 ms (barcha variantlar).
   * 0 — faqat yopish tugmasi bilan.
   */
  durationMs?: number;
  /** Yopilganda yoki vaqt tugaganda (bir marta) */
  onDismiss?: () => void;
};

type Payload = {
  title?: string;
  message: string;
  variant: SnackbarVariant;
  durationMs: number;
  onDismiss?: () => void;
};

type SnackbarContextValue = {
  show: (message: string, options?: ShowSnackbarOptions) => void;
  dismiss: () => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

const variantStyles = {
  error: {
    bg: '#2D1216',
    border: '#E84545',
    icon: 'alert-circle' as const,
    iconColor: '#FF8A8A',
    closeColor: '#FFC9C9',
  },
  success: {
    bg: '#0F2418',
    border: '#34C759',
    icon: 'checkmark-circle' as const,
    iconColor: '#7AE3A0',
    closeColor: '#C8F5D8',
  },
  info: {
    bg: '#141E2E',
    border: '#5AC8FA',
    icon: 'information-circle' as const,
    iconColor: '#8FD4FF',
    closeColor: '#C5E5FF',
  },
};

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPayload((current) => {
      if (current?.onDismiss) {
        current.onDismiss();
      }
      return null;
    });
  }, []);

  const show = useCallback((message: string, options?: ShowSnackbarOptions) => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const variant = options?.variant ?? 'info';
    const durationMs =
      options?.durationMs !== undefined ? options.durationMs : DEFAULT_DURATION_MS;

    const next: Payload = {
      message,
      title: options?.title,
      variant,
      durationMs,
      onDismiss: options?.onDismiss,
    };

    setPayload(next);

    if (durationMs > 0) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setPayload((current) => {
          if (current?.onDismiss) {
            current.onDismiss();
          }
          return null;
        });
      }, durationMs);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {payload ? <AppSnackbarView payload={payload} onClose={dismiss} /> : null}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error('useSnackbar: SnackbarProvider rootda bo‘lishi kerak');
  }
  return ctx;
}

function AppSnackbarView({
  payload,
  onClose,
}: {
  payload: Payload;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colors = variantStyles[payload.variant];
  const isWideWeb = Platform.OS === 'web' && width >= 960;
  const maxBarWidth = Math.min(isWideWeb ? 560 : 480, width - 32);

  return (
    <View
      style={[
        styles.host,
        {
          paddingBottom: Math.max(insets.bottom, 12),
          paddingHorizontal: 16,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.snackbar,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            width: maxBarWidth,
            alignSelf: 'center',
          },
        ]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name={colors.icon} size={22} color={colors.iconColor} />
        </View>
        <View style={styles.textWrap}>
          {payload.title ? (
            <Text style={styles.titleText} numberOfLines={2}>
              {payload.title}
            </Text>
          ) : null}
          <Text style={styles.messageText} numberOfLines={8}>
            {payload.message}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Yopish"
        >
          <Ionicons name="close" size={22} color={colors.closeColor} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
    zIndex: 99999,
    elevation: 99999,
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 6,
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 16,
      },
    }),
  },
  iconWrap: {
    marginTop: 2,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    lineHeight: 20,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    marginTop: -2,
  },
  closeBtnPressed: {
    opacity: 0.75,
  },
});
