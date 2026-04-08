import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
import { formatPhoneNumber, formatPhoneForApi, removeCountryCode, formatPhoneForDisplay } from '../../utils/phoneFormatter';
import { useSnackbar } from '../../components/SnackbarProvider';

export default function ProfileScreen() {
  const { deliveryProvider, token, refreshProfile, logout } = useDeliveryProviderAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: deliveryProvider?.name || '',
    phone: deliveryProvider ? removeCountryCode(deliveryProvider.phone) : '',
    notes: deliveryProvider?.notes || '',
  });
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  useEffect(() => {
    if (deliveryProvider) {
      setFormData({
        name: deliveryProvider.name,
        phone: removeCountryCode(deliveryProvider.phone),
        notes: deliveryProvider.notes || '',
      });
    }
  }, [deliveryProvider]);

  const handlePhoneChange = (text: string) => {
    // Faqat raqamlarni qabul qilish
    const numbers = text.replace(/\D/g, '');
    // Maksimal 9 ta raqam (+998 dan keyin)
    if (numbers.length <= 9) {
      setFormData({ ...formData, phone: formatPhoneNumber(numbers) });
    }
  };

  const handleSave = async () => {
    if (!token) return;

    if (!formData.name.trim() || !formData.phone.trim()) {
      showSnackbar('Ism va telefon raqami majburiy', 'error');
      return;
    }

    // Telefon raqamni API formatiga o'tkazish
    const formattedPhone = formatPhoneForApi(formData.phone);
    
    if (formattedPhone.length < 13) {
      showSnackbar('Telefon raqam to\'liq emas', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiService.updateMyProfile(token, {
        name: formData.name.trim(),
        phone: formattedPhone,
        notes: formData.notes.trim() || undefined,
      });
      await refreshProfile();
      setEditing(false);
      showSnackbar('Profil yangilandi', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Profilni yangilashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Tizimdan chiqmoqchimisiz?');
      if (!confirmed) return;
    }
    logout().then(() => router.replace('/login'));
  };

  const handleChangePassword = async () => {
    if (!token) return;
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

    setPasswordLoading(true);
    try {
      await apiService.changePassword(token, { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSnackbar('Parol muvaffaqiyatli o\'zgartirildi', 'success');
    } catch (error: any) {
      showSnackbar(error.message || 'Parolni o\'zgartirishda xatolik', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!deliveryProvider) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color="#007AFF" />
        </View>
        <Text style={styles.headerName}>{deliveryProvider.name}</Text>
        <Text style={styles.headerPhone}>
          {formatPhoneForDisplay(deliveryProvider.phone)}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Shaxsiy ma&apos;lumotlar</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ism</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Ismingizni kiriting"
              editable={!loading}
            />
          ) : (
            <Text style={styles.value}>{deliveryProvider.name}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Telefon raqami</Text>
          {editing ? (
            <View style={styles.phoneInputGroup}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+998</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="90 123 45 67"
                value={formData.phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                editable={!loading}
                maxLength={13} // 90 123 45 67 = 13 belgi (bo'shliqlar bilan)
              />
            </View>
          ) : (
            <Text style={styles.value}>
              {formatPhoneForDisplay(deliveryProvider.phone)}
            </Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Eslatmalar</Text>
          {editing ? (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Eslatmalar"
              multiline
              numberOfLines={4}
              editable={!loading}
            />
          ) : (
            <Text style={styles.value}>
              {deliveryProvider.notes || 'Eslatmalar yo\'q'}
            </Text>
          )}
        </View>

        {editing ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setEditing(false);
                setFormData({
                  name: deliveryProvider.name,
                  phone: deliveryProvider.phone,
                  notes: deliveryProvider.notes || '',
                });
              }}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Bekor qilish</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Saqlash</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setEditing(true)}
          >
            <Text style={styles.buttonText}>Tahrirlash</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="lock-closed-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Parolni o&apos;zgartirish</Text>
        </View>

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
              editable={!passwordLoading}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
              <Ionicons name={showCurrentPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Yangi parol</Text>
          <View style={styles.passwordInputGroup}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Yangi parol (min 6 belgi)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              editable={!passwordLoading}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowNewPassword(!showNewPassword)}>
              <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tasdiqlash paroli</Text>
          <View style={styles.passwordInputGroup}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Yangi parolni qayta kiriting"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!passwordLoading}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.button, passwordLoading && styles.buttonDisabled]} onPress={handleChangePassword} disabled={passwordLoading}>
          {passwordLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Parolni o&apos;zgartirish</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Hisob holati</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Holat:</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  deliveryProvider.status === 'active' ? '#34C759' : '#FF9500',
              },
            ]}
          >
            <Text style={styles.statusText}>
              {deliveryProvider.status === 'active' ? 'Faol' : 'Nofaol'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Chiqish</Text>
      </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  headerSection: {
    width: '100%',
    maxWidth: 900,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerPhone: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    width: '100%',
    maxWidth: 900,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  inputContainer: {
    marginBottom: 16,
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
  phoneInputGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  countryCode: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  value: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButton: {
    backgroundColor: '#34C759',
    shadowColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
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
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
