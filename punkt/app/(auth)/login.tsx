import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const { login } = useAuth();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isWideLayout = windowWidth >= 600;
  const formMaxWidth = Math.min(isWideLayout ? 480 : windowWidth - 32, 520);
  const codeBoxSize = Math.max(40, Math.min(56, Math.floor((Math.min(windowWidth, formMaxWidth) - 100) / 5)));

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
      showSnackbar('Telefon raqami kiritilishi shart', 'error');
      return;
    }

    if (!validatePhone()) {
      showSnackbar('Telefon raqami 9 ta raqamdan iborat bo\'lishi kerak', 'error');
      return;
    }

    if (!password.trim()) {
      showSnackbar('Parol kiritilishi shart', 'error');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = getFullPhoneNumber();
      await login(fullPhone, password);
      router.replace('/(tabs)/orders');
    } catch {
      /* Xabar snackbar: `api.ts` notifier server `message` ni ko‘rsatadi */
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={
        Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined
      }
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isWideLayout && styles.scrollContentWide,
          { paddingHorizontal: Math.max(16, Math.min(24, windowWidth * 0.04)) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { maxWidth: formMaxWidth, width: '100%' }]}>
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

      <Modal
        visible={showPasswordSetup}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
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
          codeBoxSize={codeBoxSize}
          formMaxWidth={formMaxWidth}
          onSuccess={() => {
            setShowPasswordSetup(false);
          }}
        />
      </Modal>
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
  codeBoxSize: number;
  formMaxWidth: number;
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
  codeBoxSize,
  formMaxWidth,
  onSuccess,
}: PasswordSetupModalProps) {
  const insets = useSafeAreaInsets();
  const { registerSession } = useAuth();
  const { showSnackbar } = useSnackbar();
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
      showSnackbar('Telefon raqami 9 ta raqamdan iborat bo\'lishi kerak', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.punktAuthSendCode({ phone: getFullPhoneNumber() });
      showSnackbar(res.message || 'Tasdiqlash kodi yuborildi', 'success');
      setStep(2);
    } catch {
      /* API xabari snackbar orqali */
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    const code = smsCode.join('');
    if (code.length !== 5) {
      showSnackbar('Iltimos, 5 ta raqamli kodni kiriting', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.punktAuthVerifyCode({
        phone: getFullPhoneNumber(),
        code,
      });
      showSnackbar(res.message || 'Kod tasdiqlandi', 'success');
      setStep(3);
    } catch {
      setSmsCode(['', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    if (newPassword.length < 6) {
      showSnackbar('Parol kamida 6 ta belgidan iborat bo\'lishi kerak', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showSnackbar('Parollar mos kelmaydi', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.punktAuthSetPassword({
        phone: getFullPhoneNumber(),
        password: newPassword,
      });
      if (res.data?.token && res.data?.punkt) {
        showSnackbar(res.message || 'Parol o\'rnatildi', 'success');
        await registerSession(res.data.token, res.data.punkt);
        onSuccess();
        router.replace('/(tabs)/orders');
      } else {
        showSnackbar('Javobda token yo\'q', 'error');
      }
    } catch {
      /* API xatosi snackbar orqali */
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.modalContainer, { paddingTop: insets.top }]}
      behavior={
        Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined
      }
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
        contentContainerStyle={[styles.modalContent, { alignItems: 'center' }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={[styles.stepContainer, { maxWidth: formMaxWidth, width: '100%' }]}>
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
          <View style={[styles.stepContainer, { maxWidth: formMaxWidth, width: '100%' }]}>
            <View style={styles.stepIconContainer}>
              <Ionicons name="lock-closed" size={48} color="#007AFF" />
            </View>
            <Text style={styles.stepTitle}>SMS kodni kiriting</Text>
            <Text style={styles.stepDescription}>
              Telefon raqamingizga yuborilgan 5 ta raqamli kodni kiriting
            </Text>

            <View style={[styles.codeContainer, { paddingHorizontal: 0 }]}>
              {smsCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    codeInputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    { width: codeBoxSize, height: codeBoxSize + 8, fontSize: codeBoxSize > 48 ? 22 : 20 },
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
                  showSnackbar('Telefon raqami noto\'g\'ri', 'error');
                  return;
                }
                setLoading(true);
                try {
                  const res = await apiService.punktAuthResendCode({
                    phone: getFullPhoneNumber(),
                  });
                  showSnackbar(res.message || 'Kod qayta yuborildi', 'success');
                  setSmsCode(['', '', '', '', '']);
                  codeInputRefs.current[0]?.focus();
                } catch {
                  /* API xabari snackbar orqali */
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
          <View style={[styles.stepContainer, { maxWidth: formMaxWidth, width: '100%' }]}>
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
    paddingVertical: 40,
  },
  scrollContentWide: {
    minHeight: 480,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
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
