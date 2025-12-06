import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export function Input({ label, error, style, showPasswordToggle = false, secureTextEntry, ...props }: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isSecure = secureTextEntry && !isPasswordVisible;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            showPasswordToggle && styles.inputWithIcon,
            style,
          ]}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isSecure}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
        )}
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
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1F2937',
  },
  inputWithIcon: {
    paddingRight: 45,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  iconContainer: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});
