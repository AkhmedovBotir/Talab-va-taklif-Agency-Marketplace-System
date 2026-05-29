import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDialog } from '../../components/AppDialog';
import { PageWidthLayout } from '../../components/PageWidthLayout';
import { useResponsive } from '../../hooks/useResponsive';
import {
  apiService,
  PunktLineRequest,
  PunktLineRequestStatus,
} from '../../services/api';
import { PunktOrderGroupCard } from '../../components/PunktOrderGroupCard';
import { OrderLineGroup, groupLinesByOrderId } from '../../utils/orderLineGroups';
import { getStatusUz } from '../../utils/statusUz';

type LineStatusFilter = PunktLineRequestStatus | 'all';

const FILTER_STATUSES: LineStatusFilter[] = [
  'all',
  'pending',
  'accepted',
  'preparing',
  'delivered',
  'rejected',
];

export default function BuyurtmalarScreen() {
  const [lines, setLines] = useState<PunktLineRequest[]>([]);
  const [punktNameById, setPunktNameById] = useState<Record<number, string>>({});
  const [productNameByProductId, setProductNameByProductId] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LineStatusFilter>('all');
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

  const todayLines = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    return lines.filter((l) => {
      const t = new Date(l.createdAt).getTime();
      if (!Number.isFinite(t)) return false;
      const dt = new Date(t);
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    });
  }, [lines]);

  const grouped = useMemo(() => groupLinesByOrderId(todayLines), [todayLines]);

  const openLine = useCallback(
    (line: PunktLineRequest) => {
      router.push({
        pathname: '/buyurtmalar/order/view' as any,
        params: { lineRequestId: String(line.id) },
      });
    },
    [router]
  );

  const openGroup = useCallback(
    (group: OrderLineGroup) => {
      const ids = group.lines.map((l) => l.id).join(',');
      router.push({
        pathname: '/buyurtmalar/order/group' as any,
        params: { orderId: String(group.orderId), lineIds: ids },
      });
    },
    [router]
  );

  const renderGroupItem = ({ item }: { item: OrderLineGroup }) => (
    <PunktOrderGroupCard
      group={item}
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

  if (loading && todayLines.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <PageWidthLayout flex={false} style={styles.headerInner}>
            <Text style={styles.headerTitle}>Buyurtma qatorlari</Text>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => router.push('/buyurtmalar/history' as any)}
            >
              <Ionicons name="time-outline" size={18} color="#007AFF" />
              <Text style={styles.historyButtonText}>Tarix</Text>
            </TouchableOpacity>
          </PageWidthLayout>
        </View>
        <PageWidthLayout style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </PageWidthLayout>
        {dialog}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <PageWidthLayout flex={false} style={styles.headerInner}>
          <Text style={styles.headerTitle}>Buyurtma qatorlari</Text>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push('/buyurtmalar/history' as any)}
          >
            <Ionicons name="time-outline" size={18} color="#007AFF" />
            <Text style={styles.historyButtonText}>Tarix</Text>
          </TouchableOpacity>
        </PageWidthLayout>
      </View>

      <View style={styles.filterContainer}>
        {isWideWeb ? (
          <PageWidthLayout flex={false} style={styles.filterWrap}>
            <View style={styles.filterRowWrap}>{filterChips}</View>
          </PageWidthLayout>
        ) : (
          <PageWidthLayout flex={false}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={Platform.OS === 'web'}
              contentContainerStyle={styles.filterScroll}
            >
              {filterChips}
            </ScrollView>
          </PageWidthLayout>
        )}
      </View>

      <PageWidthLayout style={styles.listFlex}>
        <FlatList
          data={grouped}
          renderItem={renderGroupItem}
          keyExtractor={(item) => `order-${item.orderId}`}
          contentContainerStyle={[
            styles.listContent,
            Platform.OS === 'web' && styles.listContentWeb,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Bugun uchun so‘rovlar mavjud emas</Text>
            </View>
          }
          ListFooterComponent={
            hasMore && todayLines.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : null
          }
        />
      </PageWidthLayout>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterWrap: {
    width: '100%',
  },
  filterRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterScroll: {
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
});





