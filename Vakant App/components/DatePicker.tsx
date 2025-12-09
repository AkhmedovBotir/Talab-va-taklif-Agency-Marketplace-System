import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerProps {
  label?: string;
  value?: string;
  onChangeText: (date: string) => void;
  error?: string;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

export function DatePicker({
  label,
  value,
  onChangeText,
  error,
  placeholder = 'YYYY-MM-DD',
  maximumDate,
  minimumDate,
}: DatePickerProps) {
  const [show, setShow] = useState(false);
  const [date, setDate] = useState<Date>(() => {
    if (value) {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date(2000, 0, 1); // Default: 2000-01-01
  });

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (selectedDate) {
      setDate(selectedDate);
      const formatted = formatDate(selectedDate);
      onChangeText(formatted);
    }
  };

  const displayValue = value || '';

  if (Platform.OS === 'android') {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TouchableOpacity
          style={[styles.inputContainer, error && styles.inputError]}
          onPress={() => setShow(true)}
        >
          <TextInput
            style={styles.input}
            value={displayValue}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            editable={false}
            pointerEvents="none"
          />
          <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.icon} />
        </TouchableOpacity>
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        {show && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
          />
        )}
      </View>
    );
  }

  // iOS
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.inputContainer, error && styles.inputError]}
        onPress={() => setShow(true)}
      >
        <TextInput
          style={styles.input}
          value={displayValue}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          editable={false}
          pointerEvents="none"
        />
        <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.icon} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Modal
        visible={show}
        transparent
        animationType="slide"
        onRequestClose={() => setShow(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShow(false)}>
                <Text style={styles.modalCancel}>Bekor qilish</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Sana tanlang</Text>
              <TouchableOpacity
                onPress={() => {
                  const formatted = formatDate(date);
                  onChangeText(formatted);
                  setShow(false);
                }}
              >
                <Text style={styles.modalDone}>Tayyor</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              style={styles.picker}
            />
          </View>
        </View>
      </Modal>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  icon: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalDone: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  picker: {
    height: 200,
  },
});




