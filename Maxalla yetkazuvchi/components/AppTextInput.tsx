import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { INPUT_PLACEHOLDER_COLOR } from '../constants/input';

export function AppTextInput(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={props.placeholderTextColor ?? INPUT_PLACEHOLDER_COLOR}
    />
  );
}
