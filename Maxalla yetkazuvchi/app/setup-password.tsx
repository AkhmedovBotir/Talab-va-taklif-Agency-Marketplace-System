import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPhoneForApi, formatPhoneNumber } from '../utils/phoneFormatter';
import { apiService } from '../services/api';
import { AppTextInput } from '../components/AppTextInput';
import { useSnackbar } from '../components/SnackbarProvider';

type Step = 'phone' | 'verify' | 'password';

export default function SetupPasswordScreen() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const apiPhone = formatPhoneForApi(phone);

  const handlePhoneChange = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 9) {
      setPhone(formatPhoneNumber(numbers));
    }
  };

  const submitSendCode = async () => {
    if (apiPhone.length < 13) {
      showSnackbar('Telefon raqam to\'liq emas', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiService.sendCode(apiPhone);
      showSnackbar('Tasdiqlash kodi yuborildi', 'success');
      setStep('verify');
    } catch (error: any) {
      showSnackbar(error.message || 'Kod yuborishda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitVerifyCode = async () => {
    if (code.length < 5) {
      showSnackbar('5 xonali kod kiriting', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiService.verifyCode({ phone: apiPhone, code });
      showSnackbar('Kod tasdiqlandi', 'success');
      setStep('password');
    } catch (error: any) {
      showSnackbar(error.message || 'Kod noto\'g\'ri', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitResend = async () => {
    setLoading(true);
    try {
      await apiService.resendCode(apiPhone);
      showSnackbar('Kod qayta yuborildi', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Qayta yuborishda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitSetPassword = async () => {
    if (password.trim().length < 6) {
      showSnackbar('Parol kamida 6 belgi bo\'lishi kerak', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiService.setPassword(apiPhone, password.trim());
      showSnackbar('Parol o\'rnatildi. Endi tizimga kiring.', 'success');
      router.replace('/login');
    } catch (error: any) {
      showSnackbar(error.message || 'Parol o\'rnatishda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Parol o&apos;rnatish</Text>
          <Text style={styles.subtitle}>Yetkazib beruvchi hisobi uchun</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefon</Text>
            <View style={styles.phoneInputGroup}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+998</Text>
              </View>
              <AppTextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={13}
                editable={!loading || step === 'phone'}
                placeholder="90 123 45 67"
              />
            </View>
          </View>

          {step !== 'phone' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kod</Text>
              <AppTextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={5}
                editable={!loading}
                placeholder="12345"
              />
            </View>
          )}

          {step === 'password' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Yangi parol</Text>
              <View style={styles.passwordInputGroup}>
                <AppTextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                  placeholder="Kamida 6 belgi"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.disabled]}
            onPress={step === 'phone' ? submitSendCode : step === 'verify' ? submitVerifyCode : submitSetPassword}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>
              {step === 'phone' ? 'Kod yuborish' : step === 'verify' ? 'Kodni tekshirish' : 'Parolni saqlash'}
            </Text>}
          </TouchableOpacity>

          {step === 'verify' && (
            <TouchableOpacity onPress={submitResend} disabled={loading} style={styles.linkButton}>
              <Text style={styles.linkText}>Kodni qayta yuborish</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => router.replace('/login')} style={styles.linkButton}>
            <Text style={styles.linkText}>Login sahifasiga qaytish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', textAlign: 'center' },
  subtitle: { marginTop: 6, marginBottom: 22, textAlign: 'center', color: '#6B7280' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  passwordInputGroup: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  eyeButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneInputGroup: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  countryCode: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: '#E5E7EB',
  },
  countryCodeText: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  phoneInput: { flex: 1, padding: 14, fontSize: 16 },
  button: {
    marginTop: 6,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.6 },
  linkButton: { marginTop: 14, alignItems: 'center' },
  linkText: { color: '#007AFF', fontWeight: '600' },
});
