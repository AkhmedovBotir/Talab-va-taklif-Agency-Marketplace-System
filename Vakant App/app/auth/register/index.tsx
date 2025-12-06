import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { PhoneInput } from '@/components/PhoneInput';
import { Button } from '@/components/Button';
import { apiService } from '@/services/api';

export default function RegisterScreen() {
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

  const handleCheckAndProceed = async () => {
    setError('');
    
    const digits = phone.replace(/\D/g, '');
    if (!phone || digits.length !== 9) {
      setError('To\'liq telefon raqamni kiriting');
      return;
    }

    const fullPhone = getFullPhone();
    
    setLoading(true);
    try {
      const exists = await apiService.checkPhone(fullPhone);
      
      if (exists) {
        Alert.alert('Xatolik', 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan');
      } else {
        router.push({
          pathname: '/auth/register/send-code',
          params: { phone: fullPhone },
        });
      }
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
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
              <Text style={styles.title}>Ro'yxatdan o'tish</Text>
              <Text style={styles.subtitle}>
                Telefon raqamingizni kiriting
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
                title="Davom etish"
                onPress={handleCheckAndProceed}
                loading={loading}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Allaqachon ro'yxatdan o'tganmisiz? </Text>
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push('/auth/login')}
                >
                  Kirish
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
