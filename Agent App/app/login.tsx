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
import { getDeviceInfo, getUserAgent } from '../utils/device';

type PasswordSetupStep = 'phone' | 'sms' | 'password';
type DeviceVerificationStep = 'request' | 'verify';

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

  // Device Verification States
  const [showDeviceVerification, setShowDeviceVerification] = useState(false);
  const [deviceVerificationStep, setDeviceVerificationStep] = useState<DeviceVerificationStep>('request');
  const [deviceVerificationCode, setDeviceVerificationCode] = useState(['', '', '', '', '']);
  const [deviceVerificationLoading, setDeviceVerificationLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const deviceVerificationInputRefs = useRef<(TextInput | null)[]>([]);

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

  // Initialize device info on mount
  useEffect(() => {
    const initDeviceInfo = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
    };
    initDeviceInfo();
  }, []);

  // Auto request SMS code when device verification modal opens
  useEffect(() => {
    if (showDeviceVerification && deviceVerificationStep === 'request' && deviceInfo && phone.trim()) {
      // Auto request SMS code when modal opens
      const timer = setTimeout(() => {
        handleRequestDeviceVerificationCode();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showDeviceVerification, deviceVerificationStep, deviceInfo, phone]);

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

    if (!deviceInfo) {
      Alert.alert('Xatolik', 'Qurilma ma\'lumotlari yuklanmoqda. Iltimos, biroz kuting.');
      return;
    }

    setLoading(true);
    try {
      await login(
        { phone: getFullPhoneNumber(phone), password },
        deviceInfo ? {
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          platform: deviceInfo.platform,
          os: deviceInfo.os,
          browser: deviceInfo.browser,
          userAgent: getUserAgent(),
        } : undefined
      );
      router.replace('/(tabs)/orders');
    } catch (error: any) {
      // Check if device verification is required
      const responseData = error.response?.data || error.data || {};
      const errorMessage = responseData.message || error.message || '';
      const requiresVerification = 
        responseData.requiresDeviceVerification === true || 
        responseData.requiresDeviceVerification === 'true' ||
        errorMessage.toLowerCase().includes('qurilma') ||
        errorMessage.toLowerCase().includes('device') ||
        errorMessage.toLowerCase().includes('yangi qurilma') ||
        errorMessage.toLowerCase().includes('tasdiqlash');
      const statusCode = error.response?.status || error.status || 0;
      
      // Debug log
      console.log('Login error:', {
        statusCode,
        requiresVerification,
        responseData,
        errorMessage,
        fullError: error,
      });
      
      if ((statusCode === 403 || statusCode === 400) && requiresVerification) {
        // Device verification required - don't show error, open modal
        console.log('Opening device verification modal');
        console.log('Error response data:', responseData);
        
        // Use phone and deviceId from error response if available
        const errorData = responseData.data || {};
        const errorPhone = errorData.phone;
        const errorDeviceId = errorData.deviceId;
        
        // Set phone from error response if available
        if (errorPhone && !phone.trim()) {
          const phoneFromError = errorPhone.replace(/[^0-9+]/g, '');
          if (phoneFromError.startsWith('+998')) {
            const phoneDigits = phoneFromError.slice(4);
            setPhone(phoneDigits.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4'));
          }
        }
        
        // Update deviceId from error response if available
        if (errorDeviceId && deviceInfo) {
          setDeviceInfo({
            ...deviceInfo,
            deviceId: errorDeviceId,
          });
        }
        
        // Don't request code here, let useEffect handle it when modal opens
        setShowDeviceVerification(true);
        setDeviceVerificationStep('request');
        setLoading(false);
        return;
      }
      
      // Handle other errors
      let finalErrorMessage = 'Kirishda xatolik yuz berdi';
      
      if (statusCode === 401) {
        finalErrorMessage = 'Telefon raqami yoki parol noto\'g\'ri';
      } else if (statusCode === 403) {
        finalErrorMessage = errorMessage || 'Hisob faol emas';
      } else if (statusCode === 400) {
        finalErrorMessage = errorMessage || 'Ma\'lumotlar noto\'g\'ri';
      } else if (errorMessage) {
        finalErrorMessage = errorMessage;
      }

      Alert.alert('Xatolik', finalErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Device Verification Handlers
  const handleRequestDeviceVerificationCode = async () => {
    if (!deviceInfo) {
      Alert.alert('Xatolik', 'Qurilma ma\'lumotlari topilmadi');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Xatolik', 'Telefon raqami topilmadi');
      return;
    }

    setDeviceVerificationLoading(true);
    try {
      console.log('Requesting device verification code:', {
        phone: getFullPhoneNumber(phone),
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        platform: deviceInfo.platform,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
      });

      const response = await apiService.requestDeviceVerificationCode({
        phone: getFullPhoneNumber(phone),
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        platform: deviceInfo.platform,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        userAgent: getUserAgent(),
      });

      console.log('Device verification code response:', response);

      if (response.success) {
        // Don't show alert, just move to verify step
        setDeviceVerificationStep('verify');
        // Focus first SMS input
        setTimeout(() => {
          deviceVerificationInputRefs.current[0]?.focus();
        }, 200);
      } else {
        const errorMessage = response.message || 'Kod yuborishda xatolik';
        // Check if device not found error
        const isDeviceNotFound = errorMessage.toLowerCase().includes('qurilma topilmadi') ||
                                 errorMessage.toLowerCase().includes('device not found') ||
                                 errorMessage.toLowerCase().includes('qurilma') && errorMessage.toLowerCase().includes('topilmadi');
        
        if (isDeviceNotFound) {
          Alert.alert('Xatolik', errorMessage, [
            {
              text: 'OK',
              onPress: () => {
                setShowDeviceVerification(false);
                resetDeviceVerification();
              },
            },
          ]);
        } else {
          Alert.alert('Xatolik', errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Device verification code error:', error);
      const errorData = error.response?.data || {};
      const errorMessage = errorData.message || error.message || 'Kod yuborishda xatolik yuz berdi';
      console.log('Error details:', {
        status: error.response?.status,
        data: errorData,
        message: errorMessage,
      });
      
      // Check if device not found error
      const isDeviceNotFound = errorMessage.toLowerCase().includes('qurilma topilmadi') ||
                               errorMessage.toLowerCase().includes('device not found') ||
                               errorMessage.toLowerCase().includes('qurilma') && errorMessage.toLowerCase().includes('topilmadi') ||
                               error.response?.status === 404;
      
      if (isDeviceNotFound) {
        Alert.alert('Xatolik', errorMessage, [
          {
            text: 'OK',
            onPress: () => {
              setShowDeviceVerification(false);
              resetDeviceVerification();
            },
          },
        ]);
      } else {
        Alert.alert('Xatolik', errorMessage);
      }
    } finally {
      setDeviceVerificationLoading(false);
    }
  };

  const handleDeviceVerificationCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    const newCode = [...deviceVerificationCode];
    newCode[index] = value.replace(/\D/g, '');
    setDeviceVerificationCode(newCode);

    // Auto focus next input
    if (value && index < 4) {
      deviceVerificationInputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all fields filled
    if (newCode.every(digit => digit !== '') && index === 4) {
      handleVerifyDevice();
    }
  };

  const handleDeviceVerificationKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !deviceVerificationCode[index] && index > 0) {
      deviceVerificationInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyDevice = async () => {
    if (!deviceInfo) return;

    const code = deviceVerificationCode.join('');
    if (code.length !== 5) {
      Alert.alert('Xatolik', 'Kod 5 ta raqamdan iborat bo\'lishi kerak');
      return;
    }

    setDeviceVerificationLoading(true);
    try {
      console.log('Verifying device with code:', {
        phone: getFullPhoneNumber(phone),
        deviceId: deviceInfo.deviceId,
        code,
      });

      const response = await apiService.verifyDevice({
        phone: getFullPhoneNumber(phone),
        deviceId: deviceInfo.deviceId,
        code,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        platform: deviceInfo.platform,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        userAgent: getUserAgent(),
      });

      console.log('Device verification response:', response);

      if (response.success) {
        Alert.alert('Muvaffaqiyat', response.message, [
          {
            text: 'OK',
            onPress: async () => {
              // Close modal and try login again
              setShowDeviceVerification(false);
              resetDeviceVerification();
              // Retry login
              setLoading(true);
              try {
                await login(
                  { phone: getFullPhoneNumber(phone), password },
                  deviceInfo ? {
                    deviceId: deviceInfo.deviceId,
                    deviceName: deviceInfo.deviceName,
                    deviceType: deviceInfo.deviceType,
                    platform: deviceInfo.platform,
                    os: deviceInfo.os,
                    browser: deviceInfo.browser,
                    userAgent: getUserAgent(),
                  } : undefined
                );
                router.replace('/(tabs)/orders');
              } catch (error: any) {
                // Check if device verification is still required
                const responseData = error.response?.data;
                const requiresVerification = responseData?.requiresDeviceVerification === true;
                const statusCode = error.response?.status || error.status;
                
                if (statusCode === 403 && requiresVerification) {
                  // Device verification still required - reopen modal
                  setShowDeviceVerification(true);
                  setDeviceVerificationStep('request');
                  setTimeout(() => {
                    handleRequestDeviceVerificationCode();
                  }, 300);
                } else {
                  const errorMessage = error.response?.data?.message || error.message || 'Kirishda xatolik';
                  Alert.alert('Xatolik', errorMessage);
                }
              } finally {
                setLoading(false);
              }
            },
          },
        ]);
      } else {
        // Handle case where response.success is false
        const errorMessage = response.message || 'Kod noto\'g\'ri';
        console.log('Device verification failed:', errorMessage);
        
        // Check if device not found error
        const isDeviceNotFound = errorMessage.toLowerCase().includes('qurilma topilmadi') ||
                                 errorMessage.toLowerCase().includes('device not found') ||
                                 errorMessage.toLowerCase().includes('qurilma') && errorMessage.toLowerCase().includes('topilmadi');
        
        if (isDeviceNotFound) {
          Alert.alert('Xatolik', errorMessage, [
            {
              text: 'OK',
              onPress: () => {
                setShowDeviceVerification(false);
                resetDeviceVerification();
              },
            },
          ]);
        } else {
          Alert.alert('Xatolik', errorMessage);
          // Reset SMS code on error
          setDeviceVerificationCode(['', '', '', '', '']);
          deviceVerificationInputRefs.current[0]?.focus();
        }
      }
    } catch (error: any) {
      console.error('Device verification error:', error);
      const errorData = error.response?.data || {};
      const errorMessage = errorData.message || error.message || 'Kod noto\'g\'ri';
      console.log('Error details:', {
        status: error.response?.status,
        data: errorData,
        message: errorMessage,
      });
      
      // Check if device not found error
      const isDeviceNotFound = errorMessage.toLowerCase().includes('qurilma topilmadi') ||
                               errorMessage.toLowerCase().includes('device not found') ||
                               errorMessage.toLowerCase().includes('qurilma') && errorMessage.toLowerCase().includes('topilmadi') ||
                               error.response?.status === 404;
      
      if (isDeviceNotFound) {
        Alert.alert('Xatolik', errorMessage, [
          {
            text: 'OK',
            onPress: () => {
              setShowDeviceVerification(false);
              resetDeviceVerification();
            },
          },
        ]);
      } else {
        Alert.alert('Xatolik', errorMessage);
        // Reset SMS code on error
        setDeviceVerificationCode(['', '', '', '', '']);
        deviceVerificationInputRefs.current[0]?.focus();
      }
    } finally {
      setDeviceVerificationLoading(false);
    }
  };

  const handleResendDeviceVerificationCode = async () => {
    if (!deviceInfo) return;
    await handleRequestDeviceVerificationCode();
  };

  const resetDeviceVerification = () => {
    setDeviceVerificationStep('request');
    setDeviceVerificationCode(['', '', '', '', '']);
  };

  const handleCloseDeviceVerification = () => {
    if (deviceVerificationLoading) return;
    resetDeviceVerification();
    setShowDeviceVerification(false);
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
                await login(
                  { phone: getFullPhoneNumber(setupPhone), password: setupPassword },
                  deviceInfo ? {
                    deviceId: deviceInfo.deviceId,
                    deviceName: deviceInfo.deviceName,
                    deviceType: deviceInfo.deviceType,
                    platform: deviceInfo.platform,
                    os: deviceInfo.os,
                    browser: deviceInfo.browser,
                    userAgent: getUserAgent(),
                  } : undefined
                );
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
                        ref={(ref) => {
                          smsInputRefs.current[index] = ref;
                        }}
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

      {/* Device Verification Modal */}
      <Modal
        visible={showDeviceVerification}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseDeviceVerification}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {deviceVerificationStep === 'request' && 'Qurilma tasdiqlash'}
                {deviceVerificationStep === 'verify' && 'SMS kodni kiriting'}
              </Text>
              <TouchableOpacity
                onPress={handleCloseDeviceVerification}
                style={styles.closeButton}
                disabled={deviceVerificationLoading}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Step 1: Request Code */}
              {deviceVerificationStep === 'request' && (
                <View style={styles.setupStepContainer}>
                  <View style={styles.deviceInfoContainer}>
                    <Ionicons name="phone-portrait-outline" size={48} color="#007AFF" />
                    <Text style={styles.deviceInfoText}>
                      {deviceInfo?.deviceName || 'Qurilma'}
                    </Text>
                    <Text style={styles.deviceInfoSubtext}>
                      {deviceInfo?.platform || 'Platform'} • {deviceInfo?.os || 'OS'}
                    </Text>
                  </View>
                  <Text style={styles.setupDescription}>
                    Yangi qurilma aniqlandi. Tizimga kirish uchun qurilmani tasdiqlash kerak.
                    {deviceVerificationLoading ? (
                      ' Telefon raqamingizga SMS kod yuborilmoqda...'
                    ) : (
                      ' Telefon raqamingizga SMS kod yuborildi.'
                    )}
                  </Text>
                  {deviceVerificationLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#007AFF" />
                      <Text style={styles.loadingText}>SMS kod yuborilmoqda...</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.button}
                      onPress={handleRequestDeviceVerificationCode}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.buttonText}>Kodni qayta yuborish</Text>
                      <Ionicons name="refresh-outline" size={20} color="#fff" style={styles.buttonIcon} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Step 2: Verify Code */}
              {deviceVerificationStep === 'verify' && (
                <View style={styles.setupStepContainer}>
                  <Text style={styles.setupDescription}>
                    {getFullPhoneNumber(phone)} raqamiga yuborilgan kodni kiriting
                  </Text>
                  
                  <View style={styles.smsCodeContainer}>
                    {deviceVerificationCode.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          deviceVerificationInputRefs.current[index] = ref;
                        }}
                        style={[
                          styles.smsCodeInput,
                          digit && styles.smsCodeInputFilled,
                        ]}
                        value={digit}
                        onChangeText={(value) => handleDeviceVerificationCodeChange(index, value)}
                        onKeyPress={({ nativeEvent }) => handleDeviceVerificationKeyPress(index, nativeEvent.key)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                        editable={!deviceVerificationLoading}
                      />
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendDeviceVerificationCode}
                    disabled={deviceVerificationLoading}
                  >
                    <Text style={styles.resendText}>Kodni qayta yuborish</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, deviceVerificationLoading && styles.buttonDisabled]}
                    onPress={handleVerifyDevice}
                    disabled={deviceVerificationLoading || deviceVerificationCode.some(d => !d)}
                    activeOpacity={0.8}
                  >
                    {deviceVerificationLoading ? (
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
  deviceInfoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#f5f7fa',
    borderRadius: 16,
  },
  deviceInfoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
    textAlign: 'center',
  },
  deviceInfoSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
