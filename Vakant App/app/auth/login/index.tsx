import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { PhoneInput } from '@/components/PhoneInput';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { apiService } from '@/services/api';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getFullPhone = (): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 9) {
      return `+998${digits}`;
    }
    return '';
  };

  const handleSendCode = async () => {
    const newErrors: Record<string, string> = {};
    const digits = phone.replace(/\D/g, '');
    
    if (!phone || digits.length !== 9) {
      newErrors.phone = 'To\'liq telefon raqamni kiriting';
    }
    if (!password) {
      newErrors.password = 'Parolni kiriting';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const fullPhone = getFullPhone();
    
    setLoading(true);
    try {
      await apiService.loginSendCode(fullPhone, password);
      router.push({
        pathname: '/auth/login/confirm',
        params: { phone: fullPhone, password },
      });
    } catch (err: any) {
      Alert.alert('Xatolik', err.message || 'Kirishda xatolik');
    } finally {
      setLoading(false);
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
              <Text style={styles.title}>Kirish</Text>
              <Text style={styles.subtitle}>
                Telefon raqam va parolingizni kiriting
              </Text>
            </View>

            <View style={styles.form}>
              <PhoneInput
                label="Telefon raqam"
                value={phone}
                onChangeText={setPhone}
                error={errors.phone}
                autoFocus
              />

              <Input
                label="Parol"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                showPasswordToggle
                error={errors.password}
                placeholder="Parolingizni kiriting"
              />

              <Button
                title="Davom etish"
                onPress={handleSendCode}
                loading={loading}
              />

              <View style={styles.forgotPasswordContainer}>
                <Text
                  style={styles.forgotPasswordLink}
                  onPress={() => router.push('/auth/forgot-password')}
                >
                  Parolni unutdingizmi?
                </Text>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Ro'yxatdan o'tmaganmisiz? </Text>
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push('/auth/register')}
                >
                  Ro'yxatdan o'tish
                </Text>
              </View>
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
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
