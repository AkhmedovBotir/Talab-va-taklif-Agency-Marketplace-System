import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';

interface CodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  error?: string;
}

export function CodeInput({ length = 5, onComplete, error }: CodeInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<TextInput[]>([]);

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length > 1) {
      // Handle paste
      const pasteText = numericText.slice(0, length - index);
      pasteText.split('').forEach((char, i) => {
        if (index + i < length) {
          newCode[index + i] = char;
        }
      });
    } else {
      newCode[index] = numericText;
    }

    setCode(newCode);

    // Move to next input
    if (numericText && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // Check if code is complete
    const fullCode = newCode.join('');
    if (fullCode.length === length) {
      onComplete(fullCode);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {Array(length)
          .fill(0)
          .map((_, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputsRef.current[index] = ref;
              }}
              style={[styles.input, error && styles.inputError]}
              value={code[index]}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  input: {
    flex: 1,
    height: 64,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: '#fff',
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 8,
    textAlign: 'center',
  },
});

