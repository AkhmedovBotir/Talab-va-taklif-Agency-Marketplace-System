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
import type { Agent, KPISummary } from '../../types/api';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
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
    loadProfile();
    loadKPISummary();
    loadUnreadCount();
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
    } finally {
      setLoadingProfile(false);
    }
  };

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
        setKpiSummary(response.data);
      }
    } catch (error: any) {
      // Silently fail - KPI is optional
    } finally {
      setLoadingKPI(false);
    }
  };


  if (loadingProfile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ma'lumotlar yuklanmoqda...</Text>
      </View>
    );
  }

  if (!agent) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Agent ma'lumotlari topilmadi</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleSection}>
            <Text style={styles.name}>{agent.name}</Text>
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

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="call" size={18} color="#007AFF" />
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Telefon</Text>
              <Text style={styles.infoValue}>{agent.phone}</Text>
            </View>
          </View>

          {agent.viloyat && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="location" size={18} color="#007AFF" />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Viloyat</Text>
                <Text style={styles.infoValue}>{agent.viloyat.name}</Text>
              </View>
            </View>
          )}

          {agent.tuman && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="location" size={18} color="#007AFF" />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>Tuman</Text>
                <Text style={styles.infoValue}>{agent.tuman.name}</Text>
              </View>
            </View>
          )}

          {agent.mfy && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="location" size={18} color="#007AFF" />
              </View>
              <View style={styles.infoTextWrapper}>
                <Text style={styles.infoLabel}>MFY</Text>
                <Text style={styles.infoValue}>{agent.mfy.name}</Text>
              </View>
            </View>
          )}
        </View>
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



