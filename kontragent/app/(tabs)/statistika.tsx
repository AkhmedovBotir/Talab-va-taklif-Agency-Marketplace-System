import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { DatePickerWeb } from '../../components/DatePickerWeb';
import { apiService, StatisticsData } from '../../services/api';
import { formatNumberDisplay } from '../../utils/formatNumber';
import PaymentsScreen from './statistika/payments';
import FinanceScreen from './statistika/finance';

type TabType = 'statistics' | 'payments' | 'finance';

export default function StatistikaScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('statistics');
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Date filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatDateForApi = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date: Date | null): string => {
    if (!date) return 'Tanlang';
    return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const fetchStatistics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params: { startDate?: string; endDate?: string } = {};
      if (startDate) params.startDate = formatDateForApi(startDate);
      if (endDate) params.endDate = formatDateForApi(endDate);

      const response = await apiService.getStatistics(params);
      setStatistics(response.data);
    } catch (err: any) {
      setError(err.message || 'Statistikani yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStatistics();
    }, [startDate, endDate])
  );

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const formatNumber = (num: number): string => {
    return formatNumberDisplay(num);
  };

  const formatCurrency = (num: number): string => {
    return formatNumberDisplay(num) + ' so\'m';
  };

  const getMonthName = (month: number): string => {
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    return months[month - 1] || '';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Yuklanmoqda...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchStatistics()}>
          <Text style={styles.retryButtonText}>Qayta urinish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const summary = statistics?.summary;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistika</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'statistics' && styles.tabActive]}
          onPress={() => setActiveTab('statistics')}
        >
          <Text style={[styles.tabText, activeTab === 'statistics' && styles.tabTextActive]}>
            Statistika
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
          onPress={() => setActiveTab('payments')}
        >
          <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
            To'lovlarim
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'finance' && styles.tabActive]}
          onPress={() => setActiveTab('finance')}
        >
          <Text style={[styles.tabText, activeTab === 'finance' && styles.tabTextActive]}>
            Moliya
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'payments' ? (
        <PaymentsScreen />
      ) : activeTab === 'finance' ? (
        <FinanceScreen />
      ) : (
        <>
          {/* Date Filter */}
          <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#007AFF" />
            <Text style={styles.dateButtonText}>
              {startDate ? formatDateDisplay(startDate) : 'Boshlanish'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.dateSeparator}>—</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#007AFF" />
            <Text style={styles.dateButtonText}>
              {endDate ? formatDateDisplay(endDate) : 'Tugash'}
            </Text>
          </TouchableOpacity>

          {(startDate || endDate) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Date Pickers */}
      {showStartPicker && (
        Platform.OS === 'web' ? (
          <DatePickerWeb
            visible
            value={startDate || new Date()}
            maximumDate={endDate || new Date()}
            title="Boshlanish sanasi"
            onConfirm={(date) => {
              setStartDate(date);
              setShowStartPicker(false);
            }}
            onClose={() => setShowStartPicker(false)}
          />
        ) : Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Boshlanish sanasi</Text>
                  <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                    <Text style={styles.modalDone}>Tayyor</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={startDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(_, date) => date && setStartDate(date)}
                  maximumDate={endDate || new Date()}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
            maximumDate={endDate || new Date()}
          />
        )
      )}

      {showEndPicker && (
        Platform.OS === 'web' ? (
          <DatePickerWeb
            visible
            value={endDate || new Date()}
            minimumDate={startDate || undefined}
            maximumDate={new Date()}
            title="Tugash sanasi"
            onConfirm={(date) => {
              setEndDate(date);
              setShowEndPicker(false);
            }}
            onClose={() => setShowEndPicker(false)}
          />
        ) : Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Tugash sanasi</Text>
                  <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                    <Text style={styles.modalDone}>Tayyor</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(_, date) => date && setEndDate(date)}
                  minimumDate={startDate || undefined}
                  maximumDate={new Date()}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
            minimumDate={startDate || undefined}
            maximumDate={new Date()}
          />
        )
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchStatistics(true)} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.cardBlue]}>
            <Ionicons name="cart-outline" size={28} color="#007AFF" />
            <Text style={styles.cardValue}>{formatNumber(summary?.totalOrders || 0)}</Text>
            <Text style={styles.cardLabel}>Jami buyurtmalar</Text>
          </View>

          <View style={[styles.summaryCard, styles.cardGreen]}>
            <Ionicons name="checkmark-circle-outline" size={28} color="#34C759" />
            <Text style={styles.cardValue}>{formatNumber(summary?.acceptedOrders || 0)}</Text>
            <Text style={styles.cardLabel}>Qabul qilingan</Text>
          </View>

          <View style={[styles.summaryCard, styles.cardOrange]}>
            <Ionicons name="time-outline" size={28} color="#FF9500" />
            <Text style={styles.cardValue}>{formatNumber(summary?.pendingOrders || 0)}</Text>
            <Text style={styles.cardLabel}>Kutilayotgan</Text>
          </View>

          <View style={[styles.summaryCard, styles.cardRed]}>
            <Ionicons name="close-circle-outline" size={28} color="#FF3B30" />
            <Text style={styles.cardValue}>{formatNumber(summary?.rejectedOrders || 0)}</Text>
            <Text style={styles.cardLabel}>Rad etilgan</Text>
          </View>
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Ionicons name="wallet-outline" size={24} color="#007AFF" />
            <Text style={styles.revenueTitle}>Jami daromad</Text>
          </View>
          <Text style={styles.revenueValue}>{formatCurrency(summary?.totalRevenue || 0)}</Text>
          <View style={styles.revenueStats}>
            <View style={styles.revenueStat}>
              <Text style={styles.revenueStatValue}>{formatNumber(summary?.totalItems || 0)}</Text>
              <Text style={styles.revenueStatLabel}>Jami mahsulotlar</Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueStat}>
              <Text style={styles.revenueStatValue}>{formatNumber(summary?.deliveredOrders || 0)}</Text>
              <Text style={styles.revenueStatLabel}>Yetkazilgan</Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueStat}>
              <Text style={styles.revenueStatValue}>{summary?.acceptanceRate || '0'}%</Text>
              <Text style={styles.revenueStatLabel}>Qabul foizi</Text>
            </View>
          </View>
        </View>

        {/* Monthly Statistics */}
        {statistics?.monthly && statistics.monthly.length > 0 && (
          <View style={styles.monthlySection}>
            <Text style={styles.sectionTitle}>Oylik statistika</Text>
            {statistics.monthly.map((item, index) => (
              <View key={index} style={styles.monthlyCard}>
                <View style={styles.monthlyLeft}>
                  <Text style={styles.monthlyMonth}>{getMonthName(item.month)} {item.year}</Text>
                  <Text style={styles.monthlyOrders}>{formatNumber(item.orders)} buyurtma</Text>
                </View>
                <Text style={styles.monthlyRevenue}>{formatCurrency(item.revenue)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardBlue: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  cardGreen: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  cardOrange: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  cardRed: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  revenueCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revenueTitle: {
    fontSize: 16,
    color: '#666',
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 16,
  },
  revenueStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  revenueStat: {
    flex: 1,
    alignItems: 'center',
  },
  revenueDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
  },
  revenueStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  revenueStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  monthlySection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  monthlyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  monthlyLeft: {},
  monthlyMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  monthlyOrders: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  monthlyRevenue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  dateSeparator: {
    fontSize: 16,
    color: '#999',
  },
  clearButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
