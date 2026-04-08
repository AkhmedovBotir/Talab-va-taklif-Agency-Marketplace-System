import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { useDeliveryProviderAuth } from '../../contexts/DeliveryProviderAuthContext';
import { useSnackbar } from '../../components/SnackbarProvider';

export default function SettingsScreen() {
  const { token } = useDeliveryProviderAuth();
  const { showSnackbar } = useSnackbar();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showSnackbar('Barcha maydonlarni to\'ldiring', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showSnackbar('Yangi parol kamida 6 belgidan iborat bo\'lishi kerak', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showSnackbar('Yangi parol va tasdiqlash paroli mos kelmaydi', 'error');
      return;
    }

    if (currentPassword === newPassword) {
      showSnackbar('Yangi parol joriy paroldan farq qilishi kerak', 'error');
      return;
    }

    if (!token) return;

    setLoading(true);
    try {
      await apiService.changePassword(token, {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSnackbar('Parol muvaffaqiyatli o\'zgartirildi', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Parolni o\'zgartirishda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parolni o&apos;zgartirish</Text>
        <Text style={styles.description}>
          Xavfsizlik uchun parolingizni muntazam ravishda o&apos;zgartirishni tavsiya qilamiz.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Joriy parol</Text>
          <View style={styles.passwordInputGroup}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Joriy parolni kiriting"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              disabled={loading}
            >
              <Ionicons
                name={showCurrentPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Yangi parol</Text>
          <View style={styles.passwordInputGroup}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Yangi parolni kiriting (min. 6 belgi)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNewPassword(!showNewPassword)}
              disabled={loading}
            >
              <Ionicons
                name={showNewPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            Kamida 6 belgidan iborat bo&apos;lishi kerak
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Yangi parolni tasdiqlash</Text>
          <View style={styles.passwordInputGroup}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Yangi parolni qayta kiriting"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Parolni o&apos;zgartirish</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Xavfsizlik tavsiyalari</Text>
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>• Parolni hech kimga bermang</Text>
          <Text style={styles.tipText}>• Parolni muntazam o&apos;zgartiring</Text>
          <Text style={styles.tipText}>
            • Kuchli parol ishlating (harflar, raqamlar, belgilar)
          </Text>
          <Text style={styles.tipText}>
            • Boshqa saytlarda ishlatilgan parollardan foydalanmang
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  section: {
    width: '100%',
    maxWidth: 900,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1A1A1A',
  },
  passwordInputGroup: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  eyeButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 6,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tipContainer: {
    gap: 12,
  },
  tipText: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
});
