import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import PartnershipBlock from '../../components/PartnershipBlock';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import RegionPicker from '../../components/ui/RegionPicker';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import apiService, { Region, User } from '../../services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, user: authUser, token, updateUser } = useAuth();
  const { unreadCount } = useNotification();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Profile Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'erkak' as 'ayol' | 'erkak',
    birthDate: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Password Modal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Location Modal
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationData, setLocationData] = useState({
    viloyat: '',
    viloyatId: '',
    tuman: '',
    tumanId: '',
    mfy: '',
    mfyId: '',
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationErrors, setLocationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token]);

  // Auto refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        loadProfile();
      }
    }, [token])
  );

  const loadProfile = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await apiService.getProfile(token);
      if (response.success && response.data) {
        setProfile(response.data);
        updateUser(response.data);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Profil yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    if (!profile) return;
    
    setEditFormData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      gender: profile.gender,
      birthDate: profile.birthDate ? profile.birthDate.split('T')[0] : '',
    });
    setEditErrors({});
    setEditModalVisible(true);
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};
    
    if (!editFormData.firstName || editFormData.firstName.length < 2) {
      errors.firstName = 'Ism kamida 2 ta belgi bo\'lishi kerak';
    }
    if (!editFormData.lastName || editFormData.lastName.length < 2) {
      errors.lastName = 'Familiya kamida 2 ta belgi bo\'lishi kerak';
    }
    if (!editFormData.birthDate) {
      errors.birthDate = 'Tug\'ilgan sanani kiriting';
    }
    
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateEditForm() || !token) return;
    
    try {
      setEditLoading(true);
      const response = await apiService.updateProfile(editFormData, token);
      if (response.success && response.data) {
        setProfile(response.data);
        updateUser(response.data);
        setEditModalVisible(false);
        Alert.alert('Muvaffaqiyatli', 'Profil yangilandi');
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Profil yangilashda xatolik yuz berdi');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});
    setPasswordModalVisible(true);
  };

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Joriy parolni kiriting';
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      errors.newPassword = 'Yangi parol kamida 6 ta belgi bo\'lishi kerak';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Parollar mos kelmaydi';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePassword = async () => {
    if (!validatePasswordForm() || !token) return;
    
    try {
      setPasswordLoading(true);
      const response = await apiService.updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        token
      );
      if (response.success) {
        setPasswordModalVisible(false);
        Alert.alert('Muvaffaqiyatli', 'Parol muvaffaqiyatli o\'zgartirildi');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Parol o\'zgartirishda xatolik yuz berdi');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeLocation = () => {
    if (!profile) return;
    
    setLocationData({
      viloyat: profile.viloyat?.name || '',
      viloyatId: profile.viloyat?._id || '',
      tuman: profile.tuman?.name || '',
      tumanId: profile.tuman?._id || '',
      mfy: profile.mfy?.name || '',
      mfyId: profile.mfy?._id || '',
    });
    setLocationErrors({});
    setLocationModalVisible(true);
  };

  const handleSaveLocation = async () => {
    if (!token) return;
    
    const locationUpdate: any = {};
    if (locationData.viloyatId) locationUpdate.viloyat = locationData.viloyatId;
    if (locationData.tumanId) locationUpdate.tuman = locationData.tumanId;
    if (locationData.mfyId) locationUpdate.mfy = locationData.mfyId;
    
    try {
      setLocationLoading(true);
      const response = await apiService.updateLocation(locationUpdate, token);
      if (response.success && response.data) {
        setProfile(response.data);
        updateUser(response.data);
        setLocationModalVisible(false);
        Alert.alert('Muvaffaqiyatli', 'Manzil yangilandi');
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Manzil yangilashda xatolik yuz berdi');
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ruxsat kerak', 'Rasmlarni tanlash uchun ruxsat kerak');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64Image = `data:image/${asset.uri.split('.').pop()};base64,${asset.base64}`;
        await handleUploadAvatar(base64Image);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Rasm tanlashda xatolik yuz berdi');
    }
  };

  const handleUploadAvatar = async (base64Image: string) => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await apiService.updateAvatar(base64Image, token);
      if (response.success && response.data) {
        setProfile(response.data);
        updateUser(response.data);
        Alert.alert('Muvaffaqiyatli', 'Avatar yangilandi');
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Avatar yangilashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Chiqish',
      'Tizimdan chiqmoqchimisiz?',
      [
        {
          text: 'Bekor qilish',
          style: 'cancel',
        },
        {
          text: 'Chiqish',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Xatolik', 'Chiqishda xatolik yuz berdi');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleNotificationPress = () => {
    router.push('/notifications' as any);
  };

  if (loading && !profile) {
    return (
      <View style={styles.container}>
        <Header title="Profil" onNotificationPress={handleNotificationPress} unreadCount={unreadCount} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Header title="Profil" onNotificationPress={handleNotificationPress} unreadCount={unreadCount} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Profil topilmadi</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Profil" onNotificationPress={handleNotificationPress} unreadCount={unreadCount} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
      >
        {/* Avatar Section */}
        <ImageBackground
          source={require('../../assets/bg.png')}
          style={styles.avatarSection}
          imageStyle={styles.avatarSectionBackground}
          resizeMode="cover"
        >
          <View style={styles.avatarSectionOverlay}>
            <View style={styles.avatarCard}>
              <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
                {profile.avatar ? (
                  <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={48} color="#007AFF" />
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.userName}>
                {profile.firstName} {profile.lastName}
              </Text>
              <Text style={styles.userPhone}>{profile.phone}</Text>
            </View>
          </View>
        </ImageBackground>

        {/* Partnership Block */}
        <View style={styles.partnershipSection}>
          <PartnershipBlock compact />
        </View>

        {/* Profile Info Cards */}
        <View style={styles.infoSection}>
          <TouchableOpacity style={styles.infoCard} onPress={handleEditProfile}>
            <View style={styles.infoCardLeft}>
              <Ionicons name="person-outline" size={24} color="#007AFF" />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardLabel}>Shaxsiy ma'lumotlar</Text>
                <Text style={styles.infoCardValue}>
                  {profile.firstName} {profile.lastName}
                </Text>
                <Text style={styles.infoCardSubValue}>
                  {profile.gender === 'erkak' ? 'Erkak' : 'Ayol'} • {formatDate(profile.birthDate)}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard} onPress={handleChangeLocation}>
            <View style={styles.infoCardLeft}>
              <Ionicons name="location-outline" size={24} color="#007AFF" />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardLabel}>Manzil</Text>
                <Text style={styles.infoCardValue}>
                  {profile.viloyat?.name || 'Viloyat'}
                </Text>
                <Text style={styles.infoCardSubValue}>
                  {profile.tuman?.name || 'Tuman'}, {profile.mfy?.name || 'MFY'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard} onPress={handleChangePassword}>
            <View style={styles.infoCardLeft}>
              <Ionicons name="lock-closed-outline" size={24} color="#007AFF" />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardLabel}>Xavfsizlik</Text>
                <Text style={styles.infoCardValue}>Parolni o'zgartirish</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => router.push('/order' as any)}
          >
            <View style={styles.infoCardLeft}>
              <Ionicons name="receipt-outline" size={24} color="#007AFF" />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardLabel}>Buyurtmalar</Text>
                <Text style={styles.infoCardValue}>Buyurtmalarim</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.logoutButtonText}>Chiqish</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCancel}>Bekor qilish</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Profilni tahrirlash</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={editLoading}>
              <Text style={[styles.modalSave, editLoading && styles.modalSaveDisabled]}>
                Saqlash
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Input
              label="Ism"
              value={editFormData.firstName}
              onChangeText={(text) => setEditFormData({ ...editFormData, firstName: text })}
              error={editErrors.firstName}
              placeholder="Ismingizni kiriting"
            />

            <Input
              label="Familiya"
              value={editFormData.lastName}
              onChangeText={(text) => setEditFormData({ ...editFormData, lastName: text })}
              error={editErrors.lastName}
              placeholder="Familiyangizni kiriting"
            />

            <View style={styles.genderContainer}>
              <Text style={styles.genderLabel}>Jins</Text>
              <View style={styles.genderButtons}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    editFormData.gender === 'erkak' && styles.genderButtonActive,
                  ]}
                  onPress={() => setEditFormData({ ...editFormData, gender: 'erkak' })}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      editFormData.gender === 'erkak' && styles.genderButtonTextActive,
                    ]}
                  >
                    Erkak
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    editFormData.gender === 'ayol' && styles.genderButtonActive,
                  ]}
                  onPress={() => setEditFormData({ ...editFormData, gender: 'ayol' })}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      editFormData.gender === 'ayol' && styles.genderButtonTextActive,
                    ]}
                  >
                    Ayol
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Input
              label="Tug'ilgan sana"
              value={editFormData.birthDate}
              onChangeText={(text) => setEditFormData({ ...editFormData, birthDate: text })}
              error={editErrors.birthDate}
              placeholder="YYYY-MM-DD"
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
              <Text style={styles.modalCancel}>Bekor qilish</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Parolni o'zgartirish</Text>
            <View style={{ width: 80 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <PasswordInput
              label="Joriy parol"
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
              error={passwordErrors.currentPassword}
              placeholder="Joriy parolingizni kiriting"
            />

            <PasswordInput
              label="Yangi parol"
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
              error={passwordErrors.newPassword}
              placeholder="Yangi parolingizni kiriting"
            />

            <PasswordInput
              label="Yangi parolni tasdiqlash"
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
              error={passwordErrors.confirmPassword}
              placeholder="Yangi parolni qayta kiriting"
            />

            <Button
              title="Parolni o'zgartirish"
              onPress={handleSavePassword}
              loading={passwordLoading}
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Location Modal */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
              <Text style={styles.modalCancel}>Bekor qilish</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Manzilni yangilash</Text>
            <TouchableOpacity onPress={handleSaveLocation} disabled={locationLoading}>
              <Text style={[styles.modalSave, locationLoading && styles.modalSaveDisabled]}>
                Saqlash
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <RegionPicker
              label="Viloyat"
              value={locationData.viloyatId}
              type="region"
              onSelect={(region: Region) => {
                setLocationData({
                  ...locationData,
                  viloyat: region.name,
                  viloyatId: region._id,
                  tuman: '',
                  tumanId: '',
                  mfy: '',
                  mfyId: '',
                });
              }}
            />

            <RegionPicker
              label="Tuman"
              value={locationData.tumanId}
              type="district"
              parentId={locationData.viloyatId}
              onSelect={(region: Region) => {
                setLocationData({
                  ...locationData,
                  tuman: region.name,
                  tumanId: region._id,
                  mfy: '',
                  mfyId: '',
                });
              }}
              disabled={!locationData.viloyatId}
            />

            <RegionPicker
              label="MFY"
              value={locationData.mfyId}
              type="mfy"
              parentId={locationData.tumanId}
              onSelect={(region: Region) => {
                setLocationData({
                  ...locationData,
                  mfy: region.name,
                  mfyId: region._id,
                });
              }}
              disabled={!locationData.tumanId}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    width: '100%',
    overflow: 'hidden',
  },
  avatarSectionBackground: {
    resizeMode: 'cover',
  },
  avatarSectionOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  avatarCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#E5E5E7',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E5E5E7',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
    textAlign: 'center',
  },
  userPhone: {
    fontSize: 16,
    color: '#4a4a4a',
    textAlign: 'center',
    fontWeight: '500',
  },
  partnershipSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoSection: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 0,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoCardContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  infoCardSubValue: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    margin: 16,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
    width: 80,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    width: 80,
    textAlign: 'right',
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  genderContainer: {
    marginBottom: 16,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#333',
  },
  genderButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
