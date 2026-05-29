import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppSnackbar, { SnackbarType } from '../../components/AppSnackbar';
import AuthScreenLayout from '../../components/AuthScreenLayout';
import { apiService } from '../../services/api';
import AuthCodeInputs from '../../components/AuthCodeInputs';
import { authScreenStyles } from '../../utils/authLayout';
import { useAuthResponsiveStyles } from '../../utils/useAuthResponsiveStyles';

export default function PasswordSetupStep2Screen() {
  const responsive = useAuthResponsiveStyles();
  const params = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('error');
  const router = useRouter();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const phone = params.phone || '';

  const showSnackbar = (message: string, type: SnackbarType = 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const handleCodeChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    
    if (digit) {
      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);

      if (index < 4 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }

      if (newCode.every(c => c !== '') && index === 4) {
        handleVerifyCode(newCode.join(''));
      }
    } else {
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
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
      
      setCode(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
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
            <Ionicons name="shield-checkmark" size={64} color="#007AFF" />
          </View>
          <Text style={authScreenStyles.title}>Kodni tasdiqlash</Text>
          <Text style={authScreenStyles.subtitle}>Telefon raqamingizga yuborilgan kodni kiriting</Text>
        </View>

        <View style={[authScreenStyles.card, responsive.cardExtra]}>
          <View style={authScreenStyles.form}>
            <View style={authScreenStyles.phoneDisplayAlt}>
              <Ionicons name="call" size={16} color="#007AFF" />
              <Text style={authScreenStyles.phoneTextAccent}>{phone}</Text>
            </View>

            <View style={authScreenStyles.codeContainer}>
              <Text style={authScreenStyles.codeLabel}>Tasdiqlash kodi</Text>
              <AuthCodeInputs
                code={code}
                loading={loading}
                inputRefs={inputRefs}
                large
                onChange={(index, value) => handleCodeChange(value, index)}
                onKeyPress={(index, key) => handleKeyPress(key, index)}
              />
              <Text style={authScreenStyles.hintText}>5 ta raqamdan iborat kod</Text>
            </View>

            <TouchableOpacity
              style={authScreenStyles.resendButtonInline}
              onPress={handleResendCode}
              disabled={resending || loading}
              activeOpacity={0.7}
            >
              {resending ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={18} color="#007AFF" />
                  <Text style={authScreenStyles.resendButtonText}>Kodni qayta yuborish</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                authScreenStyles.button,
                (loading || code.some(c => c === '')) && authScreenStyles.buttonDisabled,
              ]}
              onPress={() => handleVerifyCode()}
              disabled={loading || code.some(c => c === '')}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={authScreenStyles.buttonText}>Tasdiqlash</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={authScreenStyles.buttonIcon} />
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
