// Profile Screen
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { apiService } from '../../services/api';
import type { Agent, KPISummary } from '../../types/api';
import { getApiErrorMessage, isLoginPasswordNotSetMessage } from '../../utils/apiError';

interface AgentLocationNames {
  viloyat: string | null;
  tuman: string | null;
  mfy: string | null;
}

export default function ProfileScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const webContentWidth = isWeb ? Math.min(820, Math.max(320, windowWidth - 40)) : undefined;
  const infoMultiCol = isWeb && windowWidth >= 640;
  const infoItemWidthStyle: ViewStyle | undefined = infoMultiCol
    ? {
        width: windowWidth >= 1080 ? '31%' : '48%',
        minWidth: 220,
        maxWidth: '100%',
      }
    : undefined;
  const webPwdOverlay = isWeb
    ? ({
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        padding: 24,
      } as const)
    : undefined;
  const webPwdCard = isWeb
    ? {
        maxWidth: Math.min(480, windowWidth - 48),
        width: '100%' as const,
        borderRadius: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: Math.min(620, windowHeight * 0.88),
      }
    : undefined;

  const { logout } = useAuth();
  const { showConfirm, showSnackbar } = useSnackbar();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [locationNames, setLocationNames] = useState<AgentLocationNames>({
    viloyat: null,
    tuman: null,
    mfy: null,
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [kpiSummary, setKpiSummary] = useState<KPISummary | null>(null);
  const [loadingKPI, setLoadingKPI] = useState(true);

  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [changePwdLoading, setChangePwdLoading] = useState(false);

  const resetChangePasswordForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOldPwd(false);
    setShowNewPwd(false);
  };

  const closeChangePasswordModal = () => {
    resetChangePasswordForm();
    setChangePwdOpen(false);
  };

  const dismissChangePasswordModal = () => {
    if (changePwdLoading) return;
    closeChangePasswordModal();
  };

  const submitChangePassword = async () => {
    if (!oldPassword.trim()) {
      showSnackbar('Joriy parolni kiriting', { variant: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      showSnackbar('parol kamida 6 ta belgidan iborat bo\'lishi kerak', { variant: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showSnackbar('Yangi parollar mos kelmaydi', { variant: 'error' });
      return;
    }
    if (oldPassword === newPassword) {
      showSnackbar('Yangi parol joriy paroldan farq qilishi kerak', { variant: 'error' });
      return;
    }

    setChangePwdLoading(true);
    try {
      const { message } = await apiService.changeAgentPassword(oldPassword, newPassword);
      showSnackbar(message, { variant: 'success' });
      resetChangePasswordForm();
      setChangePwdOpen(false);
    } catch (error: any) {
      const status = error.response?.status;
      const bodyMsg =
        typeof error.response?.data?.message === 'string' ? error.response.data.message.trim() : '';
      if (status === 400 && isLoginPasswordNotSetMessage(bodyMsg)) {
        showSnackbar(bodyMsg, { variant: 'info', duration: 5000 });
        resetChangePasswordForm();
        setChangePwdOpen(false);
        return;
      }
      showSnackbar(getApiErrorMessage(error, 'Parolni almashtirishda xatolik'), { variant: 'error' });
    } finally {
      setChangePwdLoading(false);
    }
  };

  const handleLogout = async () => {
    const ok = await showConfirm({
      title: 'Chiqish',
      message: 'Haqiqatan ham hisobingizdan chiqmoqchimisiz?',
      confirmText: 'Chiqish',
      cancelText: 'Bekor qilish',
      destructive: true,
    });
    if (ok) {
      await logout();
      router.replace('/login');
    }
  };

  useEffect(() => {
    loadProfile();
    loadKPISummary();
  }, []);

  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      const response = await apiService.getAgentProfile();
      if (response.success && response.data) {
        setAgent(response.data);
      }
    } catch (error: any) {
      console.error('Profile load error:', error);
      showSnackbar(getApiErrorMessage(error, 'Profilni yuklashda xatolik'), { variant: 'error' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadKPISummary = async () => {
    try {
      const response = await apiService.getKPISummary();
      if (response.success) {
        setKpiSummary(response.data);
      }
    } catch (error: any) {
      // Silently fail - KPI is optional
    } finally {
      setLoadingKPI(false);
    }
  };

  useEffect(() => {
    const loadLocationNames = async () => {
      if (!agent) return;
      const hasEmbedded =
        Boolean(agent.viloyat?.name) && Boolean(agent.tuman?.name) && Boolean(agent.mfy?.name);
      if (hasEmbedded) {
        setLocationNames({
          viloyat: agent.viloyat?.name ?? null,
          tuman: agent.tuman?.name ?? null,
          mfy: agent.mfy?.name ?? null,
        });
        return;
      }

      try {
        const next: AgentLocationNames = {
          viloyat: agent.viloyat?.name ?? null,
          tuman: agent.tuman?.name ?? null,
          mfy: agent.mfy?.name ?? null,
        };

        if (!next.viloyat && agent.viloyat_id != null) {
          const regions = await apiService.getNoAuthRegions();
          next.viloyat = regions.find((x) => x.id === agent.viloyat_id)?.name ?? null;
        }
        if (!next.tuman && agent.tuman_id != null) {
          const districts = await apiService.getNoAuthDistricts(agent.viloyat_id);
          next.tuman = districts.find((x) => x.id === agent.tuman_id)?.name ?? null;
        }
        if (!next.mfy && agent.mfy_id != null) {
          const mfys = await apiService.getNoAuthMfys(agent.tuman_id);
          next.mfy = mfys.find((x) => x.id === agent.mfy_id)?.name ?? null;
        }

        setLocationNames(next);
      } catch {
        // Lookup ixtiyoriy: API ishlamasa ham ID fallback qoladi.
      }
    };

    loadLocationNames();
  }, [agent]);


  if (loadingProfile) {
    return (
      <View style={[styles.centerContainer, isWeb && styles.centerWeb]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ma'lumotlar yuklanmoqda...</Text>
      </View>
    );
  }

  if (!agent) {
    return (
      <View style={[styles.centerContainer, isWeb && styles.centerWeb]}>
        <Text style={styles.errorText}>Agent ma'lumotlari topilmadi</Text>
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={isWeb ? styles.scrollContentWeb : undefined}
    >
      <View
        style={[
          styles.pageInner,
          isWeb && webContentWidth != null && { width: webContentWidth, maxWidth: '100%' as const },
        ]}
      >
      <View style={[styles.headerCard, isWeb && styles.headerCardWeb]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleSection}>
            <Text style={[styles.name, isWeb && windowWidth >= 900 && styles.nameWebLarge]}>{agent.name}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="person-circle" size={14} color="#007AFF" />
              <Text style={styles.role}>Agent</Text>
            </View>
          </View>
          {agent.status === 'active' && (
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Faol</Text>
            </View>
          )}
        </View>

        <View style={[styles.infoGrid, infoMultiCol && styles.infoGridWeb]}>
          <View style={[styles.infoItem, infoItemWidthStyle]}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="call" size={18} color="#007AFF" />
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Telefon</Text>
              <Text style={styles.infoValue}>{agent.phone}</Text>
            </View>
          </View>

          {(agent.viloyat || agent.viloyat_id != null) && (
            <View style={[styles.infoItem, infoItemWidthStyle]}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="location" size={18} color="#007AFF" />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Viloyat</Text>
                <Text style={styles.infoValue}>
                  {locationNames.viloyat ?? (agent.viloyat_id != null ? `#${agent.viloyat_id}` : '—')}
                </Text>
              </View>
            </View>
          )}

          {(agent.tuman || agent.tuman_id != null) && (
            <View style={[styles.infoItem, infoItemWidthStyle]}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="location" size={18} color="#007AFF" />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Tuman</Text>
                <Text style={styles.infoValue}>
                  {locationNames.tuman ?? (agent.tuman_id != null ? `#${agent.tuman_id}` : '—')}
                </Text>
              </View>
            </View>
          )}

          {(agent.mfy || agent.mfy_id != null) && (
            <View style={[styles.infoItem, infoItemWidthStyle]}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="location" size={18} color="#007AFF" />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>MFY</Text>
                <Text style={styles.infoValue}>
                  {locationNames.mfy ?? (agent.mfy_id != null ? `#${agent.mfy_id}` : '—')}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {!loadingKPI && kpiSummary && (
        <View style={[styles.kpiSection, isWeb && styles.kpiSectionWeb]}>
          <Text style={styles.kpiSectionTitle}>KPI Bonus</Text>
          <View style={styles.kpiCard}>
            <View style={styles.kpiRow}>
              <View style={styles.kpiItem}>
                <Ionicons name="wallet" size={24} color="#007AFF" />
                <Text style={styles.kpiLabel}>Jami bonus</Text>
                <Text style={styles.kpiValue}>
                  {(kpiSummary.totalAmount || 0).toLocaleString()} so'm
                </Text>
              </View>
            </View>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiItem, styles.kpiItemHalf]}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.kpiLabel}>To'langan</Text>
                <Text style={[styles.kpiValue, styles.kpiValuePaid]}>
                  {(kpiSummary.paidAmount || 0).toLocaleString()} so'm
                </Text>
              </View>
              <View style={[styles.kpiItem, styles.kpiItemHalf]}>
                <Ionicons name="time" size={20} color="#FF9500" />
                <Text style={styles.kpiLabel}>To'lanmagan</Text>
                <Text style={[styles.kpiValue, styles.kpiValueUnpaid]}>
                  {(kpiSummary.unpaidAmount || 0).toLocaleString()} so'm
                </Text>
              </View>
            </View>
            <View style={styles.kpiFooter}>
              <Text style={styles.kpiTransactions}>
                Jami transaksiyalar: {kpiSummary.totalTransactions || 0}
              </Text>
            </View>
          </View>
        </View>
      )}

      {loadingKPI && (
        <View style={[styles.kpiSection, isWeb && styles.kpiSectionWeb]}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}

      {!loadingKPI && kpiSummary && (
        <View style={[styles.section, isWeb && styles.sectionWeb]}>
          <TouchableOpacity 
            style={styles.kpiButton}
            onPress={() => router.push('/kpi')}
          >
            <Ionicons name="wallet" size={20} color="#007AFF" />
            <Text style={styles.kpiButtonText}>KPI transaksiyalarini ko'rish</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.section, isWeb && styles.sectionWeb]}>
        <TouchableOpacity 
          style={styles.kpiButton}
          onPress={() => router.push('/(tabs)/notifications')}
        >
          <Ionicons name="notifications" size={20} color="#5856D6" />
          <Text style={styles.kpiButtonText}>Habarlar</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, isWeb && styles.sectionWeb]}>
        <TouchableOpacity
          style={styles.kpiButton}
          onPress={() => setChangePwdOpen(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="key-outline" size={20} color="#007AFF" />
          <Text style={styles.kpiButtonText}>Parolni almashtirish</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, isWeb && styles.sectionWeb]}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutButtonText}>Hisobdan chiqish</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.bottomPadding, isWeb && styles.bottomPaddingWeb]} />
      </View>
    </ScrollView>

      <Modal
        visible={changePwdOpen}
        animationType="slide"
        transparent
        onRequestClose={dismissChangePasswordModal}
      >
        <KeyboardAvoidingView
          style={[styles.pwdModalOverlay, webPwdOverlay]}
          behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        >
          <TouchableOpacity
            style={styles.pwdModalBackdrop}
            activeOpacity={1}
            onPress={dismissChangePasswordModal}
          />
          <View style={[styles.pwdModalCard, webPwdCard]}>
            <View style={styles.pwdModalHeader}>
              <Text style={styles.pwdModalTitle}>Parolni almashtirish</Text>
              <TouchableOpacity onPress={dismissChangePasswordModal} disabled={changePwdLoading} hitSlop={12}>
                <Ionicons name="close" size={26} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.pwdModalHint}>
              Joriy parolingizni kiriting, so‘ng yangi parol (kamida 6 belgi) va tasdiqlang.
            </Text>

            <Text style={styles.pwdLabel}>Joriy parol</Text>
            <View style={styles.pwdInputRow}>
              <TextInput
                style={styles.pwdInput}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOldPwd}
                placeholder="Joriy parol"
                placeholderTextColor="#999"
                autoCapitalize="none"
                editable={!changePwdLoading}
              />
              <TouchableOpacity onPress={() => setShowOldPwd(!showOldPwd)} style={styles.pwdEye}>
                <Ionicons name={showOldPwd ? 'eye-outline' : 'eye-off-outline'} size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.pwdLabel}>Yangi parol</Text>
            <View style={styles.pwdInputRow}>
              <TextInput
                style={styles.pwdInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPwd}
                placeholder="Kamida 6 belgi"
                placeholderTextColor="#999"
                autoCapitalize="none"
                editable={!changePwdLoading}
              />
              <TouchableOpacity onPress={() => setShowNewPwd(!showNewPwd)} style={styles.pwdEye}>
                <Ionicons name={showNewPwd ? 'eye-outline' : 'eye-off-outline'} size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.pwdLabel}>Yangi parolni tasdiqlang</Text>
            <View style={styles.pwdInputRow}>
              <TextInput
                style={styles.pwdInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showNewPwd}
                placeholder="Parolni takrorlang"
                placeholderTextColor="#999"
                autoCapitalize="none"
                editable={!changePwdLoading}
                onSubmitEditing={submitChangePassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.pwdSubmit, changePwdLoading && styles.pwdSubmitDisabled]}
              onPress={submitChangePassword}
              disabled={changePwdLoading}
            >
              {changePwdLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.pwdSubmitText}>Saqlash</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContentWeb: {
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  pageInner: {
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerWeb: {
    width: '100%',
    maxWidth: 820,
    alignSelf: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  headerCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerCardWeb: {
    marginHorizontal: 0,
    marginTop: 4,
    width: '100%',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitleSection: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  nameWebLarge: {
    fontSize: 28,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  role: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  statusText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  infoGrid: {
    gap: 16,
  },
  infoGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    rowGap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionWeb: {
    paddingHorizontal: 0,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
  bottomPaddingWeb: {
    height: 40,
  },
  kpiSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  kpiSectionWeb: {
    paddingHorizontal: 0,
    width: '100%',
  },
  kpiSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  kpiItemHalf: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  kpiValuePaid: {
    color: '#34C759',
  },
  kpiValueUnpaid: {
    color: '#FF9500',
  },
  kpiFooter: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  kpiTransactions: {
    fontSize: 12,
    color: '#666',
  },
  kpiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pwdModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  pwdModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  pwdModalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  pwdModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pwdModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  pwdModalHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
    lineHeight: 16,
  },
  pwdLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },
  pwdInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    marginBottom: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  pwdInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  pwdEye: {
    padding: 8,
  },
  pwdSubmit: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  pwdSubmitDisabled: {
    opacity: 0.65,
  },
  pwdSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});



