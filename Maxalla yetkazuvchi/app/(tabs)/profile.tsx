import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { useDeliveryProviderAuth } from '../../contexts/DeliveryProviderAuthContext';
import {
  formatPhoneNumber,
  formatPhoneForApi,
  removeCountryCode,
  formatPhoneForDisplay,
} from '../../utils/phoneFormatter';
import { AppTextInput } from '../../components/AppTextInput';
import { useSnackbar } from '../../components/SnackbarProvider';

type SettingsModal = 'profile' | 'password' | null;

export default function ProfileScreen() {
  const { deliveryProvider, token, refreshProfile, logout } = useDeliveryProviderAuth();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  const [activeModal, setActiveModal] = useState<SettingsModal>(null);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: deliveryProvider?.name || '',
    phone: deliveryProvider ? removeCountryCode(deliveryProvider.phone) : '',
    notes: deliveryProvider?.notes || '',
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (deliveryProvider) {
      setFormData({
        name: deliveryProvider.name,
        phone: removeCountryCode(deliveryProvider.phone),
        notes: deliveryProvider.notes || '',
      });
    }
  }, [deliveryProvider]);

  const closeModal = () => setActiveModal(null);

  const openProfileModal = () => {
    if (deliveryProvider) {
      setFormData({
        name: deliveryProvider.name,
        phone: removeCountryCode(deliveryProvider.phone),
        notes: deliveryProvider.notes || '',
      });
    }
    setActiveModal('profile');
  };

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setActiveModal('password');
  };

  const handlePhoneChange = (text: string) => {
    const numbers = text.replace(/\D/g, '');
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
      showSnackbar('Profil yangilandi', 'success');
      closeModal();
    } catch (error: any) {
      showSnackbar(error.message || 'Profilni yangilashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
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
      showSnackbar('Parol muvaffaqiyatli o\'zgartirildi', 'success');
      closeModal();
    } catch (error: any) {
      showSnackbar(error.message || 'Parolni o\'zgartirishda xatolik', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    const doLogout = () => logout().then(() => router.replace('/login'));

    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm('Tizimdan chiqmoqchimisiz?')) void doLogout();
      return;
    }

    Alert.alert('Chiqish', 'Tizimdan chiqmoqchimisiz?', [
      { text: 'Bekor qilish', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: () => void doLogout() },
    ]);
  };

  if (!deliveryProvider) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const isActive = deliveryProvider.status === 'active';

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#2563EB" />
          </View>
          <Text style={styles.headerName}>{deliveryProvider.name}</Text>
          <Text style={styles.headerPhone}>{formatPhoneForDisplay(deliveryProvider.phone)}</Text>
        </View>

        <View style={styles.menuCard}>
          <Text style={styles.menuTitle}>Sozlamalar</Text>

          <SettingsRow
            icon="person-outline"
            title="Shaxsiy ma'lumotlar"
            subtitle="Ism, telefon, eslatmalar"
            onPress={openProfileModal}
          />
          <View style={styles.menuDivider} />
          <SettingsRow
            icon="lock-closed-outline"
            title="Parolni o'zgartirish"
            subtitle="Xavfsizlik"
            onPress={openPasswordModal}
          />
          <View style={styles.menuDivider} />
          <View style={styles.menuRowStatic}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#2563EB" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuRowTitle}>Hisob holati</Text>
                <Text style={styles.menuRowSubtitle}>{isActive ? 'Hisob faol' : 'Hisob nofaol'}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isActive ? '#22C55E' : '#F59E0B' }]}>
              <Text style={styles.statusText}>{isActive ? 'Faol' : 'Nofaol'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Chiqish</Text>
        </TouchableOpacity>
      </ScrollView>

      <SettingsModalShell
        visible={activeModal === 'profile'}
        title="Shaxsiy ma'lumotlar"
        onClose={closeModal}
      >
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Ism</Text>
          <AppTextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Ismingizni kiriting"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Telefon raqami</Text>
          <View style={styles.phoneInputGroup}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+998</Text>
            </View>
            <AppTextInput
              style={styles.phoneInput}
              placeholder="90 123 45 67"
              value={formData.phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              editable={!loading}
              maxLength={13}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Eslatmalar</Text>
          <AppTextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Eslatmalar"
            multiline
            numberOfLines={4}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Saqlash</Text>}
        </TouchableOpacity>
      </SettingsModalShell>

      <SettingsModalShell
        visible={activeModal === 'password'}
        title="Parolni o'zgartirish"
        onClose={closeModal}
      >
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Joriy parol</Text>
          <View style={styles.passwordInputGroup}>
            <AppTextInput
              style={styles.passwordInput}
              placeholder="Joriy parolni kiriting"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
              editable={!passwordLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Ionicons name={showCurrentPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Yangi parol</Text>
          <View style={styles.passwordInputGroup}>
            <AppTextInput
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
            <AppTextInput
              style={styles.passwordInput}
              placeholder="Yangi parolni qayta kiriting"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!passwordLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, passwordLoading && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={passwordLoading}
        >
          {passwordLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Parolni o&apos;zgartirish</Text>
          )}
        </TouchableOpacity>
      </SettingsModalShell>
    </>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuRowLeft}>
        <View style={styles.menuIconWrap}>
          <Ionicons name={icon} size={22} color="#2563EB" />
        </View>
        <View style={styles.menuTextWrap}>
          <Text style={styles.menuRowTitle}>{title}</Text>
          <Text style={styles.menuRowSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
    </TouchableOpacity>
  );
}

function SettingsModalShell({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} accessibilityRole="button" />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 20, alignItems: 'center', paddingBottom: 32 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  headerSection: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#0F172A',
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
    marginBottom: 14,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  headerPhone: { fontSize: 15, color: '#64748B' },
  menuCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  menuRowStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuTextWrap: { flex: 1 },
  menuRowTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  menuRowSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 76 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  logoutButton: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#EF4444',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', flex: 1 },
  modalClose: { padding: 4 },
  modalScroll: { maxHeight: 520 },
  modalScrollContent: { padding: 20, paddingBottom: 28 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#0F172A',
  },
  phoneInputGroup: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  countryCode: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: '#E5E7EB',
  },
  countryCodeText: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  phoneInput: { flex: 1, padding: 14, fontSize: 16, backgroundColor: '#F9FAFB' },
  textArea: { height: 96, textAlignVertical: 'top' },
  passwordInputGroup: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  passwordInput: { flex: 1, padding: 14, fontSize: 16, color: '#0F172A' },
  eyeButton: { padding: 12 },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
});
