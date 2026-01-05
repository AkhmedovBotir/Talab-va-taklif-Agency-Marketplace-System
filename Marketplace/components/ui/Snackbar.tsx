import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: SnackbarType;
  duration?: number;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export default function Snackbar({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  action,
}: SnackbarProps) {
  const insets = useSafeAreaInsets();
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      if (duration > 0 && !action) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, duration, action]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  };

  if (!visible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#34C759',
          icon: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          backgroundColor: '#FF3B30',
          icon: 'close-circle' as const,
        };
      case 'warning':
        return {
          backgroundColor: '#FF9500',
          icon: 'warning' as const,
        };
      default:
        return {
          backgroundColor: '#007AFF',
          icon: 'information-circle' as const,
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.snackbar, { backgroundColor: typeStyles.backgroundColor }]}>
        <Ionicons name={typeStyles.icon} size={24} color="#fff" />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        {action ? (
          <TouchableOpacity onPress={action.onPress} style={styles.actionButton}>
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 20,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
});




