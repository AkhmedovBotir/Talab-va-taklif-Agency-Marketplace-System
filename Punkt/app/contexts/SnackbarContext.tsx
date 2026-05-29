import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setApiErrorNotifier } from '../services/api';

export type SnackbarVariant = 'error' | 'success' | 'info';

interface SnackbarContextValue {
  showSnackbar: (
    message: string,
    variant?: SnackbarVariant,
    durationMs?: number
  ) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(
  undefined
);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [variant, setVariant] = useState<SnackbarVariant>('info');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 20,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [opacity, translateY]);

  const showSnackbar = useCallback(
    (msg: string, v: SnackbarVariant = 'info', durationMs = 4800) => {
      const trimmed = msg?.trim();
      if (!trimmed) return;

      if (hideTimer.current) clearTimeout(hideTimer.current);

      setMessage(trimmed);
      setVariant(v);
      setVisible(true);
      opacity.setValue(0);
      translateY.setValue(20);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      hideTimer.current = setTimeout(hide, durationMs);
    },
    [hide, opacity, translateY]
  );

  useEffect(() => {
    setApiErrorNotifier((apiMessage, status) => {
      const isError = status === 0 || status >= 400;
      showSnackbar(apiMessage, isError ? 'error' : 'info');
    });
    return () => setApiErrorNotifier(null);
  }, [showSnackbar]);

  const accent =
    variant === 'error'
      ? '#FF453A'
      : variant === 'success'
        ? '#32D74B'
        : '#0A84FF';

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {visible ? (
        <View
          style={[styles.layer, { paddingBottom: Math.max(insets.bottom, 12) }]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={{
              opacity,
              transform: [{ translateY }],
              width: '100%',
              maxWidth: 560,
              alignSelf: 'center',
              paddingHorizontal: 16,
            }}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={hide}
              style={[styles.bar, { borderLeftColor: accent }]}
              accessibilityRole="alert"
            >
              <Text style={styles.text}>{message}</Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    elevation: 999,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  bar: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 8px 28px rgba(0,0,0,0.4)' } as object)
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
        }),
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
});
