import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AppSnackbar, { SnackbarType } from '../../components/AppSnackbar';
import AuthScreenLayout from '../../components/AuthScreenLayout';
import { apiService } from '../../services/api';
import { authScreenStyles } from '../../utils/authLayout';
import { useAuthResponsiveStyles } from '../../utils/useAuthResponsiveStyles';

export default function PasswordSetupStep1Screen() {
  const responsive = useAuthResponsiveStyles();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('error');
  const router = useRouter();

  const showSnackbar = (message: string, type: SnackbarType = 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

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

  const handleRequestCode = async () => {
    if (!phone.trim()) {
      showSnackbar('Telefon raqami kiritilishi shart');
      return;
    }

    if (!validatePhone()) {
      showSnackbar('Telefon raqami 9 ta raqamdan iborat bo\'lishi kerak');
      return;
    }

    setLoading(true);
    try {
      await apiService.passwordSetupStep1({ phone: getFullPhoneNumber() });
      showSnackbar('Tasdiqlash kodi telefon raqamingizga yuborildi', 'success');
      setTimeout(() => {
        router.push({
          pathname: '/password-setup/step2',
          params: { phone: getFullPhoneNumber() },
        });
      }, 700);
    } catch (error: any) {
      let errorMessage = 'Kod yuborishda xatolik yuz berdi';
      
      if (error.status === 400) {
        errorMessage = error.message || 'Ma\'lumotlar noto\'g\'ri';
      } else if (error.status === 404) {
        errorMessage = 'Kontragent topilmadi';
      } else if (error.message) {
        errorMessage = error.message;
      }

      showSnackbar(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthScreenLayout>
        <View style={authScreenStyles.headerWithBack}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={authScreenStyles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={[authScreenStyles.iconContainer, authScreenStyles.iconContainerCompact]}>
            <Ionicons name="lock-closed" size={64} color="#007AFF" />
          </View>
          <Text style={authScreenStyles.title}>Parol o'rnatish</Text>
          <Text style={authScreenStyles.subtitle}>Telefon raqamingizni kiriting</Text>
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

            <View style={authScreenStyles.infoContainer}>
              <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
              <Text style={authScreenStyles.infoText}>
                Tasdiqlash kodi telefon raqamingizga SMS orqali yuboriladi
              </Text>
            </View>

            <TouchableOpacity
              style={[authScreenStyles.button, loading && authScreenStyles.buttonDisabled]}
              onPress={handleRequestCode}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={authScreenStyles.buttonText}>Kod yuborish</Text>
                  <Ionicons name="send" size={20} color="#fff" style={authScreenStyles.buttonIcon} />
                </>
              )}
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
