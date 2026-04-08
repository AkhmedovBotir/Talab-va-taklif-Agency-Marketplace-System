import { Ionicons } from '@expo/vector-icons';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { DatePickerField } from '../../components/DatePickerField';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { apiService } from '../../services/api';
import type { AgentOrdersAnalytics } from '../../types/api';
import { getApiErrorMessage } from '../../utils/apiError';

const WEB_MAX_WIDTH = 820;

function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function OrdersAnalyticsScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const shellWidth = isWeb ? Math.min(WEB_MAX_WIDTH, Math.max(320, windowWidth - 40)) : undefined;

  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AgentOrdersAnalytics | null>(null);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const rangeLabel = useMemo(() => {
    if (analytics?.from && analytics?.to) return `${analytics.from} - ${analytics.to}`;
    if (analytics?.from) return analytics.from;
    if (analytics?.to) return analytics.to;
    return "Barcha davr";
  }, [analytics?.from, analytics?.to]);

  const hasActiveFilters = Boolean(startDate && endDate);

  const loadAnalytics = useCallback(async (params?: { from?: string; to?: string }) => {
    try {
      const res = await apiService.getMyOrdersAnalytics(params);
      if (res.success && res.data) {
        setAnalytics(res.data);
      } else {
        setAnalytics(null);
      }
    } catch (error: unknown) {
      showSnackbar(getApiErrorMessage(error, 'Analitikani yuklashda xatolik'), { variant: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    if (startDate && endDate) {
      void loadAnalytics({ from: toYmd(startDate), to: toYmd(endDate) });
      return;
    }
    void loadAnalytics();
  };

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) setStartDate(selectedDate);
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) setEndDate(selectedDate);
  };

  const applyFilters = () => {
    if (!startDate || !endDate) {
      showSnackbar('Boshlanish va tugash sanasini tanlang', { variant: 'error' });
      return;
    }
    if (toYmd(startDate) > toYmd(endDate)) {
      showSnackbar("Sana oralig'i noto'g'ri", { variant: 'error' });
      return;
    }
    setShowFilterModal(false);
    setLoading(true);
    void loadAnalytics({ from: toYmd(startDate), to: toYmd(endDate) });
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setShowFilterModal(false);
    setLoading(true);
    void loadAnalytics();
  };

  if (loading && !analytics) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.outer, isWeb && styles.outerWeb]}>
        <View style={[styles.shell, styles.shellFlex, shellWidth ? { width: shellWidth, maxWidth: '100%' as const } : null]}>
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Buyurtma analitikasi</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.filterButton}>
                <Ionicons name="filter" size={18} color={hasActiveFilters ? '#007AFF' : '#666'} />
                <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>Filtr</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Davr</Text>
              <Text style={styles.cardValue}>{rangeLabel}</Text>
            </View>

            <View style={styles.grid}>
              <View style={styles.cardHalf}>
                <Text style={styles.cardTitle}>Jami buyurtmalar</Text>
                <Text style={styles.cardValue}>{analytics?.total_orders ?? 0}</Text>
              </View>
              <View style={styles.cardHalf}>
                <Text style={styles.cardTitle}>Jami summa</Text>
                <Text style={styles.cardValue}>{(analytics?.total_amount ?? 0).toLocaleString()} so'm</Text>
              </View>
            </View>

            <View style={styles.grid}>
              <View style={styles.cardHalf}>
                <Text style={styles.cardTitle}>Yetkazilgan</Text>
                <Text style={[styles.cardValue, styles.ok]}>{analytics?.delivered_orders ?? 0}</Text>
                <Text style={styles.cardSub}>{(analytics?.delivered_amount ?? 0).toLocaleString()} so'm</Text>
              </View>
              <View style={styles.cardHalf}>
                <Text style={styles.cardTitle}>Kutilmoqda</Text>
                <Text style={[styles.cardValue, styles.warn]}>{analytics?.pending_orders ?? 0}</Text>
                <Text style={styles.cardSub}>{(analytics?.pending_amount ?? 0).toLocaleString()} so'm</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Punkt bo'yicha to'lov holati</Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>E'lon qilingan</Text>
                <Text style={styles.rowValue}>{(analytics?.declared_to_punkt_amount ?? 0).toLocaleString()} so'm</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Punkt tasdiqlagan</Text>
                <Text style={[styles.rowValue, styles.ok]}>{(analytics?.confirmed_by_punkt_amount ?? 0).toLocaleString()} so'm</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Tasdiqlanmagan e'lon</Text>
                <Text style={[styles.rowValue, styles.warn]}>{(analytics?.unconfirmed_declared_amount ?? 0).toLocaleString()} so'm</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={showFilterModal}
        transparent
        animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sana oralig'i</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Boshlanish</Text>
            {Platform.OS === 'web' ? (
              <DatePickerField value={startDate} onChange={handleStartDateChange} visible />
            ) : (
              <>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                  <Ionicons name="calendar" size={18} color="#007AFF" />
                  <Text style={styles.dateButtonText}>{startDate ? toYmd(startDate) : 'YYYY-MM-DD'}</Text>
                </TouchableOpacity>
                <DatePickerField value={startDate} onChange={handleStartDateChange} visible={showStartPicker} />
              </>
            )}

            <Text style={styles.modalLabel}>Tugash</Text>
            {Platform.OS === 'web' ? (
              <DatePickerField value={endDate} onChange={handleEndDateChange} visible />
            ) : (
              <>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                  <Ionicons name="calendar" size={18} color="#007AFF" />
                  <Text style={styles.dateButtonText}>{endDate ? toYmd(endDate) : 'YYYY-MM-DD'}</Text>
                </TouchableOpacity>
                <DatePickerField value={endDate} onChange={handleEndDateChange} visible={showEndPicker} />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.actionBtn, styles.clearBtn]} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Tozalash</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.applyBtn]} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Qo'llash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  outer: { flex: 1, backgroundColor: '#f5f5f5' },
  outerWeb: { alignItems: 'center' },
  shell: { width: '100%' },
  shellFlex: { flex: 1 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  filterButtonText: { color: '#666', fontWeight: '600' },
  filterButtonTextActive: { color: '#007AFF' },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHalf: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 13, color: '#666', marginBottom: 6 },
  cardValue: { fontSize: 20, fontWeight: '700', color: '#222' },
  cardSub: { marginTop: 4, fontSize: 13, color: '#666' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { fontSize: 14, color: '#555' },
  rowValue: { fontSize: 14, fontWeight: '700', color: '#333' },
  ok: { color: '#34C759' },
  warn: { color: '#FF9500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    gap: 10,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  modalLabel: { fontSize: 13, color: '#666', fontWeight: '600', marginTop: 6 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: { fontSize: 14, color: '#333' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: { flex: 1, borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  clearBtn: { backgroundColor: '#efefef' },
  applyBtn: { backgroundColor: '#007AFF' },
  clearBtnText: { color: '#555', fontWeight: '600' },
  applyBtnText: { color: '#fff', fontWeight: '700' },
});
