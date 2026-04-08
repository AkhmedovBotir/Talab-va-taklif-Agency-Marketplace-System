import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WebDateInput } from './components/WebDateInput';
import { useDialog } from './contexts/DialogContext';
import {
  apiService,
  PunktKpiHistoryDay,
  PunktKpiTodayData,
} from './services/api';
import { useScreenContentWidth } from './hooks/useScreenContentWidth';

function formatYmdUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function utcDateFromYmd(ymd: string): Date {
  const [y, m, day] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

function defaultHistoryRange(): { from: string; to: string } {
  const now = new Date();
  const to = formatYmdUTC(now);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - 29);
  const from = formatYmdUTC(start);
  return { from, to };
}

export default function KPIScreen() {
  const { showAlert } = useDialog();
  const initialRange = useMemo(() => defaultHistoryRange(), []);
  const { windowWidth, isWeb, horizontalPad, contentMaxWidth } = useScreenContentWidth(960);
  const numColumns = isWeb && windowWidth >= 840 ? 2 : 1;
  // KPI kartalarini webda ham mobil ko‘rinishda (vertikal) ushlab turamiz
  const stackToday = isWeb || windowWidth < 520;

  const [today, setToday] = useState<PunktKpiTodayData | null>(null);
  const [days, setDays] = useState<PunktKpiHistoryDay[]>([]);
  const [rangeMeta, setRangeMeta] = useState<{ from: string; to: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [appliedFrom, setAppliedFrom] = useState(initialRange.from);
  const [appliedTo, setAppliedTo] = useState(initialRange.to);

  const [draftFrom, setDraftFrom] = useState<Date | null>(() => utcDateFromYmd(initialRange.from));
  const [draftTo, setDraftTo] = useState<Date | null>(() => utcDateFromYmd(initialRange.to));
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [todayRes, histRes] = await Promise.all([
        apiService.getPunktKpiToday(),
        apiService.getPunktKpiHistory({ from: appliedFrom, to: appliedTo }),
      ]);
      setToday(todayRes.data ?? null);
      const list = histRes.data?.days ?? [];
      setDays(list);
      setRangeMeta({
        from: histRes.data?.from_utc ?? appliedFrom,
        to: histRes.data?.to_utc ?? appliedTo,
      });
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'KPI ma’lumotlarini yuklashda xatolik';
      await showAlert({ title: 'Xatolik', message: msg });
      setToday(null);
      setDays([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appliedFrom, appliedTo, showAlert]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const sortedDays = useMemo(
    () => [...days].sort((a, b) => b.date_utc.localeCompare(a.date_utc)),
    [days]
  );
  const rangeTotals = useMemo(() => {
    return sortedDays.reduce(
      (acc, day) => {
        acc.punktKpi += day.punkt_kpi_accrued;
        acc.paid += day.paid_total;
        acc.unpaid += day.unpaid;
        acc.pool += day.total_kpi_pool;
        acc.delivered += day.delivered_orders;
        return acc;
      },
      {
        punktKpi: 0,
        paid: 0,
        unpaid: 0,
        pool: 0,
        delivered: 0,
      }
    );
  }, [sortedDays]);

  const hasActiveFilters =
    appliedFrom !== initialRange.from || appliedTo !== initialRange.to;

  const openFilterModal = () => {
    setDraftFrom(utcDateFromYmd(appliedFrom));
    setDraftTo(utcDateFromYmd(appliedTo));
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    if (!draftFrom || !draftTo) {
      void showAlert({ title: 'Xato', message: 'Ikkala sanani ham tanlang.' });
      return;
    }
    const f = formatYmdUTC(draftFrom);
    const t = formatYmdUTC(draftTo);
    if (f > t) {
      void showAlert({ title: 'Xato', message: 'Boshlanish sanasi tugashdan katta bo‘lmasin.' });
      return;
    }
    setAppliedFrom(f);
    setAppliedTo(t);
    setShowFilterModal(false);
    setLoading(true);
  };

  const clearFilters = () => {
    setAppliedFrom(initialRange.from);
    setAppliedTo(initialRange.to);
    setDraftFrom(utcDateFromYmd(initialRange.from));
    setDraftTo(utcDateFromYmd(initialRange.to));
    setShowFilterModal(false);
    setLoading(true);
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return 'Tanlash';
    return date.toLocaleDateString('uz-UZ', { timeZone: 'UTC' });
  };

  const renderDay = useCallback(
    ({ item }: { item: PunktKpiHistoryDay }) => (
      <View style={numColumns > 1 ? styles.historyGridCell : styles.historyListCell}>
        <View style={[styles.dayCard, isWeb && styles.dayCardWeb]}>
          <Text style={styles.dayTitle}>{item.date_utc}</Text>
          <View style={styles.dayRow}>
            <Text style={styles.dayLabel}>Punkt KPI (hisoblangan)</Text>
            <Text style={styles.dayValue}>{item.punkt_kpi_accrued.toLocaleString('uz-UZ')} so‘m</Text>
          </View>
          <View style={styles.dayRow}>
            <Text style={styles.dayLabel}>KPI havzasi</Text>
            <Text style={styles.dayValueMuted}>{item.total_kpi_pool.toLocaleString('uz-UZ')} so‘m</Text>
          </View>
          <View style={styles.dayRow}>
            <Text style={styles.dayLabel}>Yetkazilgan buyurtmalar</Text>
            <Text style={styles.dayValueMuted}>{item.delivered_orders}</Text>
          </View>
          <View style={styles.dayRow}>
            <Text style={styles.dayLabel}>To‘langan</Text>
            <Text style={[styles.dayValue, styles.dayPaid]}>
              {item.paid_total.toLocaleString('uz-UZ')} so‘m
            </Text>
          </View>
          <View style={styles.dayRow}>
            <Text style={styles.dayLabel}>To‘lanmagan</Text>
            <Text style={[styles.dayValue, styles.dayUnpaid]}>
              {item.unpaid.toLocaleString('uz-UZ')} so‘m
            </Text>
          </View>
        </View>
      </View>
    ),
    [numColumns, isWeb]
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
      transparent
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={[styles.modalOverlay, Platform.OS === 'web' && styles.modalOverlayWeb]}>
        <View style={[styles.modalContent, Platform.OS === 'web' && styles.modalContentWeb]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tarix oralig‘i (UTC)</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalHint}>
            Sanalar serverda UTC kalendary kun bo‘yicha qo‘llanadi.
          </Text>
          <View
            style={[
              styles.dateRow,
              Platform.OS === 'web' &&
                (windowWidth < 520 ? styles.dateRowWebStack : styles.dateRowWeb),
            ]}
          >
            {Platform.OS === 'web' ? (
              <>
                <View style={styles.webDateWrap}>
                  <WebDateInput
                    value={draftFrom}
                    onChange={setDraftFrom}
                    maximumDate={draftTo || undefined}
                  />
                </View>
                <Text style={styles.dateSeparator}>—</Text>
                <View style={styles.webDateWrap}>
                  <WebDateInput
                    value={draftTo}
                    onChange={setDraftTo}
                    minimumDate={draftFrom || undefined}
                    maximumDate={new Date()}
                  />
                </View>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                  <Ionicons name="calendar-outline" size={18} color="#007AFF" />
                  <Text style={styles.dateButtonText}>{formatDisplayDate(draftFrom)}</Text>
                </TouchableOpacity>
                <Text style={styles.dateSeparator}>—</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                  <Ionicons name="calendar-outline" size={18} color="#007AFF" />
                  <Text style={styles.dateButtonText}>{formatDisplayDate(draftTo)}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Standart (30 kun)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Qo‘llash</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {Platform.OS !== 'web' && showStartPicker && (
        <DateTimePicker
          value={draftFrom || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, date) => {
            setShowStartPicker(false);
            if (date) setDraftFrom(date);
          }}
          maximumDate={draftTo || new Date()}
        />
      )}
      {Platform.OS !== 'web' && showEndPicker && (
        <DateTimePicker
          value={draftTo || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, date) => {
            setShowEndPicker(false);
            if (date) setDraftTo(date);
          }}
          minimumDate={draftFrom || undefined}
          maximumDate={new Date()}
        />
      )}
    </Modal>
  );

  const ListHeader = useMemo(() => {
    const rowStyle = stackToday ? styles.kpiRowStack : styles.kpiRow;
    const showSummaryCard = sortedDays.length > 0;

    return (
      <View>
        {today ? (
          <View style={[styles.kpiCard, isWeb && styles.kpiCardWeb]}>
            <View style={styles.kpiHeader}>
              <Ionicons name="wallet" size={20} color="#007AFF" />
              <View style={styles.kpiHeaderTitleBlock}>
                <Text style={styles.kpiHeaderTitle}>Bugungi KPI</Text>
                <Text style={styles.kpiHeaderSubtitle}>UTC kun: {today.date_utc}</Text>
              </View>
            </View>
            <View style={rowStyle}>
              <View style={[styles.kpiItem, stackToday && styles.kpiItemStack]}>
                <Text style={[styles.kpiLabel, stackToday && styles.kpiLabelStack]}>Punkt KPI (jami)</Text>
                <Text style={[styles.kpiValue, stackToday && styles.kpiValueStack]}>
                  {today.punkt_kpi_total.toLocaleString('uz-UZ')} so‘m
                </Text>
              </View>
              {!stackToday ? <View style={styles.kpiDivider} /> : <View style={styles.kpiDividerH} />}
              <View style={[styles.kpiItem, stackToday && styles.kpiItemStack]}>
                <Text style={[styles.kpiLabel, stackToday && styles.kpiLabelStack]}>To‘langan</Text>
                <Text style={[styles.kpiValue, styles.kpiPaid, stackToday && styles.kpiValueStack]}>
                  {today.paid_total_today.toLocaleString('uz-UZ')} so‘m
                </Text>
              </View>
              {!stackToday ? <View style={styles.kpiDivider} /> : <View style={styles.kpiDividerH} />}
              <View style={[styles.kpiItem, stackToday && styles.kpiItemStack]}>
                <Text style={[styles.kpiLabel, stackToday && styles.kpiLabelStack]}>To‘lanmagan</Text>
                <Text style={[styles.kpiValue, styles.kpiUnpaid, stackToday && styles.kpiValueStack]}>
                  {today.unpaid_today.toLocaleString('uz-UZ')} so‘m
                </Text>
              </View>
            </View>
            <Text style={styles.kpiMeta}>
              KPI havzasi: {today.total_kpi_pool.toLocaleString('uz-UZ')} so‘m · Yetkazilgan:{' '}
              {today.delivered_orders} · To‘lov yozuvlari: {today.payout_entries_today}
            </Text>
          </View>
        ) : null}
        {showSummaryCard ? (
          <View style={[styles.kpiCard, isWeb && styles.kpiCardWeb]}>
            <View style={styles.kpiHeader}>
              <Ionicons name="stats-chart" size={20} color="#007AFF" />
              <View style={styles.kpiHeaderTitleBlock}>
                <Text style={styles.kpiHeaderTitle}>Umumiy KPI hisobi</Text>
                <Text style={styles.kpiHeaderSubtitle}>
                  UTC oralig‘i: {appliedFrom} — {appliedTo}
                </Text>
              </View>
            </View>
            <View style={rowStyle}>
              <View style={[styles.kpiItem, stackToday && styles.kpiItemStack]}>
                <Text style={[styles.kpiLabel, stackToday && styles.kpiLabelStack]}>Punkt KPI (jami)</Text>
                <Text style={[styles.kpiValue, stackToday && styles.kpiValueStack]}>
                  {rangeTotals.punktKpi.toLocaleString('uz-UZ')} so‘m
                </Text>
              </View>
              {!stackToday ? <View style={styles.kpiDivider} /> : <View style={styles.kpiDividerH} />}
              <View style={[styles.kpiItem, stackToday && styles.kpiItemStack]}>
                <Text style={[styles.kpiLabel, stackToday && styles.kpiLabelStack]}>To‘langan</Text>
                <Text style={[styles.kpiValue, styles.kpiPaid, stackToday && styles.kpiValueStack]}>
                  {rangeTotals.paid.toLocaleString('uz-UZ')} so‘m
                </Text>
              </View>
              {!stackToday ? <View style={styles.kpiDivider} /> : <View style={styles.kpiDividerH} />}
              <View style={[styles.kpiItem, stackToday && styles.kpiItemStack]}>
                <Text style={[styles.kpiLabel, stackToday && styles.kpiLabelStack]}>To‘lanmagan</Text>
                <Text style={[styles.kpiValue, styles.kpiUnpaid, stackToday && styles.kpiValueStack]}>
                  {rangeTotals.unpaid.toLocaleString('uz-UZ')} so‘m
                </Text>
              </View>
            </View>
            <Text style={styles.kpiMeta}>
              KPI havzasi: {rangeTotals.pool.toLocaleString('uz-UZ')} so‘m · Yetkazilgan:{' '}
              {rangeTotals.delivered}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }, [today, sortedDays.length, stackToday, isWeb, appliedFrom, appliedTo, rangeTotals]);

  if (loading && !today && sortedDays.length === 0) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Punkt KPI',
            headerShown: true,
            headerBackTitle: 'Orqaga',
            headerRight: () => (
              <TouchableOpacity style={styles.filterHeaderButton} onPress={openFilterModal}>
                <Ionicons name="filter" size={22} color="#333" />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={[styles.centerContainer, isWeb && styles.centerContainerWeb]}>
          <View style={[isWeb && { width: '100%', maxWidth: contentMaxWidth, paddingHorizontal: horizontalPad }]}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Punkt KPI',
          headerShown: true,
          headerBackTitle: 'Orqaga',
          headerRight: () => (
            <TouchableOpacity style={styles.filterHeaderButton} onPress={openFilterModal}>
              <Ionicons name="filter" size={22} color={hasActiveFilters ? '#007AFF' : '#333'} />
              {hasActiveFilters ? <View style={styles.filterBadge} /> : null}
            </TouchableOpacity>
          ),
        }}
      />
      {renderFilterModal()}
      <View style={[styles.container, isWeb && styles.containerWeb]}>
        <View
          style={[
            styles.shell,
            {
              maxWidth: isWeb ? contentMaxWidth : undefined,
              width: '100%',
              paddingHorizontal: horizontalPad,
              ...(Platform.OS === 'web' ? { minHeight: 0, flex: 1 } : { flex: 1 }),
            },
          ]}
        >
          {rangeMeta ? (
            <Text style={styles.rangeBanner}>
              Tarix: {rangeMeta.from} — {rangeMeta.to} (UTC)
            </Text>
          ) : null}
          <FlatList
            key={numColumns > 1 ? 'kpi-grid' : 'kpi-list'}
            data={sortedDays}
            numColumns={numColumns}
            renderItem={renderDay}
            keyExtractor={(item) => item.date_utc}
            columnWrapperStyle={numColumns > 1 ? styles.historyRow : undefined}
            ListHeaderComponent={
              <View>
                {ListHeader}
                <Text style={styles.sectionTitle}>Kunlar bo‘yicha</Text>
              </View>
            }
            style={Platform.OS === 'web' ? { flex: 1, minHeight: 0 } : { flex: 1 }}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={56} color="#ccc" />
                <Text style={styles.emptyText}>Tanlangan oralig‘da kunlar yo‘q</Text>
              </View>
            }
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerWeb: {
    alignItems: 'center',
  },
  shell: {
    alignSelf: 'center',
  },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerContainerWeb: {
    width: '100%',
    alignItems: 'center',
  },
  rangeBanner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#666',
    backgroundColor: '#E8F4FF',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  listContent: { paddingBottom: 32, paddingTop: 4 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
    marginTop: 8,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiCardWeb: Platform.select({
    web: { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' } as object,
    default: {},
  }),
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  kpiHeaderTitleBlock: {
    flex: 1,
  },
  kpiHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  kpiHeaderSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiRowStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 0,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiItemStack: {
    alignItems: 'flex-start',
    paddingVertical: 8,
    flex: 0,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  kpiLabelStack: {
    alignSelf: 'flex-start',
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'center',
  },
  kpiValueStack: {
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  kpiPaid: {
    color: '#34C759',
  },
  kpiUnpaid: {
    color: '#FF9500',
  },
  kpiDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 8,
  },
  kpiDividerH: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginVertical: 4,
  },
  kpiMeta: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
  },
  historyGridCell: {
    flex: 1,
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  historyListCell: {
    width: '100%',
    marginBottom: 10,
  },
  historyRow: {
    justifyContent: 'flex-start',
    gap: 0,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5EA',
  },
  dayCardWeb: Platform.select({
    web: { boxShadow: '0 1px 8px rgba(0,0,0,0.06)' } as object,
    default: {},
  }),
  dayTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 10 },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayLabel: { fontSize: 13, color: '#666', flex: 1 },
  dayValue: { fontSize: 13, fontWeight: '600', color: '#111' },
  dayValueMuted: { fontSize: 13, color: '#555' },
  dayPaid: { color: '#34C759' },
  dayUnpaid: { color: '#FF9500' },
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, color: '#999', marginTop: 12 },
  filterHeaderButton: { padding: 8, marginRight: 8, position: 'relative' },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
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
  modalContentWeb: Platform.select({
    web: {
      width: '100%',
      maxWidth: 480,
      borderRadius: 16,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 24,
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    } as object,
    default: {},
  }),
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  modalHint: { fontSize: 12, color: '#888', marginBottom: 16, lineHeight: 17 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  dateRowWeb: { flexWrap: 'wrap' },
  dateRowWebStack: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  webDateWrap: { flex: 1, minWidth: 120 },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: { fontSize: 14, color: '#333' },
  dateSeparator: { fontSize: 16, color: '#999' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  clearButtonText: { fontSize: 15, color: '#666', fontWeight: '600' },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  applyButtonText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
