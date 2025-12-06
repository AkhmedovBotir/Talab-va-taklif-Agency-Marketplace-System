import React, { forwardRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string;
  error?: string;
  containerStyle?: any;
}

const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  ({ label, error, containerStyle, style, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={styles.inputWrapper}>
          <TextInput
            ref={ref}
            style={[
              styles.input,
              error && styles.inputError,
              Platform.OS === 'ios' && styles.inputIOS,
              style,
            ]}
            placeholderTextColor="#999"
            secureTextEntry={!isVisible}
            {...props}
          />
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsVisible(!isVisible)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isVisible ? 'eye-off' : 'eye'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 50,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 48,
    color: '#333',
  },
  inputIOS: {
    paddingVertical: 14,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  iconButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -11 }],
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});

export default PasswordInput;







