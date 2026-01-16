import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, DeliveryRegion } from '../../services/api';

const isValidImage = (value?: string) =>
  !!value && /^data:image\/(jpeg|png|jpg);base64,/.test(value);

export default function ProfileScreen() {
  const { contragent, logout, refreshContragent } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(undefined);
  const [deliveryRegions, setDeliveryRegions] = useState<Array<{
    viloyat: { _id: string; name: string; type: string; code: string };
    tuman: { _id: string; name: string; type: string; code: string } | null;
  }>>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      // Ignore unread count errors
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    loadDeliveryRegions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Check if we're returning from region selection
      const checkForRegionUpdate = async () => {
        // Regions will be loaded automatically via loadDeliveryRegions
        await loadDeliveryRegions();
      };
      checkForRegionUpdate();
    }, [])
  );

  const loadDeliveryRegions = async () => {
    try {
      setLoadingRegions(true);
      const response = await apiService.getDeliveryRegions();
      if (response.success) {
        setDeliveryRegions(response.data.deliveryRegions || []);
      }
    } catch (error: any) {
      // If 404, it means no regions set yet, which is fine
      // Ignore other errors silently
    } finally {
      setLoadingRegions(false);
    }
  };

  useEffect(() => {
    if (contragent && isValidImage(contragent.logo)) {
      setLogoPreview(contragent.logo);
    } else {
      setLogoPreview(undefined);
    }
  }, [contragent]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshContragent(), fetchUnreadCount(), loadDeliveryRegions()]);
    } catch (error: any) {
      Alert.alert('Xatolik', 'Ma\'lumotlarni yangilashda xatolik yuz berdi');
    } finally {
      setRefreshing(false);
    }
  };

  const uploadLogo = async () => {
    try {
      setUploadingLogo(true);

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
            Alert.alert('Xatolik', response.errorMessage);
            setUploadingLogo(false);
            return;
          }

          if (response.assets && response.assets[0]?.base64) {
            const asset = response.assets[0];
            const mimeType = asset.type || 'image/jpeg';
        const base64 = `data:${mimeType};base64,${asset.base64}`;

        if (isValidImage(base64)) {
          setLogoPreview(base64);
          await apiService.updateLogo({ logo: base64 });
          await refreshContragent();
          Alert.alert('Muvaffaqiyatli', 'Logo yangilandi');
        } else {
          Alert.alert('Xatolik', 'Rasm formati noto‘g‘ri');
        }
      }
          setUploadingLogo(false);
        }
      );
    } catch (error: any) {
      const message = error?.message || 'Logo yangilashda xatolik yuz berdi';
      Alert.alert('Xatolik', message);
      setUploadingLogo(false);
    }
  };

  const handleChangeLogo = () => {
    uploadLogo();
  };

  const handleSelectDeliveryRegions = () => {
    router.push({
      pathname: '/(tabs)/ombor/product/select-regions' as any,
      params: {
        selectedRegions: JSON.stringify(
          deliveryRegions.map((dr) => ({
            viloyat: dr.viloyat._id,
            tuman: dr.tuman?._id || null,
          }))
        ),
        returnPath: '/(tabs)/profile',
      },
    });
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
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarContainer}>
              {isValidImage(logoPreview) ? (
                <Image
                  source={{ uri: logoPreview }}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="business" size={48} color="#007AFF" />
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.editAvatarButton,
                uploadingLogo && styles.editAvatarButtonDisabled,
              ]}
              onPress={handleChangeLogo}
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
          <Text style={styles.companyName}>{contragent?.name || 'Kontragent'}</Text>
          <Text style={styles.inn}>{contragent?.inn || ''}</Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Ma'lumotlar</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Telefon raqami</Text>
            <Text style={styles.detailValue}>{contragent?.phone || '-'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Viloyat</Text>
            <Text style={styles.detailValue}>{contragent?.viloyat?.name || '-'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tuman</Text>
            <Text style={styles.detailValue}>{contragent?.tuman?.name || '-'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>MFY</Text>
            <Text style={styles.detailValue}>{contragent?.mfy?.name || '-'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Holat</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {contragent?.status === 'active' ? 'Faol' : contragent?.status || '-'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Yetkazib berish hududlari</Text>
          
          {loadingRegions ? (
            <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 16 }} />
          ) : (
            <>
              {deliveryRegions.length > 0 ? (
                <View style={styles.regionsList}>
                  {deliveryRegions.map((region, index) => (
                    <View key={index} style={styles.regionItem}>
                      <Ionicons name="location" size={16} color="#007AFF" />
                      <Text style={styles.regionText}>
                        {region.viloyat.name}
                        {region.tuman && `, ${region.tuman.name}`}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noRegionsText}>
                  Hozircha yetkazib berish hududlari tanlanmagan
                </Text>
              )}
              
              <TouchableOpacity
                style={styles.editRegionsButton}
                onPress={handleSelectDeliveryRegions}
              >
                <Ionicons name="location-outline" size={20} color="#007AFF" />
                <Text style={styles.editRegionsButtonText}>
                  {deliveryRegions.length > 0 ? 'Hududlarni yangilash' : 'Hududlarni tanlash'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Amallar</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/habarlar')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="chatbubbles" size={24} color="#007AFF" />
              {unreadCount > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
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

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.logoutButtonText}>Chiqish</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
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
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
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
});

