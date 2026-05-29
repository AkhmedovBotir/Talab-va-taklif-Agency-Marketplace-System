import React, { RefObject } from 'react';
import { TextInput, View } from 'react-native';
import { authScreenStyles } from '../utils/authLayout';
import { useAuthResponsiveStyles } from '../utils/useAuthResponsiveStyles';

interface AuthCodeInputsProps {
  code: string[];
  loading?: boolean;
  inputRefs: RefObject<(TextInput | null)[]>;
  onChange: (index: number, value: string) => void;
  onKeyPress: (index: number, key: string) => void;
  large?: boolean;
}

export default function AuthCodeInputs({
  code,
  loading = false,
  inputRefs,
  onChange,
  onKeyPress,
  large = false,
}: AuthCodeInputsProps) {
  const responsive = useAuthResponsiveStyles();

  return (
    <View style={[authScreenStyles.codeInputs, responsive.codeInputsExtra]}>
      {code.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          style={[
            authScreenStyles.codeInput,
            responsive.codeInputExtra,
            large && authScreenStyles.codeInputLarge,
            large && responsive.codeInputLargeExtra,
            digit !== '' && authScreenStyles.codeInputFilled,
          ]}
          value={digit}
          onChangeText={(value) => onChange(index, value)}
          onKeyPress={({ nativeEvent }) => onKeyPress(index, nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={1}
          editable={!loading}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}
