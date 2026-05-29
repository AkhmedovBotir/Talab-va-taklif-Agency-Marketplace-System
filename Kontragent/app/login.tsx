import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSnackbar } from '../components/AppSnackbar';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { show: showSnackbar } = useSnackbar();

  const formatPhoneNumber = (text: string): string => {
    const digits = text.replace(/\D/g, '');
    const limited = digits.slice(0, 9);

    let formatted = '';
    if (limited.length > 0) {
      formatted = limited.slice(0, 2);
    }
    if (limited.length > 2) {
      formatted += ' ' + limited.slice(2, 5);
    }
    if (limited.length > 5) {
      formatted += ' ' + limited.slice(5, 7);
    }
    if (limited.length > 7) {
      formatted += ' ' + limited.slice(7, 9);
    }
    return formatted;
  };

  const handlePhoneChange = (text: string) => {
    setPhone(formatPhoneNumber(text));
  };

  const getFullPhoneNumber = (): string => {
    return '+998' + phone.replace(/\s/g, '');
  };

  const validatePhone = (): boolean => {
    const digits = phone.replace(/\s/g, '');
    return digits.length === 9;
  };

  const handleLogin = async () => {
    if (!phone.trim()) {
      showSnackbar('Telefon raqami kiritilishi shart', { title: 'Xatolik', variant: 'error' });
      return;
    }

    if (!validatePhone()) {
      showSnackbar('Telefon raqami 9 ta raqamdan iborat bo\'lishi kerak', {
        title: 'Xatolik',
        variant: 'error',
      });
      return;
    }

    if (!password.trim()) {
      showSnackbar('Parol kiritilishi shart', { title: 'Xatolik', variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await login(getFullPhoneNumber(), password);
      router.replace('/(tabs)/');
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      const statusCode = err.status || 0;
      let finalErrorMessage = 'Kirishda xatolik yuz berdi';

      if (statusCode === 401) {
        finalErrorMessage = 'Telefon raqami yoki parol noto\'g\'ri';
      } else if (statusCode === 403) {
        finalErrorMessage = err.message || 'Hisob faol emas yoki parol hali o\'rnatilmagan';
      } else if (statusCode === 400) {
        finalErrorMessage = err.message || 'Ma\'lumotlar noto\'g\'ri';
      } else if (err.message) {
        finalErrorMessage = err.message;
      }

      showSnackbar(finalErrorMessage, { title: 'Xatolik', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="business" size={64} color="#007AFF" />
              </View>
              <Text style={styles.title}>Kontragent</Text>
              <Text style={styles.subtitle}>Tizimga kirish</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Telefon raqami</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <Text style={styles.phonePrefix}>+998</Text>
                    <View style={styles.phoneDivider} />
                    <TextInput
                      style={styles.input}
                      placeholder="90 123 45 67"
                      placeholderTextColor="#999"
                      value={phone}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      editable={!loading}
                      maxLength={12}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Parol</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Parolni kiriting"
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      editable={!loading}
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                      disabled={loading}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
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
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Kirish</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>yoki</Text>
                  <View style={styles.divider} />
                </View>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push('/password-setup/step1')}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="lock-open-outline" size={20} color="#007AFF" style={styles.secondaryButtonIcon} />
                  <Text style={styles.secondaryButtonText}>Birinchi marta parol o&apos;rnatish</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  phoneDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  passwordInput: {
    paddingRight: 8,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    flexDirection: 'row',
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
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#007AFF',
  },
  secondaryButtonIcon: {
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
