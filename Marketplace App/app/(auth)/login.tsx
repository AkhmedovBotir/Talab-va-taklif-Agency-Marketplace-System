import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import PhoneInput from '../../components/ui/PhoneInput';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const { phone: phoneParam } = useLocalSearchParams<{ phone?: string }>();
  const { login } = useAuth();
  
  // Extract 9 digits from phone if it includes +998
  const getPhoneDigits = (phoneStr?: string) => {
    if (!phoneStr) return '';
    const cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.startsWith('998') && cleaned.length === 12) {
      return cleaned.substring(3);
    }
    return cleaned.length === 9 ? cleaned : '';
  };
  
  const [phone, setPhone] = useState(getPhoneDigits(phoneParam));
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  const passwordRef = useRef<any>(null);

  const validate = () => {
    const newErrors: { phone?: string; password?: string } = {};

    if (!phone || phone.length !== 9) {
      newErrors.phone = 'Telefon raqami to\'liq kiritilishi shart';
    }

    if (!password) {
      newErrors.password = 'Parol kiritilishi shart';
    } else if (password.length < 6) {
      newErrors.password = 'Parol kamida 6 belgi bo\'lishi kerak';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    
    if (!validate()) {
      return;
    }

    const fullPhone = `+998${phone}`;

    setLoading(true);
    try {
      await apiService.loginStep1(fullPhone, password);
      
      // Navigate to SMS verification
      router.push({
        pathname: '/(auth)/sms-verify',
        params: {
          phone: fullPhone,
          type: 'login',
        },
      });
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

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
          <Card>
            <Text style={styles.title}>Kirish</Text>
            <Text style={styles.subtitle}>
              Hisobingizga kirish uchun ma'lumotlaringizni kiriting
            </Text>

            <View style={styles.form}>
              <PhoneInput
                label="Telefon raqami"
                value={phone}
                onChangeText={setPhone}
                error={errors.phone}
                autoComplete="tel"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />

              <PasswordInput
                ref={passwordRef}
                label="Parol"
                placeholder="Parolingizni kiriting"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                style={styles.forgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Parolni unutdingizmi?</Text>
              </TouchableOpacity>

              <Button
                title="Kirish"
                onPress={handleLogin}
                loading={loading}
                style={styles.button}
              />

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Hisobingiz yo'qmi? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                  <Text style={styles.registerLink}>Ro'yxatdan o'tish</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
  },
  content: {
    flex: 1,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007AFF',
  },
  button: {
    marginTop: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});

