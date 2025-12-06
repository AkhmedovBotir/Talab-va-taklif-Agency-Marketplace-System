import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { PhoneInput } from '@/components/PhoneInput';
import { Button } from '@/components/Button';
import { apiService } from '@/services/api';

export default function ForgotPasswordScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getFullPhone = (): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 9) {
      return `+998${digits}`;
    }
    return '';
  };

  const handleSendCode = async () => {
    setError('');
    const digits = phone.replace(/\D/g, '');
    
    if (!phone || digits.length !== 9) {
      setError('To\'liq telefon raqamni kiriting');
      return;
    }

    const fullPhone = getFullPhone();
    
    setLoading(true);
    try {
      await apiService.forgotPasswordSendCode(fullPhone);
      router.push({
        pathname: '/auth/forgot-password/confirm',
        params: { phone: fullPhone },
      });
    } catch (err: any) {
      setError(err.message || 'Kod yuborishda xatolik');
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
              <Text style={styles.title}>Parolni tiklash</Text>
              <Text style={styles.subtitle}>
                Telefon raqamingizni kiriting. Sizga tasdiqlash kodi yuboriladi.
              </Text>
            </View>

            <View style={styles.form}>
              <PhoneInput
                label="Telefon raqam"
                value={phone}
                onChangeText={setPhone}
                error={error}
                autoFocus
              />

              <Button
                title="Kod yuborish"
                onPress={handleSendCode}
                loading={loading}
              />

              <View style={styles.footer}>
                <Text
                  style={styles.footerLink}
                  onPress={() => router.back()}
                >
                  ← Orqaga qaytish
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
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});
