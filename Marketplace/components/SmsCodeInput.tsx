import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';

interface SmsCodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  onResend?: () => void;
  error?: string;
  resendDisabled?: boolean;
}

export default function SmsCodeInput({
  length = 5,
  onComplete,
  onResend,
  error,
  resendDisabled = false,
}: SmsCodeInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, []);

  const handleChange = (text: string, index: number) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length > 1) {
      // Paste handling
      const chars = numericText.slice(0, length).split('');
      const newCode = [...code];
      chars.forEach((char, i) => {
        if (index + i < length) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      
      // Focus next empty input or last input
      const nextIndex = Math.min(index + chars.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      
      // Check if complete
      const completeCode = newCode.join('');
      if (completeCode.length === length) {
        onComplete(completeCode);
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = numericText;
    setCode(newCode);

    // Move to next input if text entered
    if (numericText && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    const completeCode = newCode.join('');
    if (completeCode.length === length) {
      onComplete(completeCode);
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    // Select all text when focused
    inputRefs.current[index]?.setNativeProps({
      selection: { start: 0, end: code[index].length },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        {Array.from({ length }).map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            style={[
              styles.input,
              code[index] && styles.inputFilled,
              error && styles.inputError,
            ]}
            value={code[index]}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => handleFocus(index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            autoFocus={index === 0}
          />
        ))}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {onResend && (
        <TouchableOpacity
          onPress={onResend}
          disabled={resendDisabled}
          style={styles.resendButton}
        >
          <Text
            style={[
              styles.resendText,
              resendDisabled && styles.resendTextDisabled,
            ]}
          >
            Kodni qayta yuborish
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  input: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    backgroundColor: '#fff',
  },
  inputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
    textAlign: 'center',
  },
  resendButton: {
    marginTop: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: '#999',
  },
});







