import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../services/api';
import { getDeviceId, getDeviceInfo } from '../utils/deviceId';

export default function DeviceVerificationScreen() {
  const params = useLocalSearchParams<{ phone: string; deviceId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [code, setCode] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const phone = params.phone || '';
  const deviceId = params.deviceId || '';

  useEffect(() => {
    // Auto request code on mount
    if (phone && deviceId && !codeSent) {
      requestCode();
    }
  }, []);

  const requestCode = async () => {
    if (!phone || !deviceId) return;

    setRequestingCode(true);
    try {
      const deviceInfo = getDeviceInfo();
      await apiService.requestDeviceVerificationCode({
        phone,
        deviceId,
        deviceName: `${Platform.OS} Device`,
        deviceType: deviceInfo.deviceType,
        platform: deviceInfo.platform,
        os: deviceInfo.os,
      });
      setCodeSent(true);
      Alert.alert('Muvaffaqiyat', 'Tasdiqlash kodi yuborildi');
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Kod yuborishda xatolik');
    } finally {
      setRequestingCode(false);
    }
  };

  const resendCode = async () => {
    setCode(['', '', '', '', '']);
    inputRefs.current[0]?.focus();
    await requestCode();
  };

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto focus next input
    if (digit && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all digits are entered
    if (digit && index === 4) {
      const fullCode = newCode.join('');
      if (fullCode.length === 5) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const fullCode = verificationCode || code.join('');
    
    if (fullCode.length !== 5) {
      Alert.alert('Xatolik', 'Kod 5 raqamdan iborat bo\'lishi kerak');
      return;
    }

    if (!phone || !deviceId) {
      Alert.alert('Xatolik', 'Ma\'lumotlar to\'liq emas');
      return;
    }

    setLoading(true);
    try {
      const deviceInfo = getDeviceInfo();
      const response = await apiService.verifyDevice({
        phone,
        deviceId,
        code: fullCode,
        deviceName: `${Platform.OS} Device`,
        deviceType: deviceInfo.deviceType,
        platform: deviceInfo.platform,
        os: deviceInfo.os,
      });

      Alert.alert(
        'Muvaffaqiyat', 
        response.data.isNew 
          ? 'Yangi qurilma muvaffaqiyatli tasdiqlandi. Endi login qilishingiz mumkin.' 
          : 'Qurilma muvaffaqiyatli tasdiqlandi. Endi login qilishingiz mumkin.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/login');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Kod noto\'g\'ri yoki muddati tugagan');
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
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={64} color="#007AFF" />
            </View>
            <Text style={styles.title}>Qurilma tasdiqlash</Text>
            <Text style={styles.subtitle}>
              Yangi qurilma aniqlandi. SMS kod orqali tasdiqlang
            </Text>
          </View>

          {/* Card Form */}
          <View style={styles.card}>
            <View style={styles.form}>
              {/* Phone Display */}
              <View style={styles.phoneDisplay}>
                <Ionicons name="call-outline" size={20} color="#666" />
                <Text style={styles.phoneText}>{phone}</Text>
              </View>

              {/* Code Input */}
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Tasdiqlash kodi</Text>
                <View style={styles.codeInputs}>
                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={[styles.codeInput, digit && styles.codeInputFilled]}
                      value={digit}
                      onChangeText={(value) => handleCodeChange(index, value)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                      keyboardType="number-pad"
                      maxLength={1}
                      editable={!loading}
                      selectTextOnFocus
                    />
                  ))}
                </View>
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={() => handleVerify()}
                disabled={loading || code.join('').length !== 5}
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

              {/* Resend Code */}
              <TouchableOpacity
                style={styles.resendButton}
                onPress={resendCode}
                disabled={requestingCode || loading}
                activeOpacity={0.8}
              >
                {requestingCode ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={18} color="#007AFF" style={styles.resendIcon} />
                    <Text style={styles.resendText}>Kodni qayta yuborish</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Info Text */}
              <Text style={styles.infoText}>
                SMS kod 5 daqiqa amal qiladi. Agar kod kelmagan bo'lsa, "Kodni qayta yuborish" tugmasini bosing.
              </Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
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
  phoneDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  phoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  codeContainer: {
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  codeInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#fafafa',
    color: '#333',
  },
  codeInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
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
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
  },
  resendIcon: {
    marginRight: 6,
  },
  resendText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});

