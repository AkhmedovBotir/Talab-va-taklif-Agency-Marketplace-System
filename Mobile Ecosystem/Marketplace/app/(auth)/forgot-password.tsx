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
import { useRouter } from 'expo-router';
import PhoneInput from '../../components/ui/PhoneInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import apiService from '../../services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const phoneRef = useRef<any>(null);

  const validate = () => {
    if (!phone || phone.length !== 9) {
      setError('Telefon raqami to\'liq kiritilishi shart');
      return false;
    }

    setError('');
    return true;
  };

  const handleSendCode = async () => {
    Keyboard.dismiss();
    
    if (!validate()) {
      return;
    }

    const fullPhone = `+998${phone}`;

    setLoading(true);
    try {
      await apiService.forgotPasswordStep1(fullPhone);
      
      // Navigate to SMS verification
      router.push({
        pathname: '/(auth)/sms-verify',
        params: {
          phone: fullPhone,
          type: 'forgot_password',
        },
      });
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Kod yuborishda xatolik yuz berdi');
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
            <Text style={styles.title}>Parolni tiklash</Text>
            <Text style={styles.subtitle}>
              Parolni tiklash uchun telefon raqamingizga tasdiqlash kodi yuboriladi
            </Text>

            <View style={styles.form}>
              <PhoneInput
                ref={phoneRef}
                label="Telefon raqami"
                value={phone}
                onChangeText={setPhone}
                error={error}
                autoComplete="tel"
                returnKeyType="done"
                onSubmitEditing={handleSendCode}
              />

            <Button
              title="Kodni olish"
              onPress={handleSendCode}
              loading={loading}
              style={styles.button}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Parolingizni eslaysizmi? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}>Kirish</Text>
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
  button: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});

