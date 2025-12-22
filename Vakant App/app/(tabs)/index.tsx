import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  PermissionsAndroid,
  RefreshControl,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { DatePicker } from '@/components/DatePicker';
import { RegionPicker } from '@/components/RegionPicker';
import { Ionicons } from '@expo/vector-icons';
import { profileApi, ApplicantProfile } from '@/services/profileApi';
import { Region } from '@/services/api';
import { useNotifications } from '@/contexts/NotificationContext';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [locationModal, setLocationModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await profileApi.getProfile();
      if (data) {
        setProfile(data);
        updateUser(data as any);
      } else {
        setProfile(null);
      }
    } catch (error: any) {
      console.error('Profile load error:', error);
      setProfile(null);
      // Don't show alert if it's a 401/unauthorized error as it will redirect to login
      if (!error.message?.includes('Avtorizatsiya')) {
        Alert.alert('Xatolik', error.message || 'Profil ma\'lumotlarini yuklashda xatolik');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadProfile(true);
    refreshUnreadCount();
  };

  const handleLogout = () => {
    Alert.alert(
      'Chiqish',
      'Tizimdan chiqmoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Chiqish',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!profile && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.errorText}>Ma'lumotlar topilmadi</Text>
          <Button
            title="Qayta urinish"
            onPress={loadProfile}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    );
  }
  
  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Avatar Section */}
        <View style={styles.card}>
          <View style={styles.avatarSection}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#9CA3AF" />
              </View>
            )}
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={handleUpdateAvatar}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>
            {profile.firstName} {profile.lastName}
          </Text>
          <Text style={styles.phone}>{profile.phone}</Text>
        </View>

        {/* Profile Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Shaxsiy ma'lumotlar</Text>
            <TouchableOpacity onPress={() => setEditProfileModal(true)}>
              <Ionicons name="pencil-outline" size={22} color="#2563EB" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ism</Text>
            <Text style={styles.infoValue}>{profile.firstName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Familiya</Text>
            <Text style={styles.infoValue}>{profile.lastName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Jins</Text>
            <Text style={styles.infoValue}>
              {profile.gender === 'male'
                ? 'Erkak'
                : profile.gender === 'female'
                ? 'Ayol'
                : 'Boshqa'}
            </Text>
          </View>
          {profile.birthDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tug'ilgan sana</Text>
              <Text style={styles.infoValue}>
                {new Date(profile.birthDate).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Manzil</Text>
            <TouchableOpacity onPress={() => setLocationModal(true)}>
              <Ionicons name="pencil-outline" size={22} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {typeof profile.viloyat === 'object' && profile.viloyat && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Viloyat</Text>
              <Text style={styles.infoValue}>{profile.viloyat.name}</Text>
            </View>
          )}
          {typeof profile.tuman === 'object' && profile.tuman && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tuman</Text>
              <Text style={styles.infoValue}>{profile.tuman.name}</Text>
            </View>
          )}
          {typeof profile.mfy === 'object' && profile.mfy && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>MFY</Text>
              <Text style={styles.infoValue}>{profile.mfy.name}</Text>
            </View>
          )}
        </View>

        {/* Actions Card */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setPasswordModal(true)}
          >
            <Ionicons name="lock-closed-outline" size={22} color="#2563EB" />
            <Text style={styles.actionButtonText}>Parolni o'zgartirish</Text>
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { marginTop: 12 }]}
            onPress={() => {
              refreshUnreadCount();
              router.push('/(tabs)/notifications');
            }}
          >
            <Ionicons name="notifications-outline" size={22} color="#2563EB" />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionButtonText}>Bildirishnomalar</Text>
              <Text style={styles.actionSubtitle}>
                Yangi xabarlar va eslatmalar
              </Text>
            </View>
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        </View>

        <Button
          title="Chiqish"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editProfileModal}
        onClose={() => setEditProfileModal(false)}
        profile={profile}
        onUpdate={loadProfile}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={passwordModal}
        onClose={() => setPasswordModal(false)}
      />

      {/* Update Location Modal */}
      <UpdateLocationModal
        visible={locationModal}
        onClose={() => setLocationModal(false)}
        profile={profile}
        onUpdate={loadProfile}
      />
    </View>
  );

  async function handleUpdateAvatar() {
    try {
      // Request permissions for Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: 'Rasm tanlash ruxsati',
            message: 'Rasm tanlash uchun ruxsat kerak',
            buttonNeutral: 'Keyinroq',
            buttonNegative: 'Bekor qilish',
            buttonPositive: 'Ruxsat berish',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Ruxsat kerak', 'Rasm tanlash uchun ruxsat berilishi kerak');
        return;
      }
      }

      launchImageLibrary(
        {
          mediaType: 'photo' as MediaType,
          includeBase64: true,
        quality: 0.8,
          maxWidth: 1024,
          maxHeight: 1024,
        },
        (response: ImagePickerResponse) => {
          if (response.didCancel) {
            return;
          }

          if (response.errorMessage) {
            Alert.alert('Xatolik', response.errorMessage);
        return;
      }

          if (response.assets && response.assets[0]) {
            const asset = response.assets[0];
        
        if (!asset.uri) {
          Alert.alert('Xatolik', 'Rasm tanlanmadi');
          return;
        }

        let base64Image: string;
        
        if (asset.base64) {
              const imageType = asset.type || `image/${asset.uri.split('.').pop()?.toLowerCase() || 'jpeg'}`;
          base64Image = `data:${imageType};base64,${asset.base64}`;
        } else {
          // Fallback: use URI if base64 is not available
          base64Image = asset.uri;
        }
        
            (async () => {
        try {
          const updated = await profileApi.updateAvatar({ avatar: base64Image });
          setProfile(updated);
          updateUser(updated as any);
          Alert.alert('Muvaffaqiyat', 'Avatar yangilandi');
        } catch (error: any) {
          Alert.alert('Xatolik', error.message || 'Avatarni yangilashda xatolik');
        }
            })();
      }
        }
      );
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Rasm tanlashda xatolik');
    }
  }
}

// Edit Profile Modal Component
interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile: ApplicantProfile;
  onUpdate: () => void;
}

function EditProfileModal({ visible, onClose, profile, onUpdate }: EditProfileModalProps) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(profile.gender);
  const [birthDate, setBirthDate] = useState(
    profile.birthDate ? profile.birthDate.split('T')[0] : ''
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setGender(profile.gender);
      setBirthDate(profile.birthDate ? profile.birthDate.split('T')[0] : '');
      setErrors({});
    }
  }, [visible, profile]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (firstName.length < 2) {
      newErrors.firstName = 'Ism kamida 2 belgi bo\'lishi kerak';
    }
    if (lastName.length < 2) {
      newErrors.lastName = 'Familiya kamida 2 belgi bo\'lishi kerak';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await profileApi.updateProfile({
        firstName,
        lastName,
        gender,
        birthDate: birthDate || undefined,
      });
      Alert.alert('Muvaffaqiyat', 'Profil yangilandi');
      onUpdate();
      onClose();
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Profilni yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Profilni yangilash</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <Input
              label="Ism"
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
              placeholder="Ismingizni kiriting"
            />

            <Input
              label="Familiya"
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
              placeholder="Familiyangizni kiriting"
            />

            <View style={styles.genderContainer}>
              <Text style={styles.genderLabel}>Jins</Text>
              <View style={styles.genderOptions}>
                {(['male', 'female', 'other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderOption,
                      gender === g && styles.genderOptionActive,
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        gender === g && styles.genderOptionTextActive,
                      ]}
                    >
                      {g === 'male' ? 'Erkak' : g === 'female' ? 'Ayol' : 'Boshqa'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <DatePicker
              label="Tug'ilgan sana"
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="YYYY-MM-DD"
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title="Bekor qilish"
              onPress={onClose}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Saqlash"
              onPress={handleSubmit}
              loading={loading}
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Change Password Modal Component
interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

function ChangePasswordModal({ visible, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    }
  }, [visible]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!currentPassword) {
      newErrors.currentPassword = 'Joriy parol kiritilmagan';
    }
    if (newPassword.length < 6) {
      newErrors.newPassword = 'Yangi parol kamida 6 belgi bo\'lishi kerak';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Parollar mos kelmaydi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await profileApi.updatePassword({
        currentPassword,
        newPassword,
      });
      Alert.alert('Muvaffaqiyat', 'Parol yangilandi');
      onClose();
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Parolni yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Parolni o'zgartirish</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <Input
              label="Joriy parol"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              error={errors.currentPassword}
              placeholder="Joriy parolingizni kiriting"
              secureTextEntry
              showPasswordToggle
            />

            <Input
              label="Yangi parol"
              value={newPassword}
              onChangeText={setNewPassword}
              error={errors.newPassword}
              placeholder="Yangi parolingizni kiriting"
              secureTextEntry
              showPasswordToggle
            />

            <Input
              label="Parolni tasdiqlash"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              placeholder="Parolni qayta kiriting"
              secureTextEntry
              showPasswordToggle
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title="Bekor qilish"
              onPress={onClose}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Saqlash"
              onPress={handleSubmit}
              loading={loading}
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Update Location Modal Component
interface UpdateLocationModalProps {
  visible: boolean;
  onClose: () => void;
  profile: ApplicantProfile;
  onUpdate: () => void;
}

function UpdateLocationModal({ visible, onClose, profile, onUpdate }: UpdateLocationModalProps) {
  const [viloyatId, setViloyatId] = useState<string | undefined>(
    typeof profile.viloyat === 'object' && profile.viloyat ? profile.viloyat._id : undefined
  );
  const [tumanId, setTumanId] = useState<string | undefined>(
    typeof profile.tuman === 'object' && profile.tuman ? profile.tuman._id : undefined
  );
  const [mfyId, setMfyId] = useState<string | undefined>(
    typeof profile.mfy === 'object' && profile.mfy ? profile.mfy._id : undefined
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setViloyatId(
        typeof profile.viloyat === 'object' && profile.viloyat ? profile.viloyat._id : undefined
      );
      setTumanId(
        typeof profile.tuman === 'object' && profile.tuman ? profile.tuman._id : undefined
      );
      setMfyId(
        typeof profile.mfy === 'object' && profile.mfy ? profile.mfy._id : undefined
      );
    }
  }, [visible, profile]);

  const handleViloyatSelect = (region: Region) => {
    setViloyatId(region._id);
    setTumanId(undefined);
    setMfyId(undefined);
  };

  const handleTumanSelect = (region: Region) => {
    setTumanId(region._id);
    setMfyId(undefined);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await profileApi.updateLocation({
        viloyat: viloyatId,
        tuman: tumanId,
        mfy: mfyId,
      });
      Alert.alert('Muvaffaqiyat', 'Manzil yangilandi');
      onUpdate();
      onClose();
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Manzilni yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manzilni yangilash</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            <RegionPicker
              label="Viloyat"
              type="region"
              value={viloyatId}
              initialRegion={
                typeof profile.viloyat === 'object' && profile.viloyat
                  ? profile.viloyat
                  : null
              }
              onSelect={handleViloyatSelect}
              placeholder="Viloyatni tanlang"
            />

            <RegionPicker
              label="Tuman"
              type="district"
              parentId={viloyatId}
              value={tumanId}
              initialRegion={
                typeof profile.tuman === 'object' && profile.tuman
                  ? profile.tuman
                  : null
              }
              onSelect={handleTumanSelect}
              placeholder="Tumanni tanlang"
              disabled={!viloyatId}
            />

            <RegionPicker
              label="MFY"
              type="mfy"
              parentId={tumanId}
              value={mfyId}
              initialRegion={
                typeof profile.mfy === 'object' && profile.mfy
                  ? profile.mfy
                  : null
              }
              onSelect={(region) => setMfyId(region._id)}
              placeholder="MFYni tanlang"
              disabled={!tumanId}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title="Bekor qilish"
              onPress={onClose}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Saqlash"
              onPress={handleSubmit}
              loading={loading}
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  headerContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 30,
    paddingBottom: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  badge: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  logoutButton: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalScrollView: {
    maxHeight: 500,
    padding: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  genderOptionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  genderOptionTextActive: {
    color: '#FFFFFF',
  },
});
