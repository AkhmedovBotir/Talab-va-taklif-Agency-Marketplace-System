import React, { forwardRef, useState, useEffect } from 'react';
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

interface PhoneInputProps extends Omit<TextInputProps, 'onChangeText' | 'value'> {
  label?: string;
  error?: string;
  containerStyle?: any;
  value?: string;
  onChangeText?: (text: string) => void;
}

const PhoneInput = forwardRef<TextInput, PhoneInputProps>(
  ({ label, error, containerStyle, style, value = '', onChangeText, ...props }, ref) => {
    const [formattedValue, setFormattedValue] = useState('');

    useEffect(() => {
      // Remove +998 prefix if exists and format phone number to XX XXX XX XX
      let cleaned = value.replace(/\D/g, '');
      
      // If starts with 998, remove it
      if (cleaned.startsWith('998')) {
        cleaned = cleaned.substring(3);
      }
      
      let formatted = '';
      
      if (cleaned.length > 0) {
        formatted = cleaned.substring(0, 2);
      }
      if (cleaned.length > 2) {
        formatted += ' ' + cleaned.substring(2, 5);
      }
      if (cleaned.length > 5) {
        formatted += ' ' + cleaned.substring(5, 7);
      }
      if (cleaned.length > 7) {
        formatted += ' ' + cleaned.substring(7, 9);
      }
      
      setFormattedValue(formatted);
    }, [value]);

    const handleChangeText = (text: string) => {
      // Remove all non-digits except spaces
      const cleaned = text.replace(/\D/g, '');
      
      // Limit to 9 digits (after +998)
      if (cleaned.length <= 9) {
        onChangeText?.(cleaned);
      }
    };

    const getFullPhone = () => {
      const cleaned = value.replace(/\D/g, '');
      return cleaned.length === 9 ? `+998${cleaned}` : '';
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={styles.inputGroup}>
          <View style={styles.prefixContainer}>
            <Text style={styles.prefix}>+998</Text>
          </View>
          <TextInput
            ref={ref}
            style={[
              styles.input,
              error && styles.inputError,
              Platform.OS === 'ios' && styles.inputIOS,
              style,
            ]}
            placeholderTextColor="#999"
            placeholder="XX XXX XX XX"
            value={formattedValue}
            onChangeText={handleChangeText}
            keyboardType="phone-pad"
            maxLength={13} // 2 + space + 3 + space + 2 + space + 2 = 13
            {...props}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

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
  inputGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    minHeight: 48,
  },
  prefixContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputIOS: {
    paddingVertical: 14,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});

export default PhoneInput;

