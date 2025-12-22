// Login Screen
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

type PasswordSetupStep = 'phone' | 'sms' | 'password';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Password Setup States
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [setupStep, setSetupStep] = useState<PasswordSetupStep>('phone');
  const [setupPhone, setSetupPhone] = useState('');
  const [smsCode, setSmsCode] = useState(['', '', '', '', '']);
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState('');
  const [setupShowPassword, setSetupShowPassword] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const smsInputRefs = useRef<(TextInput | null)[]>([]);

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
      Alert.alert('Xatolik', 'Telefon raqami kiritilishi shart');
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert('Xatolik', 'Telefon raqami 9 ta raqamdan iborat bo\'lishi kerak');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Xatolik', 'Parol kiritilishi shart');
      return;
    }

    setLoading(true);
    try {
      await login({ phone: getFullPhoneNumber(phone), password });
      router.replace('/(tabs)/orders');
    } catch (error: any) {
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
    } finally {
      setLoading(false);
    }
  };

  // Password Setup Handlers
  const handlePasswordSetupStep1 = async () => {
    if (!validatePhone(setupPhone)) {
      Alert.alert('Xatolik', 'Telefon raqami 9 ta raqamdan iborat bo\'lishi kerak');
      return;
    }

    setSetupLoading(true);
    try {
      const response = await apiService.passwordSetupStep1(getFullPhoneNumber(setupPhone));
      if (response.success) {
        Alert.alert('Muvaffaqiyat', response.message);
        setSetupStep('sms');
        // Focus first SMS input
        setTimeout(() => {
          smsInputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Xatolik yuz berdi';
      Alert.alert('Xatolik', errorMessage);
    } finally {
      setSetupLoading(false);
    }
  };

  const handleSmsCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    const newCode = [...smsCode];
    newCode[index] = value.replace(/\D/g, '');
    setSmsCode(newCode);

    // Auto focus next input
    if (value && index < 4) {
      smsInputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all fields filled
    if (newCode.every(digit => digit !== '') && index === 4) {
      handlePasswordSetupStep2();
    }
  };

  const handleSmsKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !smsCode[index] && index > 0) {
      smsInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasswordSetupStep2 = async () => {
    const code = smsCode.join('');
    if (code.length !== 5) {
      Alert.alert('Xatolik', 'Kod 5 ta raqamdan iborat bo\'lishi kerak');
      return;
    }

    setSetupLoading(true);
    try {
      const response = await apiService.passwordSetupStep2(getFullPhoneNumber(setupPhone), code);
      if (response.success) {
        Alert.alert('Muvaffaqiyat', response.message);
        setSetupStep('password');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Kod noto\'g\'ri';
      Alert.alert('Xatolik', errorMessage);
      // Reset SMS code on error
      setSmsCode(['', '', '', '', '']);
      smsInputRefs.current[0]?.focus();
    } finally {
      setSetupLoading(false);
    }
  };

  const handlePasswordSetupStep3 = async () => {
    if (setupPassword.length < 6) {
      Alert.alert('Xatolik', 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    if (setupPassword !== setupPasswordConfirm) {
      Alert.alert('Xatolik', 'Parollar mos kelmaydi');
      return;
    }

    setSetupLoading(true);
    try {
      const response = await apiService.passwordSetupStep3(getFullPhoneNumber(setupPhone), setupPassword);
      if (response.success) {
        Alert.alert('Muvaffaqiyat', response.message, [
          {
            text: 'OK',
            onPress: async () => {
              // Auto login after password setup
              try {
                await login({ phone: getFullPhoneNumber(setupPhone), password: setupPassword });
                setShowPasswordSetup(false);
                resetPasswordSetup();
                router.replace('/(tabs)/orders');
              } catch (error: any) {
                Alert.alert('Xatolik', 'Avtomatik kirishda xatolik yuz berdi. Qo\'lda kirishga urinib ko\'ring.');
              }
            },
          },
        ]);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Parol o\'rnatishda xatolik';
      Alert.alert('Xatolik', errorMessage);
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
                <Ionicons name="compass-outline" size={64} color="#007AFF" />
              </View>
              <Text style={styles.title}>Agent Tizimi</Text>
              <Text style={styles.subtitle}>Hisobingizga kiring</Text>
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

                {/* New User Button */}
                <TouchableOpacity
                  style={styles.newUserButton}
                  onPress={() => setShowPasswordSetup(true)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person-add-outline" size={18} color="#007AFF" style={styles.newUserIcon} />
                  <Text style={styles.newUserText}>Yangi foydalanuvchi</Text>
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
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
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
                  
                  <View style={styles.smsCodeContainer}>
                    {smsCode.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => (smsInputRefs.current[index] = ref)}
                        style={[
                          styles.smsCodeInput,
                          digit && styles.smsCodeInputFilled,
                        ]}
                        value={digit}
                        onChangeText={(value) => handleSmsCodeChange(index, value)}
                        onKeyPress={({ nativeEvent }) => handleSmsKeyPress(index, nativeEvent.key)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                        editable={!setupLoading}
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handlePasswordSetupStep1}
                    disabled={setupLoading}
                  >
                    <Text style={styles.resendText}>Kodni qayta yuborish</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, setupLoading && styles.buttonDisabled]}
                    onPress={handlePasswordSetupStep2}
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
  newUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  newUserIcon: {
    marginRight: 8,
  },
  newUserText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
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
  smsCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  smsCodeInput: {
    flex: 1,
    height: 64,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    backgroundColor: '#fafafa',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  smsCodeInputFilled: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
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
