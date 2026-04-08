import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export type SnackbarType = 'success' | 'error' | 'info';

interface AppSnackbarProps {
  visible: boolean;
  message: string;
  type?: SnackbarType;
  duration?: number;
  onHide: () => void;
}

export default function AppSnackbar({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}: AppSnackbarProps) {
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      onHide();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onHide, visible]);

  if (!visible || !message) return null;

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <View
        style={[
          styles.container,
          type === 'success' && styles.success,
          type === 'error' && styles.error,
          type === 'info' && styles.info,
        ]}
      >
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    zIndex: 999,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0px 2px 10px rgba(0,0,0,0.22)',
        } as any)
      : null),
  },
  success: {
    backgroundColor: '#1f9d55',
  },
  error: {
    backgroundColor: '#d64545',
  },
  info: {
    backgroundColor: '#2b6cb0',
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
