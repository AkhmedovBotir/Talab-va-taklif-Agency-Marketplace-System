import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Input } from './Input';
import { DatePicker } from './DatePicker';
import { Question } from '@/services/vacancyApi';

interface QuestionInputProps {
  question: Question;
  value?: any;
  onChange: (value: any) => void;
  error?: string;
}

export function QuestionInput({ question, value, onChange, error }: QuestionInputProps) {
  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  switch (question.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <Input
          value={value || ''}
          onChangeText={handleChange}
          placeholder={question.placeholder}
          keyboardType={
            question.type === 'email'
              ? 'email-address'
              : question.type === 'phone'
              ? 'phone-pad'
              : 'default'
          }
          error={error}
          autoCapitalize={question.type === 'email' ? 'none' : 'sentences'}
        />
      );

    case 'textarea':
      return (
        <Input
          value={value || ''}
          onChangeText={handleChange}
          placeholder={question.placeholder}
          multiline
          numberOfLines={4}
          style={styles.textarea}
          error={error}
        />
      );

    case 'number':
      return (
        <Input
          value={value?.toString() || ''}
          onChangeText={(text) => handleChange(text ? Number(text) : '')}
          placeholder={question.placeholder}
          keyboardType="numeric"
          error={error}
        />
      );

    case 'date':
      return (
        <DatePicker
          value={value || ''}
          onChangeText={handleChange}
          placeholder={question.placeholder}
          error={error}
        />
      );

    case 'select':
    case 'radio':
      return (
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                value === option && styles.optionSelected,
              ]}
              onPress={() => handleChange(option)}
            >
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radio,
                    value === option && styles.radioSelected,
                  ]}
                >
                  {value === option && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    value === option && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );

    case 'checkbox':
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const isSelected = selectedValues.includes(option);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  isSelected && styles.optionSelected,
                ]}
                onPress={() => {
                  const newValues = isSelected
                    ? selectedValues.filter((v) => v !== option)
                    : [...selectedValues, option];
                  handleChange(newValues);
                }}
              >
                <View style={styles.checkboxContainer}>
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}
                  >
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );

    default:
      return (
        <Input
          value={value || ''}
          onChangeText={handleChange}
          placeholder={question.placeholder}
          error={error}
        />
      );
  }
}

const styles = StyleSheet.create({
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  optionSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#111827',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 8,
  },
});




