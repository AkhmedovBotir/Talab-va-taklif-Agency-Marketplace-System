import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AppSnackbar, { SnackbarType } from '../components/AppSnackbar';
import AuthScreenLayout from '../components/AuthScreenLayout';
import { apiService } from '../services/api';
import AuthCodeInputs from '../components/AuthCodeInputs';
import { authScreenStyles } from '../utils/authLayout';
import { useAuthResponsiveStyles } from '../utils/useAuthResponsiveStyles';
import { getDeviceInfo } from '../utils/deviceId';

export default function DeviceVerificationScreen() {
  const params = useLocalSearchParams<{ phone: string; deviceId: string }>();
  const router = useRouter();
  const responsive = useAuthResponsiveStyles();
  
  const [code, setCode] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('error');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const phone = params.phone || '';
  const deviceId = params.deviceId || '';

  const showSnackbar = (message: string, type: SnackbarType = 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  useEffect(() => {
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
      showSnackbar('Tasdiqlash kodi yuborildi', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Kod yuborishda xatolik');
    } finally {
      setRequestingCode(false);
    }
  };

  const resendCode = async () => {
    if (!phone || !deviceId) return;

    setRequestingCode(true);
    try {
      await apiService.resendDeviceVerificationCode({
        phone,
        deviceId,
      });
      setCode(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
      showSnackbar('Tasdiqlash kodi qayta yuborildi', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Kod yuborishda xatolik');
    } finally {
      setRequestingCode(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

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
      showSnackbar('Kod 5 raqamdan iborat bo\'lishi kerak');
      return;
    }

    if (!phone || !deviceId) {
      showSnackbar('Ma\'lumotlar to\'liq emas');
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

      showSnackbar(
        response.data.isNew
          ? 'Yangi qurilma tasdiqlandi. Endi login qiling.'
          : 'Qurilma tasdiqlandi. Endi login qiling.',
        'success'
      );
      setTimeout(() => {
        router.replace('/login');
      }, 700);
    } catch (error: any) {
      showSnackbar(error.message || 'Kod noto\'g\'ri yoki muddati tugagan');
      setCode(['', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthScreenLayout>
        <View style={authScreenStyles.header}>
          <View style={authScreenStyles.iconContainer}>
            <Ionicons name="shield-checkmark" size={64} color="#007AFF" />
          </View>
          <Text style={[authScreenStyles.title, authScreenStyles.titleCompact]}>Qurilma tasdiqlash</Text>
          <Text style={[authScreenStyles.subtitle, authScreenStyles.subtitleCompact]}>
            Yangi qurilma aniqlandi. SMS kod orqali tasdiqlang
          </Text>
        </View>

        <View style={[authScreenStyles.card, responsive.cardExtra]}>
          <View style={authScreenStyles.form}>
            <View style={authScreenStyles.phoneDisplay}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <Text style={authScreenStyles.phoneText}>{phone}</Text>
            </View>

            <View style={authScreenStyles.codeContainer}>
              <Text style={authScreenStyles.codeLabel}>Tasdiqlash kodi</Text>
              <AuthCodeInputs
                code={code}
                loading={loading}
                inputRefs={inputRefs}
                onChange={handleCodeChange}
                onKeyPress={handleKeyPress}
              />
            </View>

            <TouchableOpacity
              style={[authScreenStyles.button, loading && authScreenStyles.buttonDisabled]}
              onPress={() => handleVerify()}
              disabled={loading || code.join('').length !== 5}
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

            <TouchableOpacity
              style={authScreenStyles.resendButton}
              onPress={resendCode}
              disabled={requestingCode || loading}
              activeOpacity={0.8}
            >
              {requestingCode ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={18} color="#007AFF" />
                  <Text style={authScreenStyles.resendText}>Kodni qayta yuborish</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={authScreenStyles.footerInfoText}>
              SMS kod 10 daqiqa amal qiladi. Agar kod kelmagan bo'lsa, "Kodni qayta yuborish" tugmasini bosing.
            </Text>
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
