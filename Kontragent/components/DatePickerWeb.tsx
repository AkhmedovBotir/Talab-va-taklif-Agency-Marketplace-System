import React, { useEffect, useRef } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface DatePickerWebProps {
  visible: boolean;
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  title: string;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

export function DatePickerWeb({
  visible,
  value,
  minimumDate,
  maximumDate,
  title,
  onConfirm,
  onClose
}: DatePickerWebProps) {
  const containerRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible || typeof document === 'undefined') return;
    const el = containerRef.current as HTMLElement | null;
    if (!el) return;
    const input = document.createElement('input');
    input.type = 'date';
    input.value = toInputDate(value);
    if (minimumDate) input.min = toInputDate(minimumDate);
    if (maximumDate) input.max = toInputDate(maximumDate);
    input.style.width = '100%';
    input.style.padding = '12px';
    input.style.fontSize = '16px';
    input.style.borderWidth = '1px';
    input.style.borderColor = '#d0d0d0';
    input.style.borderRadius = '8px';
    input.style.marginTop = '8px';
    inputRef.current = input;
    el.appendChild(input);
    const handler = () => {
      const v = input.value;
      if (v) onConfirm(new Date(v + 'T12:00:00'));
    };
    input.addEventListener('change', handler);
    return () => {
      input.removeEventListener('change', handler);
      input.remove();
      inputRef.current = null;
    };
  }, [visible, value, minimumDate, maximumDate, onConfirm]);

  if (Platform.OS !== 'web' || !visible) return null;

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.done}>Tayyor</Text>
            </TouchableOpacity>
          </View>
          <View ref={containerRef} style={styles.inputWrap} collapsable={false} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minWidth: 280,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  done: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  inputWrap: {
    minHeight: 44,
    marginTop: 8,
  },
});
