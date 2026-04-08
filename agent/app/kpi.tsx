// Agent KPI — GET /agents/me/kpi/today va /agents/me/kpi/history
import { Ionicons } from '@expo/vector-icons';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { DatePickerField } from '../components/DatePickerField';
import { useSnackbar } from '../contexts/SnackbarContext';
import { apiService } from '../services/api';
import type { AgentKpiHistoryDay, AgentKpiToday } from '../types/api';
import { getApiErrorMessage } from '../utils/apiError';

const WEB_MAX_WIDTH = 820;

function toUtcYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function historyDayLabel(day: AgentKpiHistoryDay, index: number): string {
  const raw = day.date_utc ?? day.date;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return `Kun ${index + 1}`;
}

export default function KPIScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const shellWidth = isWeb ? Math.min(WEB_MAX_WIDTH, Math.max(320, windowWidth - 40)) : undefined;

  const [today, setToday] = useState<AgentKpiToday | null>(null);
  const [days, setDays] = useState<AgentKpiHistoryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showSnackbar } = useSnackbar();

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const hasActiveFilters = Boolean(startDate && endDate);

  const loadKpiData = useCallback(
    async (historyRange?: { from: string; to: string }) => {
      try {
        const [todayRes, histRes] = await Promise.all([
          apiService.getAgentKpiToday(),
          apiService.getAgentKpiHistory(historyRange),
        ]);
        if (todayRes.success && todayRes.data) {
          setToday(todayRes.data);
        } else {
          setToday(null);
        }
        if (histRes.success) {
          setDays(histRes.days);
        } else {
          setDays([]);
        }
      } catch (error: unknown) {
        showSnackbar(getApiErrorMessage(error, 'KPI maʼlumotlarini yuklashda xatolik'), { variant: 'error' });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showSnackbar]
  );

  useEffect(() => {
    loadKpiData(undefined);
  }, [loadKpiData]);

  const onRefresh = () => {
    setRefreshing(true);
    if (startDate && endDate) {
      void loadKpiData({ from: toUtcYmd(startDate), to: toUtcYmd(endDate) });
    } else {
      void loadKpiData(undefined);
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

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
    if (toUtcYmd(startDate) > toUtcYmd(endDate)) {
      showSnackbar("Sana oralig'i noto'g'ri", { variant: 'error' });
      return;
    }
    setShowFilterModal(false);
    setLoading(true);
    void loadKpiData({ from: toUtcYmd(startDate), to: toUtcYmd(endDate) });
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setShowFilterModal(false);
    setLoading(true);
    void loadKpiData(undefined);
  };

  const dayCellStyle = isWeb
    ? windowWidth >= 1000
      ? [styles.dayCell, styles.dayCellWeb5]
      : windowWidth >= 640
        ? [styles.dayCell, styles.dayCellWeb3]
        : styles.dayCell
    : styles.dayCell;

  const aggregate = useMemo(() => {
    return days.reduce(
      (acc, d) => {
        acc.agentKpi += d.agent_kpi_accrued ?? 0;
        acc.kpiPool += d.total_kpi_pool ?? 0;
        acc.delivered += d.delivered_orders ?? 0;
        acc.paid += d.paid_total ?? 0;
        acc.unpaid += d.unpaid ?? 0;
        return acc;
      },
      { agentKpi: 0, kpiPool: 0, delivered: 0, paid: 0, unpaid: 0 }
    );
  }, [days]);

  const showKpiDividers = !isWeb || windowWidth >= 520;

  const renderDayItem = ({ item, index }: { item: AgentKpiHistoryDay; index: number }) => (
    <View style={styles.dayCard}>
      <Text style={styles.dayTitle}>{historyDayLabel(item, index)}</Text>
      <View style={styles.dayGrid}>
        <View style={dayCellStyle}>
          <Text style={styles.dayLabel}>Agent KPI</Text>
          <Text style={styles.dayValue}>{(item.agent_kpi_accrued ?? 0).toLocaleString()} so'm</Text>
        </View>
        <View style={dayCellStyle}>
          <Text style={styles.dayLabel}>KPI havzasi</Text>
          <Text style={styles.dayValueMuted}>{(item.total_kpi_pool ?? 0).toLocaleString()} so'm</Text>
        </View>
        <View style={dayCellStyle}>
          <Text style={styles.dayLabel}>Yetkazilgan</Text>
          <Text style={styles.dayValueSmall}>{item.delivered_orders ?? 0} ta</Text>
        </View>
        <View style={dayCellStyle}>
          <Text style={styles.dayLabel}>To'langan</Text>
          <Text style={[styles.dayValueSmall, styles.paid]}>{(item.paid_total ?? 0).toLocaleString()} so'm</Text>
        </View>
        <View style={dayCellStyle}>
          <Text style={styles.dayLabel}>To'lanmagan</Text>
          <Text style={[styles.dayValueSmall, styles.unpaid]}>{(item.unpaid ?? 0).toLocaleString()} so'm</Text>
        </View>
      </View>
    </View>
  );

  const listHeader = (
    <>
      {today && (
        <View style={[styles.kpiBalanceCard, isWeb && styles.kpiBalanceCardWeb]}>
          <View style={styles.kpiBalanceHeader}>
            <Ionicons name="wallet" size={20} color="#007AFF" />
            <Text style={[styles.kpiBalanceTitle, isWeb && windowWidth >= 640 && styles.kpiBalanceTitleWeb]}>
              Bugungi KPI (UTC: {today.date_utc})
            </Text>
          </View>
          <View style={[styles.kpiBalanceRow, isWeb && styles.kpiBalanceRowWeb]}>
            <View style={[styles.kpiBalanceItem, isWeb && styles.kpiBalanceItemWeb]}>
              <Text style={styles.kpiBalanceLabel}>Agent KPI</Text>
              <Text style={styles.kpiBalanceValue}>{(today.agent_kpi_total ?? 0).toLocaleString()} so'm</Text>
            </View>
            {showKpiDividers ? <View style={styles.kpiBalanceDivider} /> : null}
            <View style={[styles.kpiBalanceItem, isWeb && styles.kpiBalanceItemWeb]}>
              <Text style={styles.kpiBalanceLabel}>To'langan</Text>
              <Text style={[styles.kpiBalanceValue, styles.kpiBalancePaid]}>
                {(today.paid_total_today ?? 0).toLocaleString()} so'm
              </Text>
            </View>
            {showKpiDividers ? <View style={styles.kpiBalanceDivider} /> : null}
            <View style={[styles.kpiBalanceItem, isWeb && styles.kpiBalanceItemWeb]}>
              <Text style={styles.kpiBalanceLabel}>To'lanmagan</Text>
              <Text style={[styles.kpiBalanceValue, styles.kpiBalanceUnpaid]}>
                {(today.unpaid_today ?? 0).toLocaleString()} so'm
              </Text>
            </View>
          </View>
          <Text style={styles.kpiMetaText}>
            KPI havzasi: {(today.total_kpi_pool ?? 0).toLocaleString()} so'm · Yetkazilgan: {today.delivered_orders ?? 0}
            {' · '}
            To'lov yozuvlari: {today.payout_entries_today ?? 0}
          </Text>
          {today.allocation_note ? <Text style={styles.kpiMetaText}>{today.allocation_note}</Text> : null}
        </View>
      )}

      <View style={[styles.kpiBalanceCard, isWeb && styles.kpiBalanceCardWeb]}>
        <View style={styles.kpiBalanceHeader}>
          <Ionicons name="stats-chart" size={20} color="#007AFF" />
          <Text style={[styles.kpiBalanceTitle, isWeb && windowWidth >= 640 && styles.kpiBalanceTitleWeb]}>
            Barcha KPI hisobi
          </Text>
        </View>
        <View style={[styles.kpiBalanceRow, isWeb && styles.kpiBalanceRowWeb]}>
          <View style={[styles.kpiBalanceItem, isWeb && styles.kpiBalanceItemWeb]}>
            <Text style={styles.kpiBalanceLabel}>Agent KPI</Text>
            <Text style={styles.kpiBalanceValue}>{aggregate.agentKpi.toLocaleString()} so'm</Text>
          </View>
          {showKpiDividers ? <View style={styles.kpiBalanceDivider} /> : null}
          <View style={[styles.kpiBalanceItem, isWeb && styles.kpiBalanceItemWeb]}>
            <Text style={styles.kpiBalanceLabel}>To'langan</Text>
            <Text style={[styles.kpiBalanceValue, styles.kpiBalancePaid]}>{aggregate.paid.toLocaleString()} so'm</Text>
          </View>
          {showKpiDividers ? <View style={styles.kpiBalanceDivider} /> : null}
          <View style={[styles.kpiBalanceItem, isWeb && styles.kpiBalanceItemWeb]}>
            <Text style={styles.kpiBalanceLabel}>To'lanmagan</Text>
            <Text style={[styles.kpiBalanceValue, styles.kpiBalanceUnpaid]}>{aggregate.unpaid.toLocaleString()} so'm</Text>
          </View>
        </View>
        <Text style={styles.kpiMetaText}>
          KPI havzasi: {aggregate.kpiPool.toLocaleString()} so'm · Yetkazilgan: {aggregate.delivered} ta
          {hasActiveFilters ? ' (tanlangan oralig‘ida)' : ' (oxirgi davr bo‘yicha)'}
        </Text>
      </View>

      {hasActiveFilters && (
        <View style={[styles.filterHint, isWeb && styles.filterHintWeb]}>
          <Ionicons name="calendar-outline" size={16} color="#666" style={styles.filterHintIcon} />
          <Text style={styles.filterHintText}>
            {formatDate(startDate!)} — {formatDate(endDate!)} (UTC: {toUtcYmd(startDate!)} … {toUtcYmd(endDate!)})
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Kunlar bo'yicha tarix</Text>
    </>
  );

  if (loading && !today && days.length === 0) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'KPI',
            headerShown: true,
            headerBackTitle: 'Orqaga',
          }}
        />
        <View style={[styles.pageOuter, isWeb && styles.pageOuterWeb]}>
          <View style={[styles.shell, shellWidth ? { width: shellWidth, maxWidth: '100%' as const } : styles.shellFlex]}>
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'KPI',
          headerShown: true,
          headerBackTitle: 'Orqaga',
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.headerButton}>
              <Ionicons name="filter" size={24} color={hasActiveFilters ? '#007AFF' : '#333'} />
              {hasActiveFilters && <View style={styles.filterBadge} />}
            </TouchableOpacity>
          ),
        }}
      />
      <View style={[styles.pageOuter, isWeb && styles.pageOuterWeb]}>
        <View
          style={[
            styles.shell,
            styles.shellFlex,
            shellWidth ? { width: shellWidth, maxWidth: '100%' as const } : null,
          ]}
        >
          <FlatList
            data={days}
            renderItem={renderDayItem}
            keyExtractor={(item, index) => String(item.date_utc ?? item.date ?? index)}
            style={styles.listFlex}
            contentContainerStyle={[styles.listContent, isWeb && styles.listContentWeb]}
            ListHeaderComponent={listHeader}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="stats-chart-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Tarix bo'sh yoki ma'lumot yo'q</Text>
              </View>
            }
          />
        </View>

        <Modal
          visible={showFilterModal}
          animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
          transparent
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={[styles.modalOverlay, Platform.OS === 'web' && styles.modalOverlayWeb]}>
            <View style={[styles.modalContent, Platform.OS === 'web' && styles.modalContentWeb]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tarix oralig'i (UTC)</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <Text style={styles.filterLabel}>Boshlanish</Text>
              {Platform.OS === 'web' ? (
                <DatePickerField value={startDate} onChange={handleStartDateChange} visible maximumDate={endDate || new Date()} />
              ) : (
                <>
                  <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                    <Ionicons name="calendar" size={20} color="#666" />
                    <Text style={styles.dateButtonText}>{startDate ? formatDate(startDate) : 'Tanlang'}</Text>
                    {startDate && (
                      <TouchableOpacity onPress={() => setStartDate(null)}>
                        <Ionicons name="close-circle" size={20} color="#999" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                  <DatePickerField
                    value={startDate}
                    onChange={handleStartDateChange}
                    visible={showStartPicker}
                    maximumDate={endDate || new Date()}
                  />
                </>
              )}

              <Text style={styles.filterLabel}>Tugash</Text>
              {Platform.OS === 'web' ? (
                <DatePickerField
                  value={endDate}
                  onChange={handleEndDateChange}
                  visible
                  minimumDate={startDate || undefined}
                  maximumDate={new Date()}
                />
              ) : (
                <>
                  <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                    <Ionicons name="calendar" size={20} color="#666" />
                    <Text style={styles.dateButtonText}>{endDate ? formatDate(endDate) : 'Tanlang'}</Text>
                    {endDate && (
                      <TouchableOpacity onPress={() => setEndDate(null)}>
                        <Ionicons name="close-circle" size={20} color="#999" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                  <DatePickerField
                    value={endDate}
                    onChange={handleEndDateChange}
                    visible={showEndPicker}
                    minimumDate={startDate || undefined}
                    maximumDate={new Date()}
                  />
                </>
              )}

              <Text style={styles.modalHint}>Backendga `from` / `to` sifatida UTC kalendary kuni (YYYY-MM-DD) yuboriladi.</Text>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                  <Text style={styles.clearButtonText}>Standart (30 kun)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                  <Text style={styles.applyButtonText}>Qo'llash</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  pageOuter: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pageOuterWeb: {
    alignItems: 'center',
  },
  shell: {
    width: '100%',
  },
  shellFlex: {
    flex: 1,
  },
  listFlex: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  kpiBalanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 0,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiBalanceCardWeb: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  kpiBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  kpiBalanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  kpiBalanceTitleWeb: {
    fontSize: 17,
  },
  kpiBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiBalanceRowWeb: {
    justifyContent: 'space-around',
    rowGap: 12,
  },
  kpiBalanceItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 88,
  },
  kpiBalanceItemWeb: {
    minWidth: 112,
    flexGrow: 1,
  },
  kpiBalanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  kpiBalanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  kpiBalancePaid: {
    color: '#34C759',
  },
  kpiBalanceUnpaid: {
    color: '#FF9500',
  },
  kpiBalanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
    marginHorizontal: 4,
  },
  kpiMetaText: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  paid: {
    color: '#34C759',
  },
  unpaid: {
    color: '#FF9500',
  },
  filterHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 0,
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  filterHintWeb: {
    maxWidth: '100%',
  },
  filterHintIcon: {
    marginTop: 2,
  },
  filterHintText: {
    flex: 1,
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 16,
    flexShrink: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 0,
    marginBottom: 8,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 48,
    flexGrow: 1,
  },
  listContentWeb: {
    width: '100%',
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayCell: {
    width: '47%',
    minWidth: 140,
  },
  dayCellWeb3: {
    width: '31%',
    minWidth: 120,
  },
  dayCellWeb5: {
    width: '18%',
    minWidth: 88,
  },
  dayLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  dayValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  dayValueMuted: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  dayValueSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayWeb: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalContentWeb: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 640,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  modalHint: {
    marginTop: 12,
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
