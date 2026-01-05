import { Ionicons } from '@expo/vector-icons';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { useSnackbar } from '../../contexts/SnackbarContext';
import apiService, { Region, User } from '../../services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, user: authUser, token, updateUser } = useAuth();
  const { unreadCount } = useNotification();
  const { showSuccess, showError } = useSnackbar();
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
  const [birthDay, setBirthDay] = useState<number | null>(null);
  const [birthMonth, setBirthMonth] = useState<number | null>(null);
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

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
  const [hasPartnershipRequest, setHasPartnershipRequest] = useState(false);

  useEffect(() => {
    if (token) {
      loadProfile();
      checkPartnershipRequests();
    }
  }, [token]);

  // Auto refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        loadProfile();
        checkPartnershipRequests();
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
      showError(error.message || 'Profil yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const checkPartnershipRequests = async () => {
    if (!token) return;
    
    try {
      const response = await apiService.getMyPartnershipRequests({ limit: 1 }, token);
      if (response.success && response.data && response.data.length > 0) {
        setHasPartnershipRequest(true);
      } else {
        setHasPartnershipRequest(false);
      }
    } catch (error: any) {
      // Don't show error, just assume no requests
      setHasPartnershipRequest(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    if (!profile) return;
    
    const birthDateStr = profile.birthDate ? profile.birthDate.split('T')[0] : '';
    let day: number | null = null;
    let month: number | null = null;
    let year: number | null = null;
    
    if (birthDateStr) {
      const date = new Date(birthDateStr);
      if (!isNaN(date.getTime())) {
        day = date.getDate();
        month = date.getMonth() + 1; // getMonth() returns 0-11
        year = date.getFullYear();
      }
    }
    
    setEditFormData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      gender: profile.gender,
      birthDate: birthDateStr,
    });
    setBirthDay(day);
    setBirthMonth(month);
    setBirthYear(year);
    setEditErrors({});
    setEditModalVisible(true);
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};
    
    // Validate firstName (2-50 characters)
    if (editFormData.firstName) {
      if (editFormData.firstName.length < 2) {
        errors.firstName = 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak';
      } else if (editFormData.firstName.length > 50) {
        errors.firstName = 'Ism 50 ta belgidan oshmasligi kerak';
      }
    }
    
    // Validate lastName (2-50 characters)
    if (editFormData.lastName) {
      if (editFormData.lastName.length < 2) {
        errors.lastName = 'Familiya kamida 2 ta belgidan iborat bo\'lishi kerak';
      } else if (editFormData.lastName.length > 50) {
        errors.lastName = 'Familiya 50 ta belgidan oshmasligi kerak';
      }
    }
    
    // Validate gender
    if (editFormData.gender && editFormData.gender !== 'ayol' && editFormData.gender !== 'erkak') {
      errors.gender = 'Jins "ayol" yoki "erkak" bo\'lishi kerak';
    }
    
    // Validate birthDate (day, month, year)
    if (!birthDay || !birthMonth || !birthYear) {
      errors.birthDate = 'Tug\'ilgan sanani to\'liq kiriting';
    } else {
      // Validate date
      const date = new Date(birthYear, birthMonth - 1, birthDay);
      if (isNaN(date.getTime())) {
        errors.birthDate = 'Noto\'g\'ri sana';
      } else if (date > new Date()) {
        errors.birthDate = 'Tug\'ilgan sana kelajakda bo\'lishi mumkin emas';
      } else if (date.getDate() !== birthDay || date.getMonth() + 1 !== birthMonth || date.getFullYear() !== birthYear) {
        errors.birthDate = 'Noto\'g\'ri sana (masalan, 30-fevral)';
      }
    }
    
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateEditForm() || !token) return;
    
    try {
      setEditLoading(true);
      setEditErrors({});
      
      // Prepare data according to API documentation
      const updateData: {
        firstName?: string;
        lastName?: string;
        gender?: 'ayol' | 'erkak';
        birthDate?: string;
      } = {};
      
      // Only include fields that have values and are different from current profile
      if (editFormData.firstName && editFormData.firstName.trim()) {
        updateData.firstName = editFormData.firstName.trim();
      }
      if (editFormData.lastName && editFormData.lastName.trim()) {
        updateData.lastName = editFormData.lastName.trim();
      }
      if (editFormData.gender) {
        updateData.gender = editFormData.gender;
      }
      if (birthDay && birthMonth && birthYear) {
        // Format birthDate as YYYY-MM-DD
        const formattedDate = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
        updateData.birthDate = formattedDate;
      }
      
      const response = await apiService.updateProfile(updateData, token);
      if (response.success && response.data) {
        // Reload profile to get latest data
        await loadProfile();
        setEditModalVisible(false);
        showSuccess(response.message || 'Profil yangilandi');
      }
    } catch (error: any) {
      // Handle API error responses
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors array
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errors: Record<string, string> = {};
          errorData.errors.forEach((errMsg: string) => {
            if (errMsg.includes('Ism')) {
              errors.firstName = errMsg;
            } else if (errMsg.includes('Familiya') || errMsg.includes('Familiya')) {
              errors.lastName = errMsg;
            } else if (errMsg.includes('Jins') || errMsg.includes('jins')) {
              errors.gender = errMsg;
            } else if (errMsg.includes('sana') || errMsg.includes('Sana') || errMsg.includes('date')) {
              errors.birthDate = errMsg;
            }
          });
          setEditErrors(errors);
        }
        
        // Show error message
        showError(errorData.message || error.message || 'Profil yangilashda xatolik yuz berdi');
      } else {
        showError(error.message || 'Profil yangilashda xatolik yuz berdi');
      }
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
        showSuccess('Parol muvaffaqiyatli o\'zgartirildi');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error: any) {
      showError(error.message || 'Parol o\'zgartirishda xatolik yuz berdi');
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
        // Reload profile to get latest data
        await loadProfile();
        setLocationModalVisible(false);
        showSuccess('Manzil yangilandi');
      }
    } catch (error: any) {
      showError(error.message || 'Manzil yangilashda xatolik yuz berdi');
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePickImage = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as const,
      includeBase64: true,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        showError(response.errorMessage || 'Rasm tanlashda xatolik yuz berdi');
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri && asset.base64) {
          const mimeType = asset.type || 'image/jpeg';
          const base64Image = `data:${mimeType};base64,${asset.base64}`;
          handleUploadAvatar(base64Image);
        }
      }
    });
  };

  const handleUploadAvatar = async (base64Image: string) => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await apiService.updateAvatar(base64Image, token);
      if (response.success && response.data) {
        // Reload profile to get latest data
        await loadProfile();
        showSuccess('Avatar yangilandi');
      }
    } catch (error: any) {
      showError(error.message || 'Avatar yangilashda xatolik yuz berdi');
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
              showError('Chiqishda xatolik yuz berdi');
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

  const getMonthName = (month: number): string => {
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    return months[month - 1] || '';
  };

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month, 0).getDate();
  };

  const generateYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear; i >= 1900; i--) {
      years.push(i);
    }
    return years;
  };

  const generateMonths = (): number[] => {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  };

  const generateDays = (month: number | null, year: number | null): number[] => {
    if (!month || !year) {
      return Array.from({ length: 31 }, (_, i) => i + 1);
    }
    const daysInMonth = getDaysInMonth(month, year);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
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
          source={require('../../assets/images/bg.webp')}
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

        {hasPartnershipRequest && (
            <TouchableOpacity
              style={styles.infoCard}
              onPress={() => router.push('/partnership-requests' as any)}
            >
              <View style={styles.infoCardLeft}>
                <Ionicons name="business-outline" size={24} color="#007AFF" />
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardLabel}>Hamkorlik</Text>
                  <Text style={styles.infoCardValue}>Hamkorlik so'rovim</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>
          )}

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
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainerNew, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeaderNew}>
              <View style={styles.modalHeaderTop}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="person-outline" size={24} color="#007AFF" />
                </View>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitleNew}>Shaxsiy ma'lumotlar</Text>
                  <Text style={styles.modalSubtitle}>Profil ma'lumotlarini yangilang</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

          <View style={styles.scrollViewContainer}>
            <ScrollView 
              style={styles.modalContentNew} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.modalContentContainerNew}
              indicatorStyle="black"
            >
            <View style={styles.formSection}>
              <Input
                label="Ism"
                value={editFormData.firstName}
                onChangeText={(text) => {
                  setEditFormData({ ...editFormData, firstName: text });
                  if (editErrors.firstName) {
                    setEditErrors({ ...editErrors, firstName: '' });
                  }
                }}
                error={editErrors.firstName}
                placeholder="Ismingizni kiriting"
              />

              <Input
                label="Familiya"
                value={editFormData.lastName}
                onChangeText={(text) => {
                  setEditFormData({ ...editFormData, lastName: text });
                  if (editErrors.lastName) {
                    setEditErrors({ ...editErrors, lastName: '' });
                  }
                }}
                error={editErrors.lastName}
                placeholder="Familiyangizni kiriting"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Jins</Text>
              <View style={styles.genderButtons}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    editFormData.gender === 'erkak' && styles.genderButtonActive,
                  ]}
                  onPress={() => {
                    setEditFormData({ ...editFormData, gender: 'erkak' });
                    if (editErrors.gender) {
                      setEditErrors({ ...editErrors, gender: '' });
                    }
                  }}
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
                  onPress={() => {
                    setEditFormData({ ...editFormData, gender: 'ayol' });
                    if (editErrors.gender) {
                      setEditErrors({ ...editErrors, gender: '' });
                    }
                  }}
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
              {editErrors.gender && (
                <Text style={styles.errorText}>{editErrors.gender}</Text>
              )}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Tug'ilgan sana</Text>
              <View style={styles.datePickerContainer}>
                {/* Year Picker */}
                <View style={styles.datePickerItem}>
                  <Text style={styles.datePickerLabel}>Yil</Text>
                  <TouchableOpacity
                    style={[
                      styles.datePickerButton,
                      editErrors.birthDate && styles.dateInputError,
                    ]}
                    onPress={() => setShowYearPicker(true)}
                  >
                    <Text style={[styles.datePickerText, !birthYear && styles.datePickerPlaceholder]}>
                      {birthYear || 'Yil'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Month Picker */}
                <View style={styles.datePickerItem}>
                  <Text style={styles.datePickerLabel}>Oy</Text>
                  <TouchableOpacity
                    style={[
                      styles.datePickerButton,
                      editErrors.birthDate && styles.dateInputError,
                    ]}
                    onPress={() => setShowMonthPicker(true)}
                  >
                    <Text style={[styles.datePickerText, !birthMonth && styles.datePickerPlaceholder]}>
                      {birthMonth ? getMonthName(birthMonth) : 'Oy'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Day Picker */}
                <View style={styles.datePickerItem}>
                  <Text style={styles.datePickerLabel}>Kun</Text>
                  <TouchableOpacity
                    style={[
                      styles.datePickerButton,
                      editErrors.birthDate && styles.dateInputError,
                    ]}
                    onPress={() => setShowDayPicker(true)}
                  >
                    <Text style={[styles.datePickerText, !birthDay && styles.datePickerPlaceholder]}>
                      {birthDay || 'Kun'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
              {editErrors.birthDate && (
                <Text style={styles.errorText}>{editErrors.birthDate}</Text>
              )}
            </View>

            {/* Year Picker Modal */}
            {showYearPicker && (
              <Modal
                visible={showYearPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowYearPicker(false)}
              >
                <View style={styles.pickerModalContainer}>
                  <View style={styles.pickerModalContent}>
                    <View style={styles.pickerModalHeader}>
                      <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                        <Text style={styles.pickerModalCancel}>Bekor qilish</Text>
                      </TouchableOpacity>
                      <Text style={styles.pickerModalTitle}>Yilni tanlang</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setShowYearPicker(false);
                          if (editErrors.birthDate) {
                            setEditErrors({ ...editErrors, birthDate: '' });
                          }
                        }}
                      >
                        <Text style={styles.pickerModalDone}>Tasdiqlash</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.pickerList}>
                      {generateYears().map((year) => (
                        <TouchableOpacity
                          key={year}
                          style={[
                            styles.pickerItem,
                            birthYear === year && styles.pickerItemActive,
                          ]}
                          onPress={() => {
                            setBirthYear(year);
                            // Validate day if month is selected
                            if (birthMonth && birthDay) {
                              const daysInMonth = getDaysInMonth(birthMonth, year);
                              if (birthDay > daysInMonth) {
                                setBirthDay(daysInMonth);
                              }
                            }
                            if (editErrors.birthDate) {
                              setEditErrors({ ...editErrors, birthDate: '' });
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              birthYear === year && styles.pickerItemTextActive,
                            ]}
                          >
                            {year}
                          </Text>
                          {birthYear === year && (
                            <Ionicons name="checkmark" size={20} color="#007AFF" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            )}

            {/* Month Picker Modal */}
            {showMonthPicker && (
              <Modal
                visible={showMonthPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowMonthPicker(false)}
              >
                <View style={styles.pickerModalContainer}>
                  <View style={styles.pickerModalContent}>
                    <View style={styles.pickerModalHeader}>
                      <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                        <Text style={styles.pickerModalCancel}>Bekor qilish</Text>
                      </TouchableOpacity>
                      <Text style={styles.pickerModalTitle}>Oyni tanlang</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setShowMonthPicker(false);
                          if (editErrors.birthDate) {
                            setEditErrors({ ...editErrors, birthDate: '' });
                          }
                        }}
                      >
                        <Text style={styles.pickerModalDone}>Tasdiqlash</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.pickerList}>
                      {generateMonths().map((month) => (
                        <TouchableOpacity
                          key={month}
                          style={[
                            styles.pickerItem,
                            birthMonth === month && styles.pickerItemActive,
                          ]}
                          onPress={() => {
                            setBirthMonth(month);
                            // Validate day if year is selected
                            if (birthYear && birthDay) {
                              const daysInMonth = getDaysInMonth(month, birthYear);
                              if (birthDay > daysInMonth) {
                                setBirthDay(daysInMonth);
                              }
                            }
                            if (editErrors.birthDate) {
                              setEditErrors({ ...editErrors, birthDate: '' });
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              birthMonth === month && styles.pickerItemTextActive,
                            ]}
                          >
                            {getMonthName(month)}
                          </Text>
                          {birthMonth === month && (
                            <Ionicons name="checkmark" size={20} color="#007AFF" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            )}

            {/* Day Picker Modal */}
            {showDayPicker && (
              <Modal
                visible={showDayPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowDayPicker(false)}
              >
                <View style={styles.pickerModalContainer}>
                  <View style={styles.pickerModalContent}>
                    <View style={styles.pickerModalHeader}>
                      <TouchableOpacity onPress={() => setShowDayPicker(false)}>
                        <Text style={styles.pickerModalCancel}>Bekor qilish</Text>
                      </TouchableOpacity>
                      <Text style={styles.pickerModalTitle}>Kunni tanlang</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setShowDayPicker(false);
                          if (editErrors.birthDate) {
                            setEditErrors({ ...editErrors, birthDate: '' });
                          }
                        }}
                      >
                        <Text style={styles.pickerModalDone}>Tasdiqlash</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.pickerList}>
                      {generateDays(birthMonth, birthYear).map((day) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.pickerItem,
                            birthDay === day && styles.pickerItemActive,
                          ]}
                          onPress={() => {
                            setBirthDay(day);
                            if (editErrors.birthDate) {
                              setEditErrors({ ...editErrors, birthDate: '' });
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              birthDay === day && styles.pickerItemTextActive,
                            ]}
                          >
                            {day}
                          </Text>
                          {birthDay === day && (
                            <Ionicons name="checkmark" size={20} color="#007AFF" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            )}
            </ScrollView>
            <View style={styles.scrollGradientTop} pointerEvents="none" />
            <View style={styles.scrollGradientBottom} pointerEvents="none" />
          </View>
          
          <View style={styles.modalFooterNew}>
            <TouchableOpacity
              style={[styles.modalSaveButton, editLoading && styles.modalSaveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={editLoading}
            >
              {editLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.modalSaveButtonText}>Saqlash</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

      {/* Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainerNew, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeaderNew}>
              <View style={styles.modalHeaderTop}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="lock-closed-outline" size={24} color="#007AFF" />
                </View>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitleNew}>Xavfsizlik</Text>
                  <Text style={styles.modalSubtitle}>Parolingizni o'zgartiring</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setPasswordModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.scrollViewContainer}>
              <ScrollView 
                style={styles.modalContentNew} 
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.modalContentContainerNew}
                indicatorStyle="black"
              >
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
              </ScrollView>
              <View style={styles.scrollGradientTop} pointerEvents="none" />
              <View style={styles.scrollGradientBottom} pointerEvents="none" />
            </View>
            
            <View style={styles.modalFooterNew}>
              <TouchableOpacity
                style={[styles.modalSaveButton, passwordLoading && styles.modalSaveButtonDisabled]}
                onPress={handleSavePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.modalSaveButtonText}>Parolni o'zgartirish</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Location Modal */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLocationModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainerNew, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeaderNew}>
              <View style={styles.modalHeaderTop}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="location-outline" size={24} color="#007AFF" />
                </View>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitleNew}>Manzil</Text>
                  <Text style={styles.modalSubtitle}>Manzilingizni yangilang</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setLocationModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.scrollViewContainer}>
              <ScrollView 
                style={styles.modalContentNew} 
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.modalContentContainerNew}
                indicatorStyle="black"
              >
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
              <View style={styles.scrollGradientTop} pointerEvents="none" />
              <View style={styles.scrollGradientBottom} pointerEvents="none" />
            </View>
            
            <View style={styles.modalFooterNew}>
              <TouchableOpacity
                style={[styles.modalSaveButton, locationLoading && styles.modalSaveButtonDisabled]}
                onPress={handleSaveLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.modalSaveButtonText}>Saqlash</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  },
  modalContentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    marginTop: 8,
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
  datePickerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  datePickerItem: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  datePickerPlaceholder: {
    color: '#999',
  },
  pickerModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerModalCancel: {
    fontSize: 16,
    color: '#666',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  pickerModalDone: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemActive: {
    backgroundColor: '#f5f5f5',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  dateInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  dateInputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  modalDateContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDateContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalDateCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalDateDone: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalDateContentAndroid: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    alignItems: 'center',
  },
  datePicker: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainerNew: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '100%',
    minHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeaderNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitleNew: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentNew: {
    flex: 1,
  },
  modalContentContainerNew: {
    padding: 20,
    paddingBottom: 24,
  },
  modalFooterNew: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  modalSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollViewContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  scrollGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
    pointerEvents: 'none',
  },
});



