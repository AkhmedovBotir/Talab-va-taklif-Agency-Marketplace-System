import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { apiService, Order } from '../../../services/api';

type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt' | 'all';

export default function OrderHistoryScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  const loadOrders = useCallback(async (pageNum: number = 1, status?: OrderStatus) => {
    try {
      const params: any = {
        page: pageNum,
        limit: 20,
        status: status && status !== 'all' ? status : undefined,
      };
      if (startDate) params.startDate = formatDateForApi(startDate);
      if (endDate) params.endDate = formatDateForApi(endDate);

      const response = await apiService.getOrdersHistory(params);

      if (pageNum === 1) {
        setOrders(response.data);
      } else {
        setOrders((prev) => [...prev, ...response.data]);
      }

      setHasMore(response.page < response.totalPages);
    } catch (error: any) {
      Alert.alert('Xatolik', error.message || 'Buyurtmalarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setPage(1);
      loadOrders(1, selectedStatus);
    }, [loadOrders, selectedStatus])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadOrders(1, selectedStatus);
  }, [loadOrders, selectedStatus]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadOrders(nextPage, selectedStatus);
    }
  }, [loading, hasMore, page, loadOrders, selectedStatus]);

  const handleStatusFilter = (status: OrderStatus) => {
    setSelectedStatus(status);
    setPage(1);
    setLoading(true);
    loadOrders(1, status);
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'accepted':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      case 'delivered_to_punkt':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Kutilmoqda';
      case 'accepted':
        return 'Qabul qilindi';
      case 'rejected':
        return 'Rad etildi';
      case 'delivered_to_punkt':
        return 'Yetkazildi';
      default:
        return status;
    }
  };

  const getCurrentRequest = (order: Order) => {
    return order.contragentRequests[0];
  };

  const handleOrderPress = (order: Order) => {
    router.push({
      pathname: '/(tabs)/buyurtmalar/order/view' as any,
      params: { orderId: order._id },
    });
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const request = getCurrentRequest(item);
    const statusColor = getStatusColor(request.status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderNumberContainer}>
            <Ionicons name="receipt-outline" size={20} color="#007AFF" />
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(request.status)}
            </Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="storefront-outline" size={16} color="#8E8E93" />
            <Text style={styles.infoText}>{item.currentPunkt.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#8E8E93" />
            <Text style={styles.infoText}>
              {new Date(request.requestedAt).toLocaleDateString('uz-UZ', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buyurtmalar tarixi</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Date Filter */}
      <View style={styles.filterContainer}>
        <View style={styles.dateFilterRow}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color="#007AFF" />
            <Text style={styles.dateButtonText}>
              {startDate ? formatDateDisplay(startDate) : 'Boshlanish'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.dateSeparator}>—</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="calendar-outline" size={16} color="#007AFF" />
            <Text style={styles.dateButtonText}>
              {endDate ? formatDateDisplay(endDate) : 'Tugash'}
            </Text>
          </TouchableOpacity>

          {(startDate || endDate) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Ionicons name="close-circle" size={22} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusFilterScroll}>
          {(['all', 'pending', 'accepted', 'rejected', 'delivered_to_punkt'] as OrderStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                selectedStatus === status && styles.filterChipActive,
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
        </ScrollView>
      </View>

      {/* Date Pickers */}
      {showStartPicker && (
        Platform.OS === 'ios' ? (
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
        Platform.OS === 'ios' ? (
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

      {loading && orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Buyurtmalar mavjud emas</Text>
            </View>
          }
          ListFooterComponent={
            hasMore && orders.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : null
          }
        />
      )}
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
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
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
  statusFilterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
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
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  arrowContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
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









