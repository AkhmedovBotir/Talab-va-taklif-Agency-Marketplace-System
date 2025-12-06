// Profile Screen
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type { KPISummary } from '../../types/api';

export default function ProfileScreen() {
  const { agent, role, logout } = useAuth();
  const router = useRouter();
  const [kpiSummary, setKpiSummary] = useState<KPISummary | null>(null);
  const [loadingKPI, setLoadingKPI] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    Alert.alert(
      'Chiqish',
      'Haqiqatan ham hisobingizdan chiqmoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
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

  useEffect(() => {
    loadKPISummary();
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await apiService.getUnreadNotificationsCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {}
  };

  const loadKPISummary = async () => {
    try {
      const response = await apiService.getKPISummary();
      if (response.success) {
        setKpiSummary(response.data.summary);
      }
    } catch (error: any) {
      // Silently fail - KPI is optional
      console.log('KPI summary load error:', error);
    } finally {
      setLoadingKPI(false);
    }
  };

  const getRoleText = (role: string | null) => {
    const roleMap: Record<string, string> = {
      viloyat: 'Viloyat agenti',
      tuman: 'Tuman agenti',
      mfy: 'MFY agenti',
    };
    return roleMap[role || ''] || role || 'Noma\'lum';
  };

  if (!agent) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Agent ma'lumotlari topilmadi</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color="#007AFF" />
        </View>
        <Text style={styles.name}>{agent.name}</Text>
        <Text style={styles.role}>{getRoleText(role)}</Text>
      </View>

      {!loadingKPI && kpiSummary && (
        <View style={styles.kpiSection}>
          <Text style={styles.kpiSectionTitle}>KPI Bonus</Text>
          <View style={styles.kpiCard}>
            <View style={styles.kpiRow}>
              <View style={styles.kpiItem}>
                <Ionicons name="wallet" size={24} color="#007AFF" />
                <Text style={styles.kpiLabel}>Jami bonus</Text>
                <Text style={styles.kpiValue}>
                  {kpiSummary.totalAmount.toLocaleString()} so'm
                </Text>
              </View>
            </View>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiItem, styles.kpiItemHalf]}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.kpiLabel}>To'langan</Text>
                <Text style={[styles.kpiValue, styles.kpiValuePaid]}>
                  {kpiSummary.paidAmount.toLocaleString()} so'm
                </Text>
              </View>
              <View style={[styles.kpiItem, styles.kpiItemHalf]}>
                <Ionicons name="time" size={20} color="#FF9500" />
                <Text style={styles.kpiLabel}>To'lanmagan</Text>
                <Text style={[styles.kpiValue, styles.kpiValueUnpaid]}>
                  {kpiSummary.unpaidAmount.toLocaleString()} so'm
                </Text>
              </View>
            </View>
            <View style={styles.kpiFooter}>
              <Text style={styles.kpiTransactions}>
                Jami transaksiyalar: {kpiSummary.totalTransactions}
              </Text>
            </View>
          </View>
        </View>
      )}

      {loadingKPI && (
        <View style={styles.kpiSection}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}

      {!loadingKPI && kpiSummary && (
        <View style={styles.section}>
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

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.kpiButton}
          onPress={() => router.push('/(tabs)/notifications')}
        >
          <Ionicons name="notifications" size={20} color="#5856D6" />
          <Text style={styles.kpiButtonText}>Habarlar</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} ta yangi</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shaxsiy ma'lumotlar</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="#007AFF" />
            <Text style={styles.infoLabel}>Telefon:</Text>
            <Text style={styles.infoValue}>{agent.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#007AFF" />
            <Text style={styles.infoLabel}>Viloyat:</Text>
            <Text style={styles.infoValue}>{agent.viloyat.name}</Text>
          </View>
          {agent.tuman && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#007AFF" />
              <Text style={styles.infoLabel}>Tuman:</Text>
              <Text style={styles.infoValue}>{agent.tuman.name}</Text>
            </View>
          )}
          {agent.mfy && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#007AFF" />
              <Text style={styles.infoLabel}>MFY:</Text>
              <Text style={styles.infoValue}>{agent.mfy.name}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color="#007AFF" />
            <Text style={styles.infoLabel}>Holat:</Text>
            <Text style={[styles.infoValue, styles.statusActive]}>
              {agent.status === 'active' ? 'Faol' : agent.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutButtonText}>Hisobdan chiqish</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  statusActive: {
    color: '#34C759',
    fontWeight: '600',
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
  kpiSection: {
    marginTop: 16,
    paddingHorizontal: 16,
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
  unreadBadge: {
    backgroundColor: '#5856D6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});



