import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import SmsCodeInput from '../../components/SmsCodeInput';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

export default function SmsVerifyScreen() {
  const router = useRouter();
  const { phone, type, formData: formDataString } = useLocalSearchParams<{
    phone: string;
    type: 'login' | 'register' | 'forgot_password';
    formData?: string;
  }>();

  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyCode = async (code: string) => {
    setError('');
    setLoading(true);

    try {
      if (type === 'login') {
        const response = await apiService.loginStep2(phone || '', code);
        if (response.data) {
          await login(response.data.token, response.data.user);
          router.replace('/(tabs)');
        }
      } else if (type === 'register' && formDataString) {
        // Parse form data and complete registration
        const formData = JSON.parse(formDataString);
        const response = await apiService.registerStep2(
          formData.firstName,
          formData.lastName,
          phone || '',
          formData.gender,
          formData.viloyat,
          formData.tuman,
          formData.mfy,
          formData.birthDate,
          formData.password,
          code
        );

        if (response.data) {
          await login(response.data.token, response.data.user);
          router.replace('/(tabs)');
        }
      } else if (type === 'forgot_password') {
        // Navigate to reset password screen
        router.push({
          pathname: '/(auth)/reset-password',
          params: { phone, code },
        });
      }
    } catch (error: any) {
      setError(error.message || 'Kod noto\'g\'ri yoki muddati tugagan');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!phone || !type) return;

    try {
      await apiService.resendCode(phone, type as 'login' | 'register' | 'forgot_password');
      setError('');
      Alert.alert('Muvaffaqiyatli', 'Kod qayta yuborildi');
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Kod yuborishda xatolik yuz berdi');
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'login':
        return 'Kirish uchun tasdiqlash';
      case 'register':
        return 'Ro\'yxatdan o\'tish uchun tasdiqlash';
      case 'forgot_password':
        return 'Parolni tiklash';
      default:
        return 'Tasdiqlash kodi';
    }
  };

  const getSubtitle = () => {
    return `${phone} raqamiga yuborilgan 5 raqamli kodni kiriting`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>

        <SmsCodeInput
          length={5}
          onComplete={handleVerifyCode}
          onResend={handleResendCode}
          error={error}
          resendDisabled={loading}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Tekshirilmoqda...</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Orqaga</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    marginBottom: 48,
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  backButton: {
    marginTop: 32,
    alignSelf: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
});

