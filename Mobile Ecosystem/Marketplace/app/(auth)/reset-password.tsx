import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import SmsCodeInput from '../../components/SmsCodeInput';
import apiService from '../../services/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { phone, code: initialCode } = useLocalSearchParams<{
    phone: string;
    code?: string;
  }>();

  const [code, setCode] = useState(initialCode || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    code?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [step, setStep] = useState<'code' | 'password'>(initialCode ? 'password' : 'code');

  const passwordRef = useRef<any>(null);
  const confirmPasswordRef = useRef<any>(null);

  const handleVerifyCode = async (verifiedCode: string) => {
    setCode(verifiedCode);
    setStep('password');
  };

  const handleResendCode = async () => {
    try {
      await apiService.resendCode(phone || '', 'forgot_password');
      Alert.alert('Muvaffaqiyatli', 'Kod qayta yuborildi');
    } catch (error: any) {
      Alert.alert('Xatolik', error.message);
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!newPassword || newPassword.length < 6) {
      newErrors.password = 'Parol kamida 6 belgi bo\'lishi kerak';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmaydi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    Keyboard.dismiss();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await apiService.forgotPasswordStep2(phone || '', code, newPassword);
      Alert.alert('Muvaffaqiyatli', 'Parol muvaffaqiyatli yangilandi', [
        {
          text: 'Kirish',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Parolni yangilashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'code') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Tasdiqlash kodi</Text>
          <Text style={styles.subtitle}>
            {phone} raqamiga yuborilgan 5 raqamli kodni kiriting
          </Text>

          <SmsCodeInput
            length={5}
            onComplete={handleVerifyCode}
            onResend={handleResendCode}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Yangi parol</Text>
          <Text style={styles.subtitle}>
            Yangi parolingizni kiriting
          </Text>

          <View style={styles.form}>
            <Input
              label="Yangi parol"
              placeholder="Yangi parol (kamida 6 belgi)"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              error={errors.password}
              secureTextEntry
              ref={passwordRef}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Input
              ref={confirmPasswordRef}
              label="Parolni tasdiqlash"
              placeholder="Parolni qayta kiriting"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              error={errors.confirmPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
            />

            <Button
              title="Parolni yangilash"
              onPress={handleResetPassword}
              loading={loading}
              style={styles.button}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: 8,
  },
});







