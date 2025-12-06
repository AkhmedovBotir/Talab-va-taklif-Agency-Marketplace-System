import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/Input';
import { CodeInput } from '@/components/CodeInput';
import { Button } from '@/components/Button';
import { apiService } from '@/services/api';

export default function ForgotPasswordConfirmScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeComplete = (completeCode: string) => {
    setCode(completeCode);
    if (errors.code) {
      setErrors({ ...errors, code: '' });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!code || code.length !== 5) {
      newErrors.code = 'Kodni kiriting';
    }
    if (!newPassword) {
      newErrors.newPassword = 'Yangi parolni kiriting';
    }
    if (newPassword.length < 6) {
      newErrors.newPassword = 'Parol kamida 6 ta belgi bo\'lishi kerak';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmadi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !phone) return;

    setLoading(true);
    try {
      await apiService.forgotPasswordConfirm(phone, code, newPassword);
      Alert.alert('Muvaffaqiyatli', 'Parol muvaffaqiyatli yangilandi', [
        {
          text: 'OK',
          onPress: () => router.replace('/auth/login'),
        },
      ]);
    } catch (err: any) {
      setErrors({ code: err.message || 'Xatolik yuz berdi' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !phone) return;
    
    setResendLoading(true);
    try {
      await apiService.resendCode(phone, 'forgot_password');
      setCountdown(60);
      Alert.alert('Muvaffaqiyatli', 'Kod qayta yuborildi');
    } catch (err: any) {
      Alert.alert('Xatolik', err.message || 'Kod yuborishda xatolik');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Yangi parol</Text>
              <Text style={styles.subtitle}>
                {phone} raqamiga yuborilgan kodni kiriting va yangi parol o'rnating
              </Text>
            </View>

            <View style={styles.form}>
              <CodeInput
                length={5}
                onComplete={handleCodeComplete}
                error={errors.code}
              />

              <Input
                label="Yangi parol"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                showPasswordToggle
                error={errors.newPassword}
                placeholder="Yangi parolingizni kiriting"
              />

              <Input
                label="Parolni tasdiqlash"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                showPasswordToggle
                error={errors.confirmPassword}
                placeholder="Parolni qayta kiriting"
              />

              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Kod kelmadimi? </Text>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </Text>
                ) : (
                  <Text
                    style={styles.resendLink}
                    onPress={handleResend}
                  >
                    Qayta yuborish
                  </Text>
                )}
              </View>

              <Button
                title="Parolni yangilash"
                onPress={handleSubmit}
                loading={loading}
                style={{ marginTop: 8 }}
              />

              <Button
                title="Orqaga"
                onPress={() => router.back()}
                variant="outline"
                style={{ marginTop: 16 }}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: 0,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  countdownText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
