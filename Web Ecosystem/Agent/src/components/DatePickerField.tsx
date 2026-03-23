import React from 'react';
import styles from './DatePickerField.module.css';

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  min?: Date;
  max?: Date;
  placeholder?: string;
};

export function DatePickerField({ value, onChange, min, max, placeholder = 'Sana' }: Props) {
  const dateStr = value ? value.toISOString().split('T')[0] : '';
  const minStr = min ? min.toISOString().split('T')[0] : undefined;
  const maxStr = max ? max.toISOString().split('T')[0] : undefined;

  return (
    <input
      type="date"
      className={styles.input}
      value={dateStr}
      min={minStr}
      max={maxStr}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v ? new Date(v + 'T12:00:00') : null);
      }}
      placeholder={placeholder}
    />
  );
}
