import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeliveryProviderAuth } from '../contexts/DeliveryProviderAuthContext';
import { formatPhoneNumber, formatPhoneForApi } from '../utils/phoneFormatter';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useDeliveryProviderAuth();
  const router = useRouter();

  const handlePhoneChange = (text: string) => {
    // Faqat raqamlarni qabul qilish
    const numbers = text.replace(/\D/g, '');
    // Maksimal 9 ta raqam (+998 dan keyin)
    if (numbers.length <= 9) {
      setPhone(formatPhoneNumber(numbers));
    }
  };

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Xatolik', 'Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }

    // Telefon raqamni API formatiga o'tkazish
    const formattedPhone = formatPhoneForApi(phone);
    
    if (formattedPhone.length < 13) {
      Alert.alert('Xatolik', 'Telefon raqam to\'liq emas');
      return;
    }

    setLoading(true);
    try {
      await login(formattedPhone, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login xatosi', error.message || 'Telefon raqami yoki parol noto\'g\'ri');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Yetkazib Beruvchi</Text>
          <Text style={styles.subtitle}>Tizimga kirish</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefon raqami</Text>
              <View style={styles.phoneInputGroup}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+998</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="90 123 45 67"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  editable={!loading}
                  maxLength={13} // 90 123 45 67 = 13 belgi (bo'shliqlar bilan)
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Parol</Text>
              <View style={styles.passwordInputGroup}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Parolni kiriting"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
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

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Kirish</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1A1A1A',
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
    paddingVertical: 16,
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: '#E5E7EB',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1A1A1A',
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
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  eyeButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
