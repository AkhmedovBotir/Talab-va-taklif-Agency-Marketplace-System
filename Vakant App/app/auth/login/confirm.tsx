import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CodeInput } from '@/components/CodeInput';
import { Button } from '@/components/Button';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginConfirmScreen() {
  const { phone, password } = useLocalSearchParams<{ phone: string; password: string }>();
  const { login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeComplete = async (code: string) => {
    if (!phone) {
      router.back();
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      const { token, applicant } = await apiService.loginConfirm(phone, code);
      await login(token, applicant);
      router.replace('/(tabs)/vacancies');
    } catch (err: any) {
      setError(err.message || 'Noto\'g\'ri kod');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !phone || !password) return;
    
    setResendLoading(true);
    setError('');
    try {
      await apiService.resendCode(phone, 'login', password);
      setCountdown(60);
      Alert.alert('Muvaffaqiyatli', 'Kod qayta yuborildi');
    } catch (err: any) {
      setError(err.message || 'Kod yuborishda xatolik');
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
              <Text style={styles.title}>Tasdiqlash kodi</Text>
              <Text style={styles.subtitle}>
                {phone} raqamiga yuborilgan kodni kiriting
              </Text>
            </View>

            <View style={styles.form}>
              <CodeInput
                length={5}
                onComplete={handleCodeComplete}
                error={error}
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
