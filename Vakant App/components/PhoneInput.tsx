import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface PhoneInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label?: string;
  value?: string;
  onChangeText: (phone: string) => void;
  error?: string;
}

export function PhoneInput({ label, value = '', onChangeText, error, ...props }: PhoneInputProps) {
  const formatPhone = (text: string): string => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');
    
    // Limit to 9 digits (Uzbekistan mobile number without country code)
    const limited = digits.slice(0, 9);
    
    // Format: XX XXX XX XX
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 5) {
      return `${limited.slice(0, 2)} ${limited.slice(2)}`;
    } else if (limited.length <= 7) {
      return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5)}`;
    } else {
      return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5, 7)} ${limited.slice(7)}`;
    }
  };

  const handleChange = (text: string) => {
    const formatted = formatPhone(text);
    onChangeText(formatted);
  };


  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputGroup, error && styles.inputGroupError]}>
        <View style={styles.prefixContainer}>
          <Text style={styles.prefix}>+998</Text>
        </View>
        <TextInput
          style={[styles.input, props.style]}
          value={value}
          onChangeText={handleChange}
          placeholder="XX XXX XX XX"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          maxLength={13} // 2 + space + 3 + space + 2 + space + 2 = 13
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937',
  },
  inputGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    alignItems: 'center',
  },
  inputGroupError: {
    borderColor: '#EF4444',
  },
  prefixContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});

