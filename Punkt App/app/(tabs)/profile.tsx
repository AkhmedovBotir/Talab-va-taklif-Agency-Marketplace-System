import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { KpiSummarySection } from '../components/KpiSummarySection';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

export default function ProfileScreen() {
  const { punkt, logout } = useAuth();
  const router = useRouter();
  const { unreadCount } = useUnreadNotifications();

  const handleLogout = () => {
    Alert.alert(
      'Chiqish',
      'Hisobingizdan chiqmoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Chiqish',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (!punkt) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="business" size={48} color="#007AFF" />
        </View>
        <Text style={styles.name}>{punkt.name}</Text>
        <Text style={styles.phone}>{punkt.phone}</Text>
      </View>

      <KpiSummarySection />

      <View style={styles.section}>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/notifications')}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="notifications-outline" size={22} color="#007AFF" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Xabarlar</Text>
              {unreadCount > 0 && (
                <Text style={styles.menuSubtitle}>{unreadCount} ta yangi xabar</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <View style={styles.infoItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="location-outline" size={22} color="#666" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Viloyat</Text>
              <Text style={styles.menuValue}>{punkt.viloyat.name}</Text>
            </View>
          </View>

          <View style={styles.menuDivider} />

          <View style={styles.infoItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="map-outline" size={22} color="#666" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Tuman</Text>
              <Text style={styles.menuValue}>{punkt.tuman.name}</Text>
            </View>
          </View>

          <View style={styles.menuDivider} />

          <View style={styles.infoItem}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#34C759" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Holat</Text>
              <Text style={[styles.menuValue, punkt.status === 'active' && styles.statusActive]}>
                {punkt.status === 'active' ? 'Faol' : 'Nofaol'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFF',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  phone: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
  },
  menuLabel: {
    fontSize: 13,
    color: '#666',
  },
  menuValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginLeft: 64,
  },
  statusActive: {
    color: '#34C759',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
