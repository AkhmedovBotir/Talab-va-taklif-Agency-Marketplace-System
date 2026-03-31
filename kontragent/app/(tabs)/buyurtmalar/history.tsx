import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { useAppDialog } from '../../../components/AppDialog';
import { DatePickerWeb } from '../../../components/DatePickerWeb';
import { PageWidthLayout } from '../../../components/PageWidthLayout';
import { PunktOrderGroupCard } from '../../../components/PunktOrderGroupCard';
import { useResponsive } from '../../../hooks/useResponsive';
import {
  apiService,
  PunktLineRequest,
  PunktLineRequestStatus,
} from '../../../services/api';
import { OrderLineGroup, groupLinesByOrderId } from '../../../utils/orderLineGroups';
import { getStatusUz } from '../../../utils/statusUz';

type LineStatusFilter = PunktLineRequestStatus | 'all';

const FILTER_STATUSES: LineStatusFilter[] = [
  'all',
  'pending',
  'accepted',
  'preparing',
  'delivered',
  'rejected',
];

export default function OrderHistoryScreen() {
  const [lines, setLines] = useState<PunktLineRequest[]>([]);
  const [punktNameById, setPunktNameById] = useState<Record<number, string>>({});
  const [productNameByProductId, setProductNameByProductId] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LineStatusFilter>('all');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dialog, alert: showAlert } = useAppDialog();
  const { isWideWeb } = useResponsive();

  const loadLines = useCallback(async (pageNum: number = 1, status?: LineStatusFilter) => {
    try {
      const response = await apiService.getPunktLineRequests({
        page: pageNum,
        limit: 20,
        status: status && status !== 'all' ? status : undefined,
      });

      if (pageNum === 1) {
        setLines(response.items);
      } else {
        setLines((prev) => [...prev, ...response.items]);
      }

      setHasMore(response.page < response.totalPages);
    } catch (error: any) {
      showAlert('Xatolik', error.message || 'So‘rovlarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showAlert]);

  const loadPunktNames = useCallback(async () => {
    try {
      const all: Record<number, string> = {};
      let pageNum = 1;
      while (pageNum <= 30) {
        const res = await apiService.getNoAuthPunkts({ page: pageNum, limit: 100 });
        for (const p of res.items) {
          if (Number.isFinite(p.id) && p.name) all[p.id] = p.name;
        }
        if (pageNum >= res.totalPages || res.items.length === 0) break;
        pageNum += 1;
      }
      setPunktNameById(all);
    } catch {
      // NoAuth punktlar ixtiyoriy ko'rinish boyitishi uchun.
    }
  }, []);

  const loadProductNames = useCallback(async () => {
    const ids = Array.from(
      new Set(lines.map((l) => l.productId).filter((id): id is number => Number.isFinite(id as number)))
    );
    const missing = ids.filter((id) => !productNameByProductId[id]);
    if (missing.length === 0) return;
    const pairs = await Promise.all(
      missing.map(async (id) => {
        const name = await apiService.getNoAuthProductNameById(id);
        return [id, name] as const;
      })
    );
    setProductNameByProductId((prev) => {
      const next = { ...prev };
      for (const [id, name] of pairs) {
        if (name) next[id] = name;
      }
      return next;
    });
  }, [lines, productNameByProductId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setPage(1);
      loadLines(1, selectedStatus);
      if (Object.keys(punktNameById).length === 0) {
        loadPunktNames();
      }
    }, [loadLines, selectedStatus, loadPunktNames, punktNameById])
  );

  React.useEffect(() => {
    loadProductNames();
  }, [loadProductNames]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadLines(1, selectedStatus);
  }, [loadLines, selectedStatus]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadLines(nextPage, selectedStatus);
    }
  }, [loading, hasMore, page, loadLines, selectedStatus]);

  const handleStatusFilter = (status: LineStatusFilter) => {
    setSelectedStatus(status);
    setPage(1);
    setLoading(true);
    loadLines(1, status);
  };

  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const formatDateDisplay = (d: Date | null): string => {
    if (!d) return 'Tanlang';
    return d.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'accepted':
        return '#34C759';
      case 'preparing':
        return '#5856D6';
      case 'delivered':
        return '#007AFF';
      case 'rejected':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => getStatusUz(status);

  const filteredLines = useMemo(() => {
    if (!startDate && !endDate) return lines;
    const start = startDate
      ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0).getTime()
      : Number.NEGATIVE_INFINITY;
    const end = endDate
      ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime()
      : Number.POSITIVE_INFINITY;
    return lines.filter((l) => {
      const t = new Date(l.createdAt).getTime();
      if (!Number.isFinite(t)) return false;
      return t >= start && t <= end;
    });
  }, [lines, startDate, endDate]);

  const grouped = useMemo(() => groupLinesByOrderId(filteredLines), [filteredLines]);

  const openLine = useCallback(
    (line: PunktLineRequest) => {
      router.push({
        pathname: '/(tabs)/buyurtmalar/order/view' as any,
        params: { lineRequestId: String(line.id) },
      });
    },
    [router]
  );

  const openGroup = useCallback(
    (group: OrderLineGroup) => {
      const ids = group.lines.map((l) => l.id).join(',');
      router.push({
        pathname: '/(tabs)/buyurtmalar/order/group' as any,
        params: { orderId: String(group.orderId), lineIds: ids },
      });
    },
    [router]
  );

  const renderGroupItem = ({ item }: { item: OrderLineGroup }) => (
    <PunktOrderGroupCard
      group={item}
      compact
      getStatusColor={getStatusColor}
      getStatusText={getStatusText}
      onOpenLine={openLine}
      onOpenGroup={openGroup}
      punktNameById={punktNameById}
      productNameByProductId={productNameByProductId}
    />
  );

  const filterChips = (
    <>
      {FILTER_STATUSES.map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterChip,
            selectedStatus === status && styles.filterChipActive,
            isWideWeb && styles.filterChipWeb,
          ]}
          onPress={() => handleStatusFilter(status)}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedStatus === status && styles.filterChipTextActive,
            ]}
          >
            {status === 'all' ? 'Barchasi' : getStatusText(status)}
          </Text>
        </TouchableOpacity>
      ))}
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <PageWidthLayout flex={false} style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buyurtmalar tarixi</Text>
          <View style={{ width: 40 }} />
        </PageWidthLayout>
      </View>

      <View style={styles.filterContainer}>
        <PageWidthLayout flex={false} style={styles.dateFilterWrap}>
          <View style={styles.dateFilterRow}>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
              <Ionicons name="calendar-outline" size={16} color="#007AFF" />
              <Text style={styles.dateButtonText}>
                {startDate ? formatDateDisplay(startDate) : 'Boshlanish'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.dateSeparator}>—</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
              <Ionicons name="calendar-outline" size={16} color="#007AFF" />
              <Text style={styles.dateButtonText}>
                {endDate ? formatDateDisplay(endDate) : 'Tugash'}
              </Text>
            </TouchableOpacity>
            {(startDate || endDate) && (
              <TouchableOpacity style={styles.clearButton} onPress={clearDateFilters}>
                <Ionicons name="close-circle" size={22} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        </PageWidthLayout>
        {isWideWeb ? (
          <PageWidthLayout flex={false} style={styles.filterWrap}>
            <View style={styles.filterRowWrap}>{filterChips}</View>
          </PageWidthLayout>
        ) : (
          <PageWidthLayout flex={false}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={Platform.OS === 'web'}
              contentContainerStyle={styles.statusFilterScroll}
            >
              {filterChips}
            </ScrollView>
          </PageWidthLayout>
        )}
      </View>

      {loading && lines.length === 0 ? (
        <PageWidthLayout style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </PageWidthLayout>
      ) : (
        <PageWidthLayout style={styles.listFlex}>
          <FlatList
            data={grouped}
            renderItem={renderGroupItem}
            keyExtractor={(item) => `order-${item.orderId}`}
            contentContainerStyle={[
              styles.listContent,
              Platform.OS === 'web' && styles.listContentWeb,
            ]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>So‘rovlar mavjud emas</Text>
              </View>
            }
            ListFooterComponent={
              hasMore && lines.length > 0 ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              ) : null
            }
          />
        </PageWidthLayout>
      )}
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
      {dialog}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEDED',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listFlex: {
    flex: 1,
    paddingHorizontal: 0,
  },
  headerBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateFilterWrap: {
    marginBottom: 12,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 13,
    color: '#333',
  },
  dateSeparator: {
    fontSize: 14,
    color: '#999',
  },
  clearButton: {
    padding: 4,
  },
  filterWrap: {
    width: '100%',
  },
  filterRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusFilterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipWeb: {
    marginRight: 0,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  listContentWeb: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
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
});
