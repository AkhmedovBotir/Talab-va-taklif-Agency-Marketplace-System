import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

export default function ProfileScreen() {
  const { contragent, logout, refreshContragent } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshContragent(), fetchUnreadCount()]);
    } catch (error: any) {
      Alert.alert('Xatolik', 'Ma\'lumotlarni yangilashda xatolik yuz berdi');
    } finally {
      setRefreshing(false);
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
          <View style={styles.avatarContainer}>
            {contragent?.logo ? (
              <Image
                source={{ uri: contragent.logo }}
                style={styles.logoImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="business" size={48} color="#007AFF" />
            )}
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
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
});
