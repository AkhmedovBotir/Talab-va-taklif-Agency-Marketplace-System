import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { DatePickerWeb } from '../../components/DatePickerWeb';
import { PageWidthLayout } from '../../components/PageWidthLayout';
import { useResponsive } from '../../hooks/useResponsive';
import {
  apiService,
  ContragentAnalyticsSalesOrderItem,
  ContragentAnalyticsStats,
} from '../../services/api';
import { formatNumberDisplay } from '../../utils/formatNumber';
import { getStatusUz } from '../../utils/statusUz';

type TabType = 'overview' | 'orders' | 'finance';

export default function StatistikaScreen() {
  const insets = useSafeAreaInsets();
  const { isWideWeb, isDesktopWeb } = useResponsive();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<ContragentAnalyticsStats | null>(null);
  const [orders, setOrders] = useState<ContragentAnalyticsSalesOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ContragentAnalyticsSalesOrderItem | null>(null);

  const formatDateForApi = (d: Date): string => d.toISOString().split('T')[0];
  const formatDateDisplay = (d: Date | null): string =>
    d
      ? d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'Tanlang';
  const money = (n: number): string => `${formatNumberDisplay(n)} so'm`;
  const formatDateTime = (s?: string): string => {
    if (!s) return '—';
    const t = new Date(s).getTime();
    if (!Number.isFinite(t)) return '—';
    return new Date(t).toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const dateParams = useMemo(() => {
    const p: { from?: string; to?: string } = {};
    if (startDate && endDate) {
      p.from = formatDateForApi(startDate);
      p.to = formatDateForApi(endDate);
    }
    return p;
  }, [startDate, endDate]);

  const loadAll = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const [statsRes, ordersRes] = await Promise.all([
        apiService.getAnalyticsStats(dateParams),
        apiService.getAnalyticsSalesOrders({ ...dateParams, page: 1, limit: 20 }),
      ]);
      setStats(statsRes);
      setOrders(ordersRes.items);
      setPage(1);
      setHasMore(ordersRes.page < ordersRes.totalPages);
    } catch (e: any) {
      setError(e.message || 'Statistikani yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateParams]);

  const loadMoreOrders = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const next = page + 1;
      const res = await apiService.getAnalyticsSalesOrders({ ...dateParams, page: next, limit: 20 });
      setOrders((prev) => [...prev, ...res.items]);
      setPage(next);
      setHasMore(res.page < res.totalPages);
    } catch {
      // footer loading xatosini sokin o'tkazamiz
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, dateParams]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const renderOrderRow = ({ item }: { item: ContragentAnalyticsSalesOrderItem }) => (
    <TouchableOpacity
      style={[styles.orderRow, isWideWeb && styles.orderRowWide]}
      activeOpacity={0.75}
      onPress={() => setSelectedOrder(item)}
    >
      <View style={styles.orderRowTop}>
        <Text style={styles.orderId}>Buyurtma #{item.orderId}</Text>
        <View style={styles.orderStatusBadge}>
          <Text style={styles.orderStatusText}>{getStatusUz(item.orderStatus)}</Text>
        </View>
      </View>
      <Text style={styles.orderMeta}>
        Qatorlar: {item.linesCount} • {formatDateTime(item.orderUpdatedAt)}
      </Text>
      <View style={styles.orderMoneyRow}>
        <Text style={styles.orderMoneyLabel}>Savdo:</Text>
        <Text style={styles.orderMoneyValue}>{money(item.grossSalesTotal)}</Text>
      </View>
      <View style={styles.orderMoneyRow}>
        <Text style={styles.orderMoneyLabel}>Tannarx:</Text>
        <Text style={styles.orderMoneyValue}>{money(item.costTotal)}</Text>
      </View>
      <View style={[styles.orderMoneyRow, styles.orderMoneyRowLast]}>
        <Text style={styles.orderMoneyLabelStrong}>To'lov:</Text>
        <Text style={styles.orderMoneyValueStrong}>{money(item.payoutTotal)}</Text>
      </View>
      <View style={styles.orderTapHint}>
        <Ionicons name="information-circle-outline" size={14} color="#8E8E93" />
        <Text style={styles.orderTapHintText}>Batafsil ko'rish</Text>
      </View>
    </TouchableOpacity>
  );

  const Header = (
    <>
      <View style={styles.headerBar}>
        <PageWidthLayout flex={false} style={styles.headerInner}>
          <Text style={styles.headerTitle}>Statistika</Text>
        </PageWidthLayout>
      </View>
      <View style={styles.tabsContainer}>
        <PageWidthLayout flex={false} style={styles.tabsInner}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Umumiy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>Buyurtmalar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'finance' && styles.tabActive]}
            onPress={() => setActiveTab('finance')}
          >
            <Text style={[styles.tabText, activeTab === 'finance' && styles.tabTextActive]}>Moliyaviy</Text>
          </TouchableOpacity>
        </PageWidthLayout>
      </View>
      <View style={styles.filterContainer}>
        <PageWidthLayout flex={false}>
          <View style={[styles.filterRow, isWideWeb && styles.filterRowWide]}>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
              <Ionicons name="calendar-outline" size={18} color="#007AFF" />
              <Text style={styles.dateButtonText}>{startDate ? formatDateDisplay(startDate) : 'Boshlanish'}</Text>
            </TouchableOpacity>
            <Text style={styles.dateSeparator}>—</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
              <Ionicons name="calendar-outline" size={18} color="#007AFF" />
              <Text style={styles.dateButtonText}>{endDate ? formatDateDisplay(endDate) : 'Tugash'}</Text>
            </TouchableOpacity>
            {(startDate || endDate) && (
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Ionicons name="close-circle" size={22} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        </PageWidthLayout>
      </View>
    </>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {Header}
        <PageWidthLayout style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Yuklanmoqda...</Text>
        </PageWidthLayout>
      </View>
    );
  }

  if (error && !stats) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {Header}
        <PageWidthLayout style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadAll()}>
            <Text style={styles.retryButtonText}>Qayta urinish</Text>
          </TouchableOpacity>
        </PageWidthLayout>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {Header}
      <PageWidthLayout style={styles.contentFlex}>
        {activeTab === 'orders' ? (
          <FlatList
            data={orders}
            keyExtractor={(item) => `analytics-order-${item.orderId}-${item.orderUpdatedAt}`}
            renderItem={renderOrderRow}
            contentContainerStyle={styles.listContent}
            numColumns={isDesktopWeb ? 2 : 1}
            key={`orders-${isDesktopWeb ? '2' : '1'}`}
            columnWrapperStyle={isDesktopWeb ? styles.orderColumns : undefined}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAll(true)} />}
            onEndReached={loadMoreOrders}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="receipt-outline" size={56} color="#ccc" />
                <Text style={styles.emptyText}>Buyurtmalar topilmadi</Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              ) : null
            }
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAll(true)} />}
          >
            {activeTab === 'overview' ? (
              <>
                <View style={styles.grid}>
                  <View style={[styles.metricCard, styles.metricBlue]}>
                    <Text style={styles.metricValue}>{formatNumberDisplay(stats?.ordersCount || 0)}</Text>
                    <Text style={styles.metricLabel}>Buyurtmalar soni</Text>
                  </View>
                  <View style={[styles.metricCard, styles.metricGreen]}>
                    <Text style={styles.metricValue}>{formatNumberDisplay(stats?.linesCount || 0)}</Text>
                    <Text style={styles.metricLabel}>Qatorlar soni</Text>
                  </View>
                </View>
                <View style={styles.mainCard}>
                  <Text style={styles.mainTitle}>Savdo va marja</Text>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Umumiy savdo</Text>
                    <Text style={styles.rowValue}>{money(stats?.grossSalesTotal || 0)}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Tannarx</Text>
                    <Text style={styles.rowValue}>{money(stats?.costTotal || 0)}</Text>
                  </View>
                  <View style={[styles.row, styles.rowLast]}>
                    <Text style={styles.rowLabelStrong}>Marja</Text>
                    <Text style={styles.rowValueStrong}>{money(stats?.marginTotal || 0)}</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.mainCard}>
                <Text style={styles.mainTitle}>Moliyaviy ko'rsatkichlar</Text>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>KPI fondi</Text>
                  <Text style={styles.rowValue}>{money(stats?.kpiPoolTotal || 0)}</Text>
                </View>
                <View style={[styles.row, styles.rowLast]}>
                  <Text style={styles.rowLabelStrong}>To'lov (payout)</Text>
                  <Text style={styles.rowValueStrong}>{money(stats?.payoutTotal || 0)}</Text>
                </View>
                <View style={styles.periodBox}>
                  <Text style={styles.periodText}>
                    Davr: {stats?.fromUtc || '—'} → {stats?.toUtc || '—'}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </PageWidthLayout>

      {showStartPicker &&
        (Platform.OS === 'web' ? (
          <DatePickerWeb
            visible
            value={startDate || new Date()}
            maximumDate={endDate || new Date()}
            title="Boshlanish sanasi"
            onConfirm={(date) => {
              setStartDate(date);
              setShowStartPicker(false);
              if (endDate && date > endDate) setEndDate(date);
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
                  onChange={(_, date) => {
                    if (date) {
                      setStartDate(date);
                      if (endDate && date > endDate) setEndDate(date);
                    }
                  }}
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
              if (date) {
                setStartDate(date);
                if (endDate && date > endDate) setEndDate(date);
              }
            }}
            maximumDate={endDate || new Date()}
          />
        ))}

      {showEndPicker &&
        (Platform.OS === 'web' ? (
          <DatePickerWeb
            visible
            value={endDate || new Date()}
            minimumDate={startDate || undefined}
            maximumDate={new Date()}
            title="Tugash sanasi"
            onConfirm={(date) => {
              setEndDate(date);
              setShowEndPicker(false);
              if (startDate && date < startDate) setStartDate(date);
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
                  onChange={(_, date) => {
                    if (date) {
                      setEndDate(date);
                      if (startDate && date < startDate) setStartDate(date);
                    }
                  }}
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
              if (date) {
                setEndDate(date);
                if (startDate && date < startDate) setStartDate(date);
              }
            }}
            minimumDate={startDate || undefined}
            maximumDate={new Date()}
          />
        ))}

      {/* Buyurtma detail modal */}
      <Modal
        visible={selectedOrder != null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.orderDetailOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSelectedOrder(null)} />
          <View style={styles.orderDetailSheet}>
            <View style={styles.orderDetailHeader}>
              <Text style={styles.orderDetailTitle}>
                Buyurtma #{selectedOrder?.orderId ?? '—'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.orderDetailStatusWrap}>
              <View style={styles.orderStatusBadge}>
                <Text style={styles.orderStatusText}>
                  {getStatusUz(selectedOrder?.orderStatus)}
                </Text>
              </View>
              <Text style={styles.orderDetailDate}>
                {formatDateTime(selectedOrder?.orderUpdatedAt)}
              </Text>
            </View>

            <View style={styles.orderDetailRows}>
              <View style={styles.orderDetailRow}>
                <Text style={styles.orderDetailLabel}>Qatorlar soni</Text>
                <Text style={styles.orderDetailValue}>{selectedOrder?.linesCount ?? 0}</Text>
              </View>
              <View style={styles.orderDetailRow}>
                <Text style={styles.orderDetailLabel}>Umumiy savdo</Text>
                <Text style={styles.orderDetailValue}>{money(selectedOrder?.grossSalesTotal ?? 0)}</Text>
              </View>
              <View style={styles.orderDetailRow}>
                <Text style={styles.orderDetailLabel}>Tannarx</Text>
                <Text style={styles.orderDetailValue}>{money(selectedOrder?.costTotal ?? 0)}</Text>
              </View>
              <View style={[styles.orderDetailRow, styles.orderDetailRowLast]}>
                <Text style={styles.orderDetailLabelStrong}>To'lov (payout)</Text>
                <Text style={styles.orderDetailValueStrong}>{money(selectedOrder?.payoutTotal ?? 0)}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  contentFlex: { flex: 1, paddingHorizontal: 0 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerInner: { paddingVertical: 14 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabsInner: { flexDirection: 'row' },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 15, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#007AFF', fontWeight: '700' },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 10,
  },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterRowWide: { maxWidth: 680 },
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
  dateButtonText: { fontSize: 14, color: '#333' },
  dateSeparator: { fontSize: 16, color: '#999' },
  clearButton: { padding: 4 },
  listContent: { paddingVertical: 16, paddingHorizontal: 16, paddingBottom: 28 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
  },
  metricBlue: { borderLeftColor: '#007AFF' },
  metricGreen: { borderLeftColor: '#34C759' },
  metricValue: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  metricLabel: { fontSize: 13, color: '#666', marginTop: 4 },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  mainTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  rowLabelStrong: { fontSize: 15, color: '#333', fontWeight: '700' },
  rowValueStrong: { fontSize: 16, color: '#007AFF', fontWeight: '800' },
  periodBox: {
    marginTop: 10,
    backgroundColor: '#F2F8FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  periodText: { fontSize: 13, color: '#3c4a5f' },
  orderRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  orderRowWide: {
    flex: 1,
  },
  orderColumns: {
    gap: 10,
  },
  orderRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  orderStatusBadge: {
    backgroundColor: '#EEF5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  orderStatusText: { fontSize: 12, color: '#007AFF', fontWeight: '700' },
  orderMeta: { fontSize: 12, color: '#666', marginTop: 6, marginBottom: 8 },
  orderMoneyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  orderMoneyRowLast: { marginTop: 2, borderTopWidth: 1, borderTopColor: '#f1f1f1', paddingTop: 8 },
  orderMoneyLabel: { fontSize: 13, color: '#666' },
  orderMoneyValue: { fontSize: 13, color: '#333', fontWeight: '500' },
  orderMoneyLabelStrong: { fontSize: 14, color: '#333', fontWeight: '700' },
  orderMoneyValueStrong: { fontSize: 15, color: '#007AFF', fontWeight: '800' },
  orderTapHint: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderTapHintText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyBox: { paddingVertical: 64, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 12, color: '#888', fontSize: 15 },
  footerLoader: { paddingVertical: 14, alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  errorText: { marginTop: 12, fontSize: 16, color: '#FF3B30', textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  modalDone: { fontSize: 16, fontWeight: '600', color: '#007AFF' },

  orderDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  orderDetailSheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  orderDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderDetailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  orderDetailStatusWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderDetailDate: {
    fontSize: 12,
    color: '#666',
  },
  orderDetailRows: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderDetailRowLast: {
    borderBottomWidth: 0,
  },
  orderDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  orderDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  orderDetailLabelStrong: {
    fontSize: 15,
    color: '#333',
    fontWeight: '700',
  },
  orderDetailValueStrong: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '800',
  },
});
