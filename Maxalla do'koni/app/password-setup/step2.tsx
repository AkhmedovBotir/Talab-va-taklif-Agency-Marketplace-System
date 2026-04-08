import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import AppSnackbar, { SnackbarType } from '../../components/AppSnackbar';
import { apiService } from '../../services/api';

export default function PasswordSetupStep2Screen() {
  const params = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('error');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const phone = params.phone || '';

  const showSnackbar = (message: string, type: SnackbarType = 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const handleCodeChange = (value: string, index: number) => {
    // Faqat raqamlarni qabul qilish
    const digit = value.replace(/\D/g, '').slice(0, 1);
    
    if (digit) {
      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);

      // Keyingi inputga o'tish
      if (index < 4 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }

      // Agar barcha raqamlar to'ldirilgan bo'lsa, avtomatik submit
      if (newCode.every(c => c !== '') && index === 4) {
        handleVerifyCode(newCode.join(''));
      }
    } else {
      // Bo'sh qilish
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      // Oldingi inputga o'tish
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      await apiService.resendCode({ phone });
      showSnackbar('Yangi tasdiqlash kodi telefon raqamingizga yuborildi', 'success');
    } catch (error: any) {
      let errorMessage = 'Kod yuborishda xatolik yuz berdi';
      
      if (error.status === 400) {
        errorMessage = error.message || 'Ma\'lumotlar noto\'g\'ri';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showSnackbar(errorMessage);
    } finally {
      setResending(false);
    }
  };

  const handleVerifyCode = async (codeValue?: string) => {
    const codeString = codeValue || code.join('');
    
    if (codeString.length !== 5) {
      showSnackbar('Tasdiqlash kodi 5 ta raqamdan iborat bo\'lishi kerak');
      return;
    }

    setLoading(true);
    try {
      await apiService.passwordSetupStep2({
        phone,
        code: codeString,
      });

      showSnackbar('Kod tasdiqlandi. Endi parol o\'rnating', 'success');
      setTimeout(() => {
        router.push({
          pathname: '/password-setup/step3',
          params: { phone },
        });
      }, 700);
    } catch (error: any) {
      let errorMessage = 'Kod tasdiqlashda xatolik yuz berdi';
      
      if (error.status === 400) {
        errorMessage = error.message || 'Ma\'lumotlar noto\'g\'ri';
      } else if (error.status === 404) {
        errorMessage = 'Kontragent topilmadi';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showSnackbar(errorMessage);
      
      // Xatolik bo'lsa, kodni tozalash
      setCode(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
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
          {/* Header Section */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={64} color="#007AFF" />
            </View>
            <Text style={styles.title}>Kodni tasdiqlash</Text>
            <Text style={styles.subtitle}>Telefon raqamingizga yuborilgan kodni kiriting</Text>
          </View>

          {/* Card Form */}
          <View style={styles.card}>
            <View style={styles.form}>
              {/* Phone Display */}
              <View style={styles.phoneDisplayContainer}>
                <Ionicons name="call" size={16} color="#007AFF" />
                <Text style={styles.phoneDisplay}>{phone}</Text>
              </View>

              {/* Code Input Blocks */}
              <View style={styles.codeContainer}>
                <Text style={styles.label}>Tasdiqlash kodi</Text>
                <View style={styles.codeInputsWrapper}>
                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={[
                        styles.codeInput,
                        digit !== '' && styles.codeInputFilled,
                      ]}
                      value={digit}
                      onChangeText={(value) => handleCodeChange(value, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      editable={!loading}
                      selectTextOnFocus
                    />
                  ))}
                </View>
                <Text style={styles.hintText}>5 ta raqamdan iborat kod</Text>
              </View>

              {/* Resend Code Button */}
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={resending || loading}
                activeOpacity={0.7}
              >
                {resending ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={18} color="#007AFF" />
                    <Text style={styles.resendButtonText}>Kodni qayta yuborish</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  (loading || code.some(c => c === '')) && styles.buttonDisabled,
                ]}
                onPress={() => handleVerifyCode()}
                disabled={loading || code.some(c => c === '')}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Tasdiqlash</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      <AppSnackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onHide={() => setSnackbarVisible(false)}
      />
    </KeyboardAvoidingView>
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
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
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
  phoneDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 32,
  },
  phoneDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  codeContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  codeInputsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  codeInput: {
    flex: 1,
    height: 64,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  codeInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
    gap: 8,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
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
});
