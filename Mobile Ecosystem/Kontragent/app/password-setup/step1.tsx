import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';

export default function PasswordSetupStep1Screen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
      Alert.alert('Xatolik', 'Telefon raqami kiritilishi shart');
      return;
    }

    if (!validatePhone()) {
      Alert.alert('Xatolik', 'Telefon raqami 9 ta raqamdan iborat bo\'lishi kerak');
      return;
    }

    setLoading(true);
    try {
      await apiService.passwordSetupStep1({ phone: getFullPhoneNumber() });
      Alert.alert('Muvaffaqiyatli', 'Tasdiqlash kodi telefon raqamingizga yuborildi', [
        {
          text: 'OK',
          onPress: () => {
            router.push({
              pathname: '/password-setup/step2',
              params: { phone: getFullPhoneNumber() },
            });
          },
        },
      ]);
    } catch (error: any) {
      let errorMessage = 'Kod yuborishda xatolik yuz berdi';
      
      if (error.status === 400) {
        errorMessage = error.message || 'Ma\'lumotlar noto\'g\'ri';
      } else if (error.status === 404) {
        errorMessage = 'Kontragent topilmadi';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Xatolik', errorMessage);
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
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={64} color="#007AFF" />
            </View>
            <Text style={styles.title}>Parol o'rnatish</Text>
            <Text style={styles.subtitle}>Telefon raqamingizni kiriting</Text>
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

              {/* Info Text */}
              <View style={styles.infoContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
                <Text style={styles.infoText}>
                  Tasdiqlash kodi telefon raqamingizga SMS orqali yuboriladi
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRequestCode}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Kod yuborish</Text>
                    <Ionicons name="send" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#007AFF',
    marginLeft: 8,
    lineHeight: 18,
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
});


