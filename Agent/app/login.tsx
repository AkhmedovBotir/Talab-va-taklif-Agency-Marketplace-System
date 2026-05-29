// Login Screen
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
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
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { apiService } from '../services/api';
import { getApiErrorMessage, isLoginPasswordNotSetMessage } from '../utils/apiError';

type PasswordSetupStep = 'phone' | 'sms' | 'password';

export default function LoginScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const webModalWidth = Math.min(480, windowWidth - 48);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, applySession } = useAuth();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const webContentStyle =
    isWeb
      ? { maxWidth: Math.min(480, windowWidth - 40), width: '100%' as const, alignSelf: 'center' as const }
      : undefined;
  const webModalOuterStyle =
    isWeb
      ? {
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
          padding: 20,
        }
      : undefined;
  const webModalCardStyle =
    isWeb
      ? {
          maxWidth: Math.min(480, windowWidth - 48),
          width: '100%' as const,
          borderRadius: 20,
          maxHeight: Math.min(680, windowHeight * 0.92),
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }
      : undefined;

  // Password Setup States
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [setupStep, setSetupStep] = useState<PasswordSetupStep>('phone');
  const [setupPhone, setSetupPhone] = useState('');
  const [smsCode, setSmsCode] = useState(['', '', '', '', '']);
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState('');
  const [setupShowPassword, setSetupShowPassword] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const smsInputRef = useRef<TextInput | null>(null);

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

  const handlePhoneChange = (text: string) => {
    setPhone(formatPhoneNumber(text));
  };

  const handleSetupPhoneChange = (text: string) => {
    setSetupPhone(formatPhoneNumber(text));
  };

  const getFullPhoneNumber = (phoneNumber: string): string => {
    return '+998' + phoneNumber.replace(/\s/g, '');
  };

  const validatePhone = (phoneNumber: string): boolean => {
    const digits = phoneNumber.replace(/\s/g, '');
    return digits.length === 9;
  };

  const handleLogin = async () => {
    if (!phone.trim()) {
      showSnackbar('Telefon raqami kiritilishi shart', { variant: 'error' });
      return;
    }

    if (!validatePhone(phone)) {
      showSnackbar('telefon raqami formati noto\'g\'ri (+998 va 9 ta raqam)', { variant: 'error' });
      return;
    }

    if (!password.trim()) {
      showSnackbar('Parol kiritilishi shart', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await login({ phone: getFullPhoneNumber(phone), password });
      router.replace('/(tabs)/orders');
    } catch (error: any) {
      const statusCode = error.response?.status || error.status || 0;
      const body = error.response?.data as { message?: string } | undefined;
      const serverMessage = typeof body?.message === 'string' ? body.message.trim() : '';

      if (statusCode === 400 && isLoginPasswordNotSetMessage(serverMessage)) {
        showSnackbar(serverMessage, { variant: 'info', duration: 5000 });
        setSetupPhone(phone);
        setShowPasswordSetup(true);
        setSetupStep('phone');
        return;
      }

      const finalMessage =
        serverMessage ||
        (statusCode === 401
          ? 'telefon yoki parol noto\'g\'ri'
          : statusCode === 500
            ? 'Serverda xatolik yuz berdi'
            : getApiErrorMessage(error, 'Kirishda xatolik yuz berdi'));

      showSnackbar(finalMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Password Setup Handlers
  const handlePasswordSetupStep1 = async () => {
    if (!validatePhone(setupPhone)) {
      showSnackbar('telefon raqami formati noto\'g\'ri (+998 va 9 ta raqam)', { variant: 'error' });
      return;
    }

    setSetupLoading(true);
    try {
      const response = await apiService.sendAuthCode(getFullPhoneNumber(setupPhone));
      if (response.success) {
        showSnackbar(response.message, { variant: 'success' });
        setSetupStep('sms');
        setTimeout(() => {
          smsInputRef.current?.focus();
        }, 100);
      }
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error, 'Xatolik yuz berdi'), { variant: 'error' });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleResendAuthCode = async () => {
    setSetupLoading(true);
    try {
      const response = await apiService.resendAuthCode(getFullPhoneNumber(setupPhone));
      if (response.success) {
        showSnackbar(response.message, { variant: 'success' });
      }
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error, 'Kod yuborishda xatolik'), { variant: 'error' });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleSmsCodeTextChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 5);
    const newCode = Array.from({ length: 5 }, (_, index) => digits[index] || '');
    console.log('[SMS] code input changed', { raw: value, digits, length: digits.length });
    setSmsCode(newCode);

    if (digits.length === 5) {
      console.log('[SMS] auto submit triggered');
      handlePasswordSetupStep2(digits);
    }
  };

  const handlePasswordSetupStep2 = async (codeOverride?: string) => {
    const code = codeOverride ?? smsCode.join('');
    console.log('[SMS] verify start', {
      phone: getFullPhoneNumber(setupPhone),
      codeLength: code.length,
      code,
      setupLoading,
    });


    setSetupLoading(true);
    try {
      const response = await apiService.verifyAuthCode(getFullPhoneNumber(setupPhone), code);
      console.log('[SMS] verify response', response);
      if (response.success) {
        console.log('[SMS] verify success, moving to password step');
        showSnackbar(response.message, { variant: 'success' });
        setSetupStep('password');
      }
    } catch (error: any) {
      const status = error.response?.status;
      const errorMessage = getApiErrorMessage(error, 'tasdiqlash kodi noto\'g\'ri');
      console.log('[SMS] verify failed', {
        status,
        errorMessage,
        responseData: error.response?.data,
      });
      if (status === 410) {
        showSnackbar(errorMessage, { variant: 'error', duration: 5500 });
      } else {
        showSnackbar(errorMessage, { variant: 'error' });
      }
      setSmsCode(['', '', '', '', '']);
      smsInputRef.current?.focus();
    } finally {
      console.log('[SMS] verify finished');
      setSetupLoading(false);
    }
  };

  const handlePasswordSetupStep3 = async () => {
    if (setupPassword.length < 6) {
      showSnackbar('parol kamida 6 ta belgidan iborat bo\'lishi kerak', { variant: 'error' });
      return;
    }

    if (setupPassword !== setupPasswordConfirm) {
      showSnackbar('Parollar mos kelmaydi', { variant: 'error' });
      return;
    }

    setSetupLoading(true);
    try {
      const response = await apiService.setAgentPassword(
        getFullPhoneNumber(setupPhone),
        setupPassword
      );
      if (response.success && response.data?.token && response.data?.agent) {
        applySession(response.data.token, response.data.agent);
        showSnackbar(response.message || 'Parol o\'rnatildi', { variant: 'success' });
        setShowPasswordSetup(false);
        resetPasswordSetup();
        router.replace('/(tabs)/orders');
      } else {
        showSnackbar(response.message || 'Parol o\'rnatishda xatolik', { variant: 'error' });
      }
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error, 'Parol o\'rnatishda xatolik'), { variant: 'error' });
    } finally {
      setSetupLoading(false);
    }
  };

  const resetPasswordSetup = () => {
    setSetupStep('phone');
    setSetupPhone('');
    setSmsCode(['', '', '', '', '']);
    setSetupPassword('');
    setSetupPasswordConfirm('');
    setSetupShowPassword(false);
  };

  const handleClosePasswordSetup = () => {
    if (setupLoading) return;
    resetPasswordSetup();
    setShowPasswordSetup(false);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={
          Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, webContentStyle]}>
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="person-circle" size={64} color="#007AFF" />
              </View>
              <Text style={styles.title}>Agent Tizimi</Text>
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
                  onPress={() => setShowPasswordSetup(true)}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="lock-open-outline" size={20} color="#007AFF" style={styles.secondaryButtonIcon} />
                  <Text style={styles.secondaryButtonText}>Yangi foydalanuvchi uchun</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Password Setup Modal */}
      <Modal
        visible={showPasswordSetup}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClosePasswordSetup}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, webModalOuterStyle]}
          behavior={
            Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined
          }
        >
          <View style={[styles.modalContent, webModalCardStyle]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {setupStep === 'phone' && 'Parol o\'rnatish'}
                {setupStep === 'sms' && 'SMS kodni kiriting'}
                {setupStep === 'password' && 'Yangi parol'}
              </Text>
              <TouchableOpacity
                onPress={handleClosePasswordSetup}
                style={styles.closeButton}
                disabled={setupLoading}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Step 1: Phone */}
              {setupStep === 'phone' && (
                <View style={styles.setupStepContainer}>
                  <Text style={styles.setupDescription}>
                    Telefon raqamingizga SMS kod yuboriladi
                  </Text>
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
                        value={setupPhone}
                        onChangeText={handleSetupPhoneChange}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        editable={!setupLoading}
                        maxLength={12}
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.button, setupLoading && styles.buttonDisabled]}
                    onPress={handlePasswordSetupStep1}
                    disabled={setupLoading}
                    activeOpacity={0.8}
                  >
                    {setupLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Kod yuborish</Text>
                        <Ionicons name="send-outline" size={20} color="#fff" style={styles.buttonIcon} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 2: SMS Code */}
              {setupStep === 'sms' && (
                <View style={styles.setupStepContainer}>
                  <Text style={styles.setupDescription}>
                    {getFullPhoneNumber(setupPhone)} raqamiga yuborilgan kodni kiriting
                  </Text>
                  
                  <TouchableOpacity
                    activeOpacity={1}
                    style={styles.smsCodeWrapper}
                    onPress={() => smsInputRef.current?.focus()}
                    disabled={setupLoading}
                  >
                    <View style={styles.smsCodeContainer}>
                      {smsCode.map((digit, index) => (
                        <View
                          key={index}
                          style={[
                            styles.smsCodeInput,
                            digit && styles.smsCodeInputFilled,
                          ]}
                        >
                          <Text style={styles.smsCodeDigit}>{digit || ' '}</Text>
                        </View>
                      ))}
                    </View>
                    <TextInput
                      ref={smsInputRef}
                      style={styles.smsHiddenInput}
                      value={smsCode.join('')}
                      onChangeText={handleSmsCodeTextChange}
                      keyboardType="number-pad"
                      maxLength={5}
                      editable={!setupLoading}
                      autoFocus
                      contextMenuHidden
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendAuthCode}
                    disabled={setupLoading}
                  >
                    <Text style={styles.resendText}>Kodni qayta yuborish</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, setupLoading && styles.buttonDisabled]}
                    onPress={() => {
                      const currentCode = smsCode.join('');
                      console.log('[SMS] confirm button pressed', {
                        smsCode,
                        currentCode,
                        hasEmptyDigit: smsCode.some(d => !d),
                        setupLoading,
                      });
                      handlePasswordSetupStep2(currentCode);
                    }}
                    disabled={setupLoading || smsCode.some(d => !d)}
                    activeOpacity={0.8}
                  >
                    {setupLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Tasdiqlash</Text>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={styles.buttonIcon} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 3: Password */}
              {setupStep === 'password' && (
                <View style={styles.setupStepContainer}>
                  <Text style={styles.setupDescription}>
                    Yangi parol o'rnating (kamida 6 ta belgi)
                  </Text>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Yangi parol</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons 
                        name="lock-closed-outline" 
                        size={20} 
                        color="#666" 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Yangi parol"
                        placeholderTextColor="#999"
                        value={setupPassword}
                        onChangeText={setSetupPassword}
                        secureTextEntry={!setupShowPassword}
                        autoCapitalize="none"
                        editable={!setupLoading}
                      />
                      <TouchableOpacity
                        onPress={() => setSetupShowPassword(!setupShowPassword)}
                        style={styles.eyeIcon}
                        disabled={setupLoading}
                      >
                        <Ionicons
                          name={setupShowPassword ? "eye-outline" : "eye-off-outline"}
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Parolni tasdiqlash</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons 
                        name="lock-closed-outline" 
                        size={20} 
                        color="#666" 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Parolni takrorlang"
                        placeholderTextColor="#999"
                        value={setupPasswordConfirm}
                        onChangeText={setSetupPasswordConfirm}
                        secureTextEntry={!setupShowPassword}
                        autoCapitalize="none"
                        editable={!setupLoading}
                        onSubmitEditing={handlePasswordSetupStep3}
                      />
                      <TouchableOpacity
                        onPress={() => setSetupShowPassword(!setupShowPassword)}
                        style={styles.eyeIcon}
                        disabled={setupLoading}
                      >
                        <Ionicons
                          name={setupShowPassword ? "eye-outline" : "eye-off-outline"}
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      (setupLoading || setupPassword.length < 6 || setupPassword !== setupPasswordConfirm) && styles.buttonDisabled
                    ]}
                    onPress={handlePasswordSetupStep3}
                    disabled={setupLoading || setupPassword.length < 6 || setupPassword !== setupPasswordConfirm}
                    activeOpacity={0.8}
                  >
                    {setupLoading ? (
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
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollContent: {
    padding: 20,
  },
  setupStepContainer: {
    width: '100%',
  },
  setupDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  // SMS Code Styles
  smsCodeWrapper: {
    position: 'relative',
    marginBottom: 24,
  },
  smsCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  smsCodeInput: {
    width: 56,
    height: 64,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    backgroundColor: '#fafafa',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginHorizontal: 4,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smsCodeInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  smsCodeDigit: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  smsHiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    color: 'transparent',
  },
  resendButton: {
    alignSelf: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  resendText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
