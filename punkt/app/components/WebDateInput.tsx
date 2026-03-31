import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

// Web-only: HTML5 date input. On native this component renders nothing.
export interface WebDateInputProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
  style?: object;
}

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function WebDateInput({
  value,
  onChange,
  minimumDate,
  maximumDate,
  style,
}: WebDateInputProps) {
  if (Platform.OS !== 'web') {
    return null;
  }

  const valueStr = value ? toYYYYMMDD(value) : '';
  const minStr = minimumDate ? toYYYYMMDD(minimumDate) : undefined;
  const maxStr = maximumDate ? toYYYYMMDD(maximumDate) : undefined;

  const handleChange = (e: { target: { value: string } }) => {
    const v = e.target.value;
    if (!v) {
      onChange(null);
      return;
    }
    const date = new Date(v);
    if (!Number.isNaN(date.getTime())) {
      onChange(date);
    }
  };

  const inputStyle: Record<string, unknown> = {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFF',
    ...(style as Record<string, unknown>),
  };

  return (
    <View style={styles.container}>
      {/* @ts-expect-error - web-only HTML input for date */}
      <input
        type="date"
        value={valueStr}
        onChange={handleChange}
        min={minStr}
        max={maxStr}
        style={inputStyle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
