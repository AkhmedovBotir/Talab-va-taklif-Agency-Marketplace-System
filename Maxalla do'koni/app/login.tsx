import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import AppSnackbar, { SnackbarType } from '../components/AppSnackbar';
import AuthScreenLayout from '../components/AuthScreenLayout';
import { useAuth } from '../contexts/AuthContext';
import { authScreenStyles } from '../utils/authLayout';
import { useAuthResponsiveStyles } from '../utils/useAuthResponsiveStyles';

export default function LoginScreen() {
  const responsive = useAuthResponsiveStyles();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('error');

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

  const getFullPhoneNumber = (): string => {
    return '+998' + phone.replace(/\s/g, '');
  };

  const validatePhone = (): boolean => {
    const digits = phone.replace(/\s/g, '');
    return digits.length === 9;
  };

  const showSnackbar = (message: string, type: SnackbarType = 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const handleLogin = async () => {
    if (!phone.trim()) {
      showSnackbar('Telefon raqami kiritilishi shart');
      return;
    }

    if (!validatePhone()) {
      showSnackbar('Telefon raqami 9 ta raqamdan iborat bo\'lishi kerak');
      return;
    }

    if (!password.trim()) {
      showSnackbar('Parol kiritilishi shart');
      return;
    }

    setLoading(true);
    try {
      await login(getFullPhoneNumber(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      const responseData = error.response?.data || error.data || {};
      const errorMessage = responseData.message || error.message || '';
      const statusCode = error.response?.status || error.status || 0;
      
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

      showSnackbar(finalErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AuthScreenLayout>
        <View style={authScreenStyles.header}>
          <View style={authScreenStyles.iconContainer}>
            <Ionicons name="business" size={64} color="#007AFF" />
          </View>
          <Text style={authScreenStyles.title}>Maxalla dokoni</Text>
          <Text style={authScreenStyles.subtitle}>Tizimga kirish</Text>
        </View>

        <View style={[authScreenStyles.card, responsive.cardExtra]}>
          <View style={authScreenStyles.form}>
            <View style={authScreenStyles.inputContainer}>
              <Text style={authScreenStyles.label}>Telefon raqami</Text>
              <View style={[authScreenStyles.inputWrapper, responsive.inputWrapperExtra]}>
                <Ionicons 
                  name="call-outline" 
                  size={20} 
                  color="#666" 
                  style={[authScreenStyles.inputIcon, responsive.inputIconExtra]}
                />
                <Text style={[authScreenStyles.phonePrefix, responsive.phonePrefixExtra]}>+998</Text>
                <View style={[authScreenStyles.phoneDivider, responsive.phoneDividerExtra]} />
                <TextInput
                  style={[authScreenStyles.input, responsive.inputExtra]}
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

            <View style={authScreenStyles.inputContainer}>
              <Text style={authScreenStyles.label}>Parol</Text>
              <View style={[authScreenStyles.inputWrapper, responsive.inputWrapperExtra]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color="#666" 
                  style={[authScreenStyles.inputIcon, responsive.inputIconExtra]}
                />
                <TextInput
                  style={[authScreenStyles.input, authScreenStyles.passwordInput, responsive.inputExtra]}
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
                  style={[authScreenStyles.eyeIcon, responsive.eyeIconExtra]}
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

            <TouchableOpacity
              style={[authScreenStyles.button, loading && authScreenStyles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={authScreenStyles.buttonText}>Kirish</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={authScreenStyles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>

            <View style={authScreenStyles.dividerContainer}>
              <View style={authScreenStyles.divider} />
              <Text style={authScreenStyles.dividerText}>yoki</Text>
              <View style={authScreenStyles.divider} />
            </View>

            <TouchableOpacity
              style={authScreenStyles.secondaryButton}
              onPress={() => router.push('/password-setup/step1')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="lock-open-outline" size={20} color="#007AFF" style={[authScreenStyles.secondaryButtonIcon, responsive.inputIconExtra]} />
              <Text style={authScreenStyles.secondaryButtonText}>Yangi Maxalla dokoni uchun</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AuthScreenLayout>
      <AppSnackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onHide={() => setSnackbarVisible(false)}
      />
    </>
  );
}
