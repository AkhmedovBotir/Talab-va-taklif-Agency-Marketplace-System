import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarContextType {
  showSnackbar: (message: string, type?: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

interface SnackbarProviderProps {
  children: ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SnackbarType>('info');
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideSnackbar = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  }, [opacity]);

  const showSnackbar = useCallback(
    (text: string, snackbarType: SnackbarType = 'info') => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setMessage(text);
      setType(snackbarType);
      setVisible(true);

      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();

      timerRef.current = setTimeout(() => {
        hideSnackbar();
      }, 3000);
    },
    [hideSnackbar, opacity]
  );

  const contextValue = useMemo(() => ({ showSnackbar }), [showSnackbar]);

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}
      {visible && (
        <Animated.View style={[styles.wrapper, { opacity }]}>
          <View style={[styles.container, styles[type]]}>
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity onPress={hideSnackbar}>
              <Text style={styles.close}>Yopish</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  container: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  close: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  success: {
    backgroundColor: '#22C55E',
  },
  error: {
    backgroundColor: '#EF4444',
  },
  info: {
    backgroundColor: '#2563EB',
  },
});
