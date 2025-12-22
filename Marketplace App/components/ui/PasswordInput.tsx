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
  showRules?: boolean;
}

const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  ({ label, error, containerStyle, style, showRules = false, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const password = (props.value as string) || '';

    const getPasswordStrength = () => {
      if (!password) return null;
      if (password.length >= 8 && /[0-9]/.test(password) && /[A-Za-z]/.test(password)) {
        return 'strong';
      }
      if (password.length >= 6) {
        return 'medium';
      }
      return 'weak';
    };

    const strength = getPasswordStrength();

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
        {showRules && (
          <View style={styles.rulesContainer}>
            <Text style={styles.rulesTitle}>Parol talablari:</Text>
            <View style={styles.rulesList}>
              <View style={styles.ruleItem}>
                <Ionicons 
                  name={password.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={16} 
                  color={password.length >= 8 ? '#10B981' : '#9CA3AF'} 
                />
                <Text style={[
                  styles.ruleText,
                  password.length >= 8 && styles.ruleTextActive
                ]}>
                  Kamida 8 ta belgi
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons 
                  name={/[0-9]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={16} 
                  color={/[0-9]/.test(password) ? '#10B981' : '#9CA3AF'} 
                />
                <Text style={[
                  styles.ruleText,
                  /[0-9]/.test(password) && styles.ruleTextActive
                ]}>
                  Kamida 1 ta raqam
                </Text>
              </View>
              <View style={styles.ruleItem}>
                <Ionicons 
                  name={/[A-Za-z]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={16} 
                  color={/[A-Za-z]/.test(password) ? '#10B981' : '#9CA3AF'} 
                />
                <Text style={[
                  styles.ruleText,
                  /[A-Za-z]/.test(password) && styles.ruleTextActive
                ]}>
                  Kamida 1 ta harf
                </Text>
              </View>
            </View>
          </View>
        )}
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
  rulesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rulesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  rulesList: {
    gap: 6,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  ruleTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
});

export default PasswordInput;







