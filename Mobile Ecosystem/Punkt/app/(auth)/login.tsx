import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { useAuth } from '../contexts/AuthContext';
import { getDeviceId, getDeviceInfo } from '../utils/device';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Password setup states
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
  const [setupPhone, setSetupPhone] = useState('');
  const [smsCode, setSmsCode] = useState(['', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  // Device verification states
  const [showDeviceVerification, setShowDeviceVerification] = useState(false);
  const [deviceVerificationCode, setDeviceVerificationCode] = useState(['', '', '', '', '']);
  const [deviceVerificationLoading, setDeviceVerificationLoading] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const deviceVerificationCodeRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Get device ID on mount
    getDeviceId().then(setDeviceId);
  }, []);

  const formatPhoneNumber = (text: string): string => {
    // Faqat raqamlarni olish
    const digits = text.replace(/\D/g, '');
    
    // 9 ta raqamdan ko'p bo'lmasin
    const limited = digits.slice(0, 9);
    
    // Format: 90 123 45 67
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
    // Validation
    if (!phone.trim()) {
      Alert.alert('Xatolik', 'Telefon raqami kiritilishi shart');
      return;
    }

    if (!validatePhone()) {
      Alert.alert('Xatolik', 'Telefon raqami 9 ta raqamdan iborat bo\'lishi kerak');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Xatolik', 'Parol kiritilishi shart');
      return;
    }

    if (!deviceId) {
      Alert.alert('Xatolik', 'Qurilma ma\'lumotlari yuklanmoqda. Iltimos, biroz kutib turing.');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = getFullPhoneNumber();
      await login(fullPhone, password, deviceId || undefined);
      router.replace('/(tabs)/orders');
    } catch (error: any) {
      // Check if device verification is required
      if (error.requiresDeviceVerification || (error.status === 403 && error.message && error.message.includes('qurilma'))) {
        const fullPhone = getFullPhoneNumber();
        setPendingPhone(fullPhone);
        try {
          const deviceInfo = getDeviceInfo();
          await apiService.requestDeviceVerificationCode({
            phone: fullPhone,
            deviceId: deviceId!,
            ...deviceInfo,
          });
          setShowDeviceVerification(true);
          setLoading(false);
          return;
        } catch (verifyError: any) {
          Alert.alert('Xatolik', verifyError.message || 'Qurilma tasdiqlashda xatolik');
        }
      } else {
        let errorMessage = 'Kirishda xatolik yuz berdi';
        
        if (error.status === 401) {
          errorMessage = 'Telefon raqami yoki parol noto\'g\'ri';
        } else if (error.status === 403) {
          errorMessage = 'Hisob faol emas';
        } else if (error.status === 400) {
          errorMessage = error.message || 'Ma\'lumotlar noto\'g\'ri';
        } else if (error.message) {
          errorMessage = error.message;
        }

        Alert.alert('Xatolik', errorMessage);
      }
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
              <Ionicons name="location" size={64} color="#007AFF" />
            </View>
            <Text style={styles.title}>Punkt</Text>
            <Text style={styles.subtitle}>Tizimga kirish</Text>
          </View>

          {/* Card Form */}
          <View style={styles.card}>
            <View style={styles.form}>
              {/* Phone Input */}
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

              {/* Password Input */}
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
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
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

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>yoki</Text>
                <View style={styles.divider} />
              </View>

              {/* Password Setup Button */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setSetupPhone('');
                  setSmsCode(['', '', '', '', '']);
                  setNewPassword('');
                  setConfirmPassword('');
                  setSetupStep(1);
                  setShowPasswordSetup(true);
                }}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="lock-open-outline" size={20} color="#007AFF" style={styles.secondaryButtonIcon} />
                <Text style={styles.secondaryButtonText}>Yangi Foydalanuvchi uchun</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Device Verification Modal */}
      <Modal
        visible={showDeviceVerification}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDeviceVerification(false)}
      >
        <DeviceVerificationModal
          phone={pendingPhone}
          deviceId={deviceId || ''}
          smsCode={deviceVerificationCode}
          setSmsCode={setDeviceVerificationCode}
          loading={deviceVerificationLoading}
          setLoading={setDeviceVerificationLoading}
          onClose={() => setShowDeviceVerification(false)}
          codeInputRefs={deviceVerificationCodeRefs}
          onSuccess={async () => {
            setShowDeviceVerification(false);
            // Try login again after device verification
            try {
              await login(pendingPhone, password, deviceId || undefined);
              router.replace('/(tabs)/orders');
            } catch (error: any) {
              Alert.alert('Xatolik', 'Kirishda xatolik yuz berdi');
            }
          }}
        />
      </Modal>

      {/* Password Setup Modal */}
      <Modal
        visible={showPasswordSetup}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordSetup(false)}
      >
        <PasswordSetupModal
          step={setupStep}
          phone={setupPhone}
          setPhone={setSetupPhone}
          smsCode={smsCode}
          setSmsCode={setSmsCode}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          showNewPassword={showNewPassword}
          setShowNewPassword={setShowNewPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          loading={setupLoading}
          setLoading={setSetupLoading}
          setStep={setSetupStep}
          onClose={() => setShowPasswordSetup(false)}
          codeInputRefs={codeInputRefs}
          onSuccess={() => {
            setShowPasswordSetup(false);
            Alert.alert('Muvaffaqiyat', 'Parol muvaffaqiyatli o\'rnatildi. Endi tizimga kirishingiz mumkin.');
          }}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

// Device Verification Modal Component
interface DeviceVerificationModalProps {
  phone: string;
  deviceId: string;
  smsCode: string[];
  setSmsCode: (code: string[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onClose: () => void;
  codeInputRefs: React.MutableRefObject<(TextInput | null)[]>;
  onSuccess: () => void;
}

function DeviceVerificationModal({
  phone,
  deviceId,
  smsCode,
  setSmsCode,
  loading,
  setLoading,
  onClose,
  codeInputRefs,
  onSuccess,
}: DeviceVerificationModalProps) {
  const insets = useSafeAreaInsets();

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 5);
      const newCode = [...smsCode];
      digits.split('').forEach((digit, i) => {
        if (index + i < 5) {
          newCode[index + i] = digit;
        }
      });
      setSmsCode(newCode);
      
      const nextIndex = Math.min(index + digits.length, 4);
      if (nextIndex < 5 && newCode[nextIndex] === '') {
        codeInputRefs.current[nextIndex]?.focus();
      } else if (nextIndex === 4 && newCode[4] !== '') {
        codeInputRefs.current[4]?.blur();
      }
      return;
    }

    const newCode = [...smsCode];
    newCode[index] = value.replace(/\D/g, '').slice(-1);
    setSmsCode(newCode);

    if (value && index < 4) {
      codeInputRefs.current[index + 1]?.focus();
    } else if (index === 4 && newCode[4] !== '') {
      codeInputRefs.current[4]?.blur();
    }
  };

  const handleCodeKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !smsCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = smsCode.join('');
    if (code.length !== 5) {
      Alert.alert('Xatolik', 'Iltimos, 5 ta raqamli kodni kiriting');
      return;
    }

    setLoading(true);
    try {
      const deviceInfo = getDeviceInfo();
      await apiService.verifyDevice({
        phone,
        deviceId,
        code,
        ...deviceInfo,
      });
      Alert.alert('Muvaffaqiyat', 'Qurilma muvaffaqiyatli tasdiqlandi');
      onSuccess();
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Kod noto\'g\'ri yoki muddati o\'tgan');
      setSmsCode(['', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await apiService.resendDeviceVerificationCode(phone, deviceId);
      Alert.alert('Muvaffaqiyat', 'Kod qayta yuborildi');
      setSmsCode(['', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.modalContainer, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Qurilma tasdiqlash</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.modalContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContainer}>
          <View style={styles.stepIconContainer}>
            <Ionicons name="phone-portrait" size={48} color="#007AFF" />
          </View>
          <Text style={styles.stepTitle}>Yangi qurilma aniqlandi</Text>
          <Text style={styles.stepDescription}>
            Bu qurilma bilan kirish uchun telefon raqamingizga yuborilgan 5 ta raqamli kodni kiriting
          </Text>

          <View style={styles.codeContainer}>
            {smsCode.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  codeInputRefs.current[index] = ref;
                }}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                ]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={(e) => handleCodeKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResend}
            disabled={loading}
          >
            <Text style={styles.resendText}>Kodni qayta yuborish</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Tasdiqlash</Text>
                <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Password Setup Modal Component
interface PasswordSetupModalProps {
  step: 1 | 2 | 3;
  phone: string;
  setPhone: (phone: string) => void;
  smsCode: string[];
  setSmsCode: (code: string[]) => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  showNewPassword: boolean;
  setShowNewPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setStep: (step: 1 | 2 | 3) => void;
  onClose: () => void;
  codeInputRefs: React.MutableRefObject<(TextInput | null)[]>;
  onSuccess: () => void;
}

function PasswordSetupModal({
  step,
  phone,
  setPhone,
  smsCode,
  setSmsCode,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  setLoading,
  setStep,
  onClose,
  codeInputRefs,
  onSuccess,
}: PasswordSetupModalProps) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const router = useRouter();

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

  const getFullPhoneNumber = (): string => {
    return '+998' + phone.replace(/\s/g, '');
  };

  const validatePhone = (): boolean => {
    const digits = phone.replace(/\s/g, '');
    return digits.length === 9;
  };

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      // If pasting multiple characters
      const digits = value.replace(/\D/g, '').slice(0, 5);
      const newCode = [...smsCode];
      digits.split('').forEach((digit, i) => {
        if (index + i < 5) {
          newCode[index + i] = digit;
        }
      });
      setSmsCode(newCode);
      
      // Focus next empty input
      const nextIndex = Math.min(index + digits.length, 4);
      if (nextIndex < 5 && newCode[nextIndex] === '') {
        codeInputRefs.current[nextIndex]?.focus();
      } else if (nextIndex === 4 && newCode[4] !== '') {
        codeInputRefs.current[4]?.blur();
      }
      return;
    }

    const newCode = [...smsCode];
    newCode[index] = value.replace(/\D/g, '').slice(-1);
    setSmsCode(newCode);

    // Auto-focus next input
    if (value && index < 4) {
      codeInputRefs.current[index + 1]?.focus();
    } else if (index === 4 && newCode[4] !== '') {
      codeInputRefs.current[4]?.blur();
    }
  };

  const handleCodeKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !smsCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleStep1 = async () => {
    if (!validatePhone()) {
      Alert.alert('Xatolik', 'Telefon raqami 9 ta raqamdan iborat bo\'lishi kerak');
      return;
    }

    setLoading(true);
    try {
      await apiService.passwordSetupStep1({ phone: getFullPhoneNumber() });
      Alert.alert('Muvaffaqiyat', 'Tasdiqlash kodi telefon raqamingizga yuborildi');
      setStep(2);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    const code = smsCode.join('');
    if (code.length !== 5) {
      Alert.alert('Xatolik', 'Iltimos, 5 ta raqamli kodni kiriting');
      return;
    }

    setLoading(true);
    try {
      await apiService.passwordSetupStep2({ phone: getFullPhoneNumber(), code });
      Alert.alert('Muvaffaqiyat', 'Kod muvaffaqiyatli tasdiqlandi');
      setStep(3);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Kod noto\'g\'ri yoki muddati o\'tgan');
      setSmsCode(['', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Xatolik', 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Xatolik', 'Parollar mos kelmaydi');
      return;
    }

    setLoading(true);
    try {
      await apiService.passwordSetupStep3({ phone: getFullPhoneNumber(), newPassword });
      // Auto login after password setup
      try {
        await login(getFullPhoneNumber(), newPassword);
        onSuccess();
        router.replace('/(tabs)/orders');
      } catch (loginError: any) {
        Alert.alert('Muvaffaqiyat', 'Parol o\'rnatildi. Iltimos, tizimga kiring.');
        onClose();
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Parol o\'rnatishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.modalContainer, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>Parol o'rnatish</Text>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.modalContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconContainer}>
              <Ionicons name="call" size={48} color="#007AFF" />
            </View>
            <Text style={styles.stepTitle}>Telefon raqamini kiriting</Text>
            <Text style={styles.stepDescription}>
              Parol o'rnatish uchun telefon raqamingizga tasdiqlash kodi yuboriladi
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefon raqami</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <Text style={styles.phonePrefix}>+998</Text>
                <View style={styles.phoneDivider} />
                <TextInput
                  style={styles.input}
                  placeholder="90 123 45 67"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  editable={!loading}
                  maxLength={12}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleStep1}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Kod yuborish</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconContainer}>
              <Ionicons name="lock-closed" size={48} color="#007AFF" />
            </View>
            <Text style={styles.stepTitle}>SMS kodni kiriting</Text>
            <Text style={styles.stepDescription}>
              Telefon raqamingizga yuborilgan 5 ta raqamli kodni kiriting
            </Text>

            <View style={styles.codeContainer}>
              {smsCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    codeInputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    digit && styles.codeInputFilled,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(value, index)}
                  onKeyPress={(e) => handleCodeKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={async () => {
                if (!validatePhone()) {
                  Alert.alert('Xatolik', 'Telefon raqami noto\'g\'ri');
                  return;
                }
                setLoading(true);
                try {
                  await apiService.passwordSetupStep1({ phone: getFullPhoneNumber() });
                  Alert.alert('Muvaffaqiyat', 'Kod qayta yuborildi');
                  setSmsCode(['', '', '', '', '']);
                  codeInputRefs.current[0]?.focus();
                } catch (error: any) {
                  Alert.alert('Xatolik', error.message || 'Xatolik yuz berdi');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <Text style={styles.resendText}>Kodni qayta yuborish</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleStep2}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Tasdiqlash</Text>
                  <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.stepIconContainer}>
              <Ionicons name="key" size={48} color="#007AFF" />
            </View>
            <Text style={styles.stepTitle}>Yangi parol o'rnating</Text>
            <Text style={styles.stepDescription}>
              Kamida 6 ta belgidan iborat parol kiriting
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Yangi parol</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Yangi parol"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeIcon}
                  disabled={loading}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Parolni tasdiqlang</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Parolni qayta kiriting"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                  onSubmitEditing={handleStep3}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                  disabled={loading}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleStep3}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Parolni o'rnatish</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  modalHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    top: 16,
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  stepDotActive: {
    backgroundColor: '#007AFF',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#007AFF',
  },
  modalContent: {
    padding: 20,
    paddingTop: 40,
  },
  stepContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  stepIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  codeInput: {
    width: 56,
    height: 64,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  codeInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  resendButton: {
    alignSelf: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  resendText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
