import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService, Order } from '../../services/api';
import { formatNumberDisplay } from '../../utils/formatNumber';

type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'delivered_to_punkt' | 'all';

export default function BuyurtmalarScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const loadOrders = useCallback(async (pageNum: number = 1, status?: OrderStatus) => {
    try {
      const response = await apiService.getTodayOrders({
        page: pageNum,
        limit: 20,
        status: status && status !== 'all' ? status : undefined,
      });

      
      if (pageNum === 1) {
        setOrders(response.data);
        console.log(response.data);
      } else {
        setOrders((prev) => [...prev, ...response.data]);
      }

      setHasMore(response.page < response.totalPages);
    } catch (error: any) {
      console.error('Buyurtmalarni yuklashda xatolik:', error);
      Alert.alert('Xatolik', error.message || 'Buyurtmalarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  // Get only items requested from this contragent
  // Backend already filters items, but we check itemIds for safety
  const getRequestedItems = (order: Order) => {
    const request = getCurrentRequest(order);
    if (!request) {
      return order.items || [];
    }
    
    // If backend already filtered (items length matches itemIds length), use items directly
    // Otherwise, filter by itemIds
    if (request.itemIds && request.itemIds.length > 0) {
      const items = order.items || [];
      // Check if backend already filtered
      if (items.length === request.itemIds.length) {
        return items;
      }
      // Filter items based on itemIds (indices in the original order)
      return items.filter((_, index) => request.itemIds!.includes(index));
    }
    
    return order.items || [];
  };

  // Calculate total price for requested items only
  const calculateRequestedTotalPrice = (order: Order) => {
    const requestedItems = getRequestedItems(order);
    return requestedItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
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
    const requestedTotalPrice = calculateRequestedTotalPrice(item);
    
    // currentPunkt ni to'g'ri olish - agar string bo'lsa yoki obyekt bo'lsa
    const punktName = typeof item.currentPunkt === 'string' 
      ? 'Punkt' 
      : (item.currentPunkt?.name || 'Punkt topilmadi');

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderCardContent}>
          {/* Header Section */}
          <View style={styles.orderHeader}>
            <View style={styles.orderNumberContainer}>
              <View style={[styles.orderIconContainer, { backgroundColor: `${statusColor}15` }]}>
                <Ionicons name="receipt-outline" size={22} color={statusColor} />
              </View>
              <View style={styles.orderNumberWrapper}>
                <Text style={styles.orderNumberLabel}>Buyurtma</Text>
                <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusText(request.status)}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Info Section */}
          <View style={styles.orderInfo}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="storefront" size={18} color="#007AFF" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Punkt</Text>
                <Text style={styles.infoText} numberOfLines={1}>{punktName}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name="time" size={18} color="#FF9500" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Vaqt</Text>
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
            {requestedTotalPrice > 0 && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="cash" size={18} color="#34C759" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Jami summa</Text>
                  <Text style={[styles.infoText, styles.priceText]}>
                    {formatNumberDisplay(requestedTotalPrice)} so'm
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Arrow Icon */}
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bugungi buyurtmalar</Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push('/(tabs)/buyurtmalar/history' as any)}
        >
          <Ionicons name="time-outline" size={18} color="#007AFF" />
          <Text style={styles.historyButtonText}>Tarix</Text>
        </TouchableOpacity>
      </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bugungi buyurtmalar</Text>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push('/(tabs)/buyurtmalar/history' as any)}
        >
          <Ionicons name="time-outline" size={18} color="#007AFF" />
          <Text style={styles.historyButtonText}>Tarix</Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
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
  filterScroll: {
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
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  orderCardContent: {
    padding: 16,
    position: 'relative',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  orderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderNumberWrapper: {
    flex: 1,
  },
  orderNumberLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textTransform: 'uppercase',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: 12,
  },
  orderInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textTransform: 'uppercase',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
    lineHeight: 20,
  },
  priceText: {
    color: '#34C759',
    fontWeight: '600',
    fontSize: 16,
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
});





