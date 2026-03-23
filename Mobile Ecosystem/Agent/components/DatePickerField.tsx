import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

type Props = {
  value: Date | null;
  onChange: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  visible: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
};

/**
 * Cross-platform date picker: native DateTimePicker on iOS/Android,
 * HTML <input type="date"> on web (same behavior as mobile).
 */
export function DatePickerField({
  value,
  onChange,
  visible,
  minimumDate,
  maximumDate,
}: Props) {
  if (Platform.OS === 'web') {
    const dateValue = value ? value.toISOString().split('T')[0] : '';
    const min = minimumDate ? minimumDate.toISOString().split('T')[0] : undefined;
    const max = maximumDate ? maximumDate.toISOString().split('T')[0] : undefined;
    return (
      <View style={styles.webWrapper}>
        <input
          type="date"
          value={dateValue}
          min={min}
          max={max}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ type: 'set' }, v ? new Date(v + 'T12:00:00') : undefined);
          }}
          style={styles.webInput as object}
        />
      </View>
    );
  }

  if (!visible) return null;
  return (
    <DateTimePicker
      value={value || new Date()}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={onChange}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
    />
  );
}

const styles = StyleSheet.create({
  webWrapper: {
    marginVertical: 4,
  },
  webInput: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
    minWidth: 140,
  },
});
