import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { useSnackbar } from '../../components/AppSnackbar';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../contexts/AuthContext';
import {
  apiService,
  contragentLogoToImageUri,
  ContragentDeliveryAreaRow,
} from '../../services/api';

const isValidPickedImageDataUrl = (value?: string) =>
  !!value && /^data:image\/(jpeg|png|jpg|webp);base64,/i.test(value);

export default function ProfileScreen() {
  const { contragent, logout, refreshContragent } = useAuth();
  const router = useRouter();
  const { show: showSnackbar } = useSnackbar();
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(undefined);
  const [deliveryAreaRows, setDeliveryAreaRows] = useState<ContragentDeliveryAreaRow[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const { isWideWeb, isDesktopWeb, maxPageWidth, pageGutter, width } = useResponsive();

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const modalMaxWidth = Math.min(440, width - 32);
  const hasGeo =
    !!(contragent?.viloyat?.name || contragent?.tuman?.name || contragent?.mfy?.name);
  const contragentIdLabel =
    contragent?.id != null ? String(contragent.id) : contragent?._id || '';

  const fetchUnreadCount = async () => {
    try {
      const response = await apiService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch {
      // ignore
    }
  };

  const loadDeliveryRegions = useCallback(async () => {
    try {
      setLoadingRegions(true);
      const { data } = await apiService.getContragentDeliveryAreas();
      if (data.region_ids.length === 0 || data.district_ids.length === 0) {
        setDeliveryAreaRows([]);
        return;
      }
      const rows = await apiService.resolveContragentDeliveryAreaRows(data);
      setDeliveryAreaRows(rows);
    } catch {
      setDeliveryAreaRows([]);
    } finally {
      setLoadingRegions(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDeliveryRegions();
    }, [loadDeliveryRegions])
  );

  useEffect(() => {
    const uri = contragentLogoToImageUri(contragent?.logo);
    setLogoPreview(uri);
  }, [contragent?.logo, contragent?.has_logo]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshContragent(), fetchUnreadCount(), loadDeliveryRegions()]);
    } catch {
      showSnackbar('Ma’lumotlarni yangilashda xatolik', { title: 'Xatolik', variant: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  const uploadLogo = async () => {
    try {
      setUploadingLogo(true);

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/jpg,image/webp';
        input.style.display = 'none';
        const cleanup = () => {
          if (input.parentNode) input.parentNode.removeChild(input);
        };
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (!file) {
            setUploadingLogo(false);
            cleanup();
            return;
          }
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = reader.result as string;
            if (isValidPickedImageDataUrl(base64)) {
              setLogoPreview(base64);
              await apiService.updateLogo({ logo: base64 });
              await refreshContragent();
              showSnackbar('Logo yangilandi', { title: 'Muvaffaqiyatli', variant: 'success' });
            } else {
              showSnackbar('Rasm formati noto‘g‘ri (JPEG, PNG)', { title: 'Xatolik', variant: 'error' });
            }
            setUploadingLogo(false);
            cleanup();
          };
          reader.onerror = () => {
            showSnackbar('Rasm o‘qishda xatolik', { title: 'Xatolik', variant: 'error' });
            setUploadingLogo(false);
            cleanup();
          };
          reader.readAsDataURL(file);
        };
        document.body.appendChild(input);
        input.click();
        return;
      }

      launchImageLibrary(
        {
          mediaType: 'photo' as MediaType,
          quality: 0.6,
          includeBase64: true,
          maxWidth: 2000,
          maxHeight: 2000,
        },
        async (response: ImagePickerResponse) => {
          if (response.didCancel) {
            setUploadingLogo(false);
            return;
          }

          if (response.errorMessage) {
            showSnackbar(response.errorMessage, { title: 'Xatolik', variant: 'error' });
            setUploadingLogo(false);
            return;
          }

          if (response.assets && response.assets[0]?.base64) {
            const asset = response.assets[0];
            const mimeType = asset.type || 'image/jpeg';
            const base64 = `data:${mimeType};base64,${asset.base64}`;

            if (isValidPickedImageDataUrl(base64)) {
              setLogoPreview(base64);
              await apiService.updateLogo({ logo: base64 });
              await refreshContragent();
              showSnackbar('Logo yangilandi', { title: 'Muvaffaqiyatli', variant: 'success' });
            } else {
              showSnackbar('Rasm formati noto‘g‘ri', { title: 'Xatolik', variant: 'error' });
            }
          }
          setUploadingLogo(false);
        }
      );
    } catch (error: unknown) {
      const message =
        (error as { message?: string })?.message || 'Logo yangilashda xatolik yuz berdi';
      showSnackbar(message, { title: 'Xatolik', variant: 'error' });
      setUploadingLogo(false);
    }
  };

  const closePasswordModal = () => {
    if (passwordSubmitting) return;
    setPasswordModalVisible(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const submitPasswordChange = async () => {
    if (!oldPassword.trim()) {
      showSnackbar('Joriy parolni kiriting', { title: 'Xatolik', variant: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      showSnackbar('Yangi parol kamida 6 belgi', { title: 'Xatolik', variant: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showSnackbar('Yangi parollar mos kelmaydi', { title: 'Xatolik', variant: 'error' });
      return;
    }
    setPasswordSubmitting(true);
    try {
      const res = await apiService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      showSnackbar(res.message || 'Parol yangilandi', { title: 'Muvaffaqiyatli', variant: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordModalVisible(false);
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      showSnackbar(err.message || 'Parolni almashtirib bo‘lmadi', { title: 'Xatolik', variant: 'error' });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleSelectDeliveryRegions = () => {
    router.push({
      pathname: '/(tabs)/ombor/product/select-regions' as any,
      params: {
        returnPath: '/(tabs)/profile',
        deliveryApiVersion: 'v1',
      },
    });
  };

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Tizimdan chiqmoqchimisiz?', [
      { text: 'Bekor qilish', style: 'cancel' },
      {
        text: 'Chiqish',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const avatarUri = logoPreview ?? contragentLogoToImageUri(contragent?.logo);

  const profileHeader = (
    <View style={styles.profileCard}>
      <View style={styles.avatarWrapper}>
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.logoImage} resizeMode="cover" />
          ) : (
            <Ionicons name="business" size={isDesktopWeb ? 40 : 48} color="#007AFF" />
          )}
        </View>

        <TouchableOpacity
          style={[styles.editAvatarButton, uploadingLogo && styles.editAvatarButtonDisabled]}
          onPress={uploadLogo}
          disabled={uploadingLogo}
          activeOpacity={0.85}
        >
          {uploadingLogo ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="camera" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
      <Text style={[styles.companyName, isDesktopWeb && styles.companyNameDesktop]}>
        {contragent?.name || 'Kontragent'}
      </Text>
      {!!contragent?.inn && <Text style={styles.inn}>INN: {contragent.inn}</Text>}
    </View>
  );

  const detailsSection = (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionTitle}>Ma’lumotlar</Text>

      {!!contragentIdLabel && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Kontragent ID</Text>
          <Text style={styles.detailValue} selectable>
            {contragentIdLabel}
          </Text>
        </View>
      )}

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Telefon</Text>
        <Text style={styles.detailValue} selectable>
          {contragent?.phone || '—'}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>INN</Text>
        <Text style={styles.detailValue}>{contragent?.inn || '—'}</Text>
      </View>

      {hasGeo ? (
        <>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Viloyat</Text>
            <Text style={styles.detailValue}>{contragent?.viloyat?.name || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tuman</Text>
            <Text style={styles.detailValue}>{contragent?.tuman?.name || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>MFY</Text>
            <Text style={styles.detailValue}>{contragent?.mfy?.name || '—'}</Text>
          </View>
        </>
      ) : (
        <Text style={styles.hintMuted}>
        </Text>
      )}

      <View style={[styles.detailRow, styles.detailRowLast]}>
        <Text style={styles.detailLabel}>Holat</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {contragent?.status === 'active' ? 'Faol' : contragent?.status || '—'}
          </Text>
        </View>
      </View>
    </View>
  );

  const regionsSection = (
    <View style={styles.detailsCard}>
      <Text style={styles.sectionTitle}>Yetkazib berish hududlari</Text>

      {loadingRegions ? (
        <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 16 }} />
      ) : (
        <>
          {deliveryAreaRows.length > 0 ? (
            <View style={styles.regionsList}>
              {deliveryAreaRows.map((row, index) => (
                <View key={`${row.regionId}-${row.districtId}-${index}`} style={styles.regionItem}>
                  <Ionicons name="location" size={16} color="#007AFF" />
                  <Text style={styles.regionText}>
                    {row.regionName}, {row.districtName}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noRegionsText}>Hozircha yetkazib berish hududlari tanlanmagan</Text>
          )}

          <TouchableOpacity style={styles.editRegionsButton} onPress={handleSelectDeliveryRegions}>
            <Ionicons name="location-outline" size={20} color="#007AFF" />
            <Text style={styles.editRegionsButtonText}>
              {deliveryAreaRows.length > 0 ? 'Hududlarni yangilash' : 'Hududlarni tanlash'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const actionsSection = (
    <View style={styles.actionsCard}>
      <Text style={styles.sectionTitle}>Amallar</Text>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setPasswordModalVisible(true)}
      >
        <Ionicons name="key-outline" size={24} color="#007AFF" />
        <Text style={styles.actionButtonText}>Parolni o‘zgartirish</Text>
        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/habarlar')}>
        <View style={styles.actionIconContainer}>
          <Ionicons name="chatbubbles" size={24} color="#007AFF" />
          {unreadCount > 0 && (
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.actionButtonText}>Habarlar</Text>
        {unreadCount > 0 && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>Yangi {unreadCount} ta</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
      </TouchableOpacity>
    </View>
  );

  const logoutBtn = (
    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
      <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
      <Text style={styles.logoutButtonText}>Chiqish</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollInner,
          {
            paddingHorizontal: pageGutter,
            paddingBottom: isWideWeb ? 28 : 24,
            maxWidth: maxPageWidth,
            width: '100%',
            alignSelf: 'center',
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isWideWeb ? (
          <View>
            <View style={styles.webProfileHeader}>{profileHeader}</View>
            <View style={styles.webColumns}>
              <View style={styles.webColLeft}>
                {detailsSection}
              </View>
              <View style={styles.webColRight}>
                {regionsSection}
                {actionsSection}
              </View>
            </View>
            {logoutBtn}
          </View>
        ) : (
          <View style={styles.mobileStack}>
            {profileHeader}
            {detailsSection}
            {regionsSection}
            {actionsSection}
            {logoutBtn}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closePasswordModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={closePasswordModal} />
          <View style={[styles.modalCard, { maxWidth: modalMaxWidth, width: '100%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Parolni o‘zgartirish</Text>
              <Pressable
                onPress={closePasswordModal}
                hitSlop={12}
                disabled={passwordSubmitting}
                accessibilityLabel="Yopish"
              >
                <Ionicons name="close" size={26} color="#666" />
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>Joriy parol</Text>
            <View style={styles.modalInputWrap}>
              <TextInput
                style={styles.modalInput}
                secureTextEntry={!showOldPw}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="••••••"
                placeholderTextColor="#999"
                autoCapitalize="none"
                editable={!passwordSubmitting}
              />
              <TouchableOpacity onPress={() => setShowOldPw(!showOldPw)}>
                <Ionicons name={showOldPw ? 'eye-off-outline' : 'eye-outline'} size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Yangi parol</Text>
            <View style={styles.modalInputWrap}>
              <TextInput
                style={styles.modalInput}
                secureTextEntry={!showNewPw}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Kamida 6 belgi"
                placeholderTextColor="#999"
                autoCapitalize="none"
                editable={!passwordSubmitting}
              />
              <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)}>
                <Ionicons name={showNewPw ? 'eye-off-outline' : 'eye-outline'} size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Tasdiqlash</Text>
            <View style={styles.modalInputWrap}>
              <TextInput
                style={styles.modalInput}
                secureTextEntry={!showConfirmPw}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Yangi parol yana bir marta"
                placeholderTextColor="#999"
                autoCapitalize="none"
                editable={!passwordSubmitting}
              />
              <TouchableOpacity onPress={() => setShowConfirmPw(!showConfirmPw)}>
                <Ionicons name={showConfirmPw ? 'eye-off-outline' : 'eye-outline'} size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, passwordSubmitting && styles.modalBtnDisabled]}
              onPress={submitPasswordChange}
              disabled={passwordSubmitting}
            >
              {passwordSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalPrimaryBtnText}>Saqlash</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={closePasswordModal}
              disabled={passwordSubmitting}
            >
              <Text style={styles.modalSecondaryBtnText}>Bekor qilish</Text>
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
    backgroundColor: '#f0f2f5',
  },
  scrollInner: {
    flexGrow: 1,
    paddingTop: 16,
  },
  mobileStack: {
    width: '100%',
  },
  webProfileHeader: {
    marginBottom: 16,
  },
  webColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'flex-start',
  },
  webColLeft: {
    flex: 1,
    minWidth: 280,
    flexBasis: 0,
  },
  webColRight: {
    flex: 1,
    minWidth: 280,
    flexBasis: 0,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  companyNameDesktop: {
    fontSize: 18,
  },
  inn: {
    fontSize: 14,
    color: '#666',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 6,
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  editAvatarButtonDisabled: {
    opacity: 0.6,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  hintMuted: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 18,
  },
  statusBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionIconContainer: {
    position: 'relative',
  },
  actionBadge: {
    position: 'absolute',
    right: -8,
    top: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  actionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  newBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  newBadgeText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  regionsList: {
    marginBottom: 12,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  regionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  noRegionsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },
  editRegionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  editRegionsButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    zIndex: 1,
    borderWidth: 1,
    borderColor: '#e8eaed',
    ...Platform.select({
      web: {
        boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
      },
      default: {},
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    backgroundColor: '#fafafa',
    minHeight: 48,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
  },
  modalPrimaryBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  modalPrimaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBtnDisabled: {
    opacity: 0.7,
  },
  modalSecondaryBtn: {
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSecondaryBtnText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
});
