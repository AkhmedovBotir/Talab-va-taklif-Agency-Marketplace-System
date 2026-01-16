import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PhoneInput from '../../components/ui/PhoneInput';
import apiService from '../../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const phoneRef = useRef<any>(null);

  const validate = () => {
    if (!phone || phone.length !== 9) {
      setError('Telefon raqami to\'liq kiritilishi shart');
      return false;
    }

    setError('');
    return true;
  };

  const handleContinue = async () => {
    Keyboard.dismiss();
    
    if (!validate()) {
      return;
    }

    const fullPhone = `+998${phone}`;
    // Send phone number as 998XXXXXXXXX format (12 digits)
    const phoneNumber = `998${phone}`;

    setLoading(true);
    setError('');
    
    try {
      // Check if phone exists in database
      const checkResult = await apiService.checkPhone(phoneNumber);
      
      if (checkResult.success && checkResult.status === 'bor') {
        // Phone exists, show error and suggest to login
        setError('Bu telefon raqami bilan allaqachon ro\'yxatdan o\'tilgan');
        return;
      }

      // Phone doesn't exist (status === 'yoq'), proceed to registration form
      if (checkResult.success && checkResult.status === 'yoq') {
        router.push({
          pathname: '/(auth)/register-form',
          params: { phone: fullPhone },
        });
      }
    } catch (error: any) {
      console.error('Check phone error:', error);
      setError(error.message || 'Telefon raqamini tekshirishda xatolik yuz berdi');
      Alert.alert('Xatolik', error.message || 'Telefon raqamini tekshirishda xatolik yuz berdi');
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
            <Text style={styles.title}>Ro'yxatdan o'tish</Text>
            <Text style={styles.subtitle}>
              Hisob yaratish uchun telefon raqamingizni kiriting
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
                onSubmitEditing={handleContinue}
              />

              <Button
                title="Davom etish"
                onPress={handleContinue}
                loading={loading}
                style={styles.button}
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Allaqachon hisobingiz bormi? </Text>
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

