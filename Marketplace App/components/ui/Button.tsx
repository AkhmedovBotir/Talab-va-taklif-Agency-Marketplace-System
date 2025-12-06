import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

export default function Button({
  title,
  loading = false,
  variant = 'primary',
  size = 'medium',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
        styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#007AFF' : '#fff'} />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`text${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
            styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`],
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  buttonMedium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  buttonLarge: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
  textPrimary: {
    color: '#fff',
  },
  textSecondary: {
    color: '#fff',
  },
  textOutline: {
    color: '#007AFF',
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
});







