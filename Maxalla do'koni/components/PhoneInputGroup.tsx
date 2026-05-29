import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { formatUzPhoneInput } from '../utils/phone';

interface PhoneInputGroupProps {
  value: string;
  onChangeText: (formattedLocal: string) => void;
  editable?: boolean;
  placeholder?: string;
  inputProps?: Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType' | 'maxLength'>;
}

export default function PhoneInputGroup({
  value,
  onChangeText,
  editable = true,
  placeholder = '90 123 45 67',
  inputProps,
}: PhoneInputGroupProps) {
  const handleChange = (text: string) => {
    onChangeText(formatUzPhoneInput(text));
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.prefix}>+998</Text>
      <View style={styles.divider} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={handleChange}
        keyboardType="phone-pad"
        editable={editable}
        maxLength={12}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    minHeight: 48,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
});
