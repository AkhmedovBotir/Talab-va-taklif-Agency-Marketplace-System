import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationsContext';

export default function HomeScreen() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Asosiy</Text>
        <TouchableOpacity
          style={styles.bellWrap}
          onPress={() => router.push('/notifications' as any)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={26} color="#007AFF" />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : String(unreadCount)}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="storefront" size={48} color="#007AFF" />
            </View>
            <Text style={styles.welcomeText}>Xush kelibsiz!</Text>
            <Text style={styles.storeName}>{user.name}</Text>
          </View>
        </View>

        {/* Content Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>Dokon ma'lumotlari</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>INN:</Text>
            <Text style={styles.infoValue}>{user.inn}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telefon:</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>

          {user.viloyat && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Viloyat:</Text>
              <Text style={styles.infoValue}>{user.viloyat.name}</Text>
            </View>
          )}

          {user.tuman && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tuman:</Text>
              <Text style={styles.infoValue}>{user.tuman.name}</Text>
            </View>
          )}

          {user.mfy && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>MFY:</Text>
              <Text style={styles.infoValue}>{user.mfy.name}</Text>
            </View>
          )}

          {user.activityType && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Faoliyat turi:</Text>
              <Text style={styles.infoValue}>{user.activityType.name}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <View style={[styles.statusBadge, user.status === 'active' && styles.statusActive]}>
              <Text
                style={[
                  styles.statusText,
                  user.status === 'active' && styles.statusTextActive,
                ]}>
                {user.status === 'active' ? 'Faol' : 'Nofaol'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  bellWrap: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  statusTextActive: {
    color: '#4CAF50',
  },
});
