import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function PasswordSetupStep3Screen() {
  const responsive = useAuthResponsiveStyles();
  const params = useLocalSearchParams<{ phone: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<SnackbarType>('error');
  const router = useRouter();

  const phone = params.phone || '';

  const showSnackbar = (message: string, type: SnackbarType = 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const handleSubmit = async () => {
    if (!password.trim()) {
      showSnackbar('Parol kiritilishi shart');
      return;
    }

    if (password.length < 6) {
      showSnackbar('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    if (password !== confirmPassword) {
      showSnackbar('Parollar mos kelmaydi');
      return;
    }

    setLoading(true);
    try {
      await apiService.passwordSetupStep3({
        phone,
        password,
      });

      showSnackbar('Parol muvaffaqiyatli o\'rnatildi', 'success');
      setTimeout(() => {
        router.replace('/login');
      }, 700);
    } catch (error: any) {
      let errorMessage = 'Parol o\'rnatishda xatolik yuz berdi';
      
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
          <Text style={authScreenStyles.subtitle}>Yangi parolni kiriting</Text>
        </View>

        <View style={[authScreenStyles.card, responsive.cardExtra]}>
          <View style={authScreenStyles.form}>
            <View style={authScreenStyles.phoneDisplayAlt}>
              <Ionicons name="call" size={16} color="#007AFF" />
              <Text style={authScreenStyles.phoneTextAccent}>{phone}</Text>
            </View>

            <View style={authScreenStyles.inputContainer}>
              <Text style={authScreenStyles.label}>Yangi parol</Text>
              <View style={[authScreenStyles.inputWrapper, responsive.inputWrapperExtra]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color="#666" 
                  style={[authScreenStyles.inputIcon, responsive.inputIconExtra]}
                />
                <TextInput
                  style={[authScreenStyles.input, authScreenStyles.passwordInput, responsive.inputExtra]}
                  placeholder="Kamida 6 ta belgi"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
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
              <Text style={authScreenStyles.hintTextLeft}>Kamida 6 ta belgi</Text>
            </View>

            <View style={authScreenStyles.inputContainer}>
              <Text style={authScreenStyles.label}>Parolni tasdiqlash</Text>
              <View style={[authScreenStyles.inputWrapper, responsive.inputWrapperExtra]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color="#666" 
                  style={[authScreenStyles.inputIcon, responsive.inputIconExtra]}
                />
                <TextInput
                  style={[authScreenStyles.input, authScreenStyles.passwordInput, responsive.inputExtra]}
                  placeholder="Parolni qayta kiriting"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={[authScreenStyles.eyeIcon, responsive.eyeIconExtra]}
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
              style={[authScreenStyles.button, loading && authScreenStyles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={authScreenStyles.buttonText}>Parolni o'rnatish</Text>
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
