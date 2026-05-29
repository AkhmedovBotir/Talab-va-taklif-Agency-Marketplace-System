import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService, Order } from '../../services/api';
import { useDeliveryProviderAuth } from '../../contexts/DeliveryProviderAuthContext';
import { useSnackbar } from '../../components/SnackbarProvider';

type OrdersMode = 'today' | 'history';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mode, setMode] = useState<OrdersMode>('today');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const { token } = useDeliveryProviderAuth();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  useEffect(() => {
    if (page === 1) {
      setOrders([]);
    }
    loadOrders(mode, page, page > 1);
  }, [mode, page, token]);

  const loadOrders = async (nextMode = mode, nextPage = page, append = false) => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (append) setLoadingMore(true);
    try {
      const response =
        nextMode === 'today'
          ? await apiService.getTodayOrders(token, nextPage, limit)
          : await apiService.getHistoryOrders(token, nextPage, limit);
      const incoming = response.data || [];
      setOrders((prev) => (append ? [...prev, ...incoming] : incoming));
      setTotalPages(response.totalPages || 1);
    } catch (error: any) {
      if (!append) {
        setOrders([]);
        setTotalPages(1);
      }
      showSnackbar(error.message || 'Buyurtmalarni yuklashda xatolik yuz berdi', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadOrders(mode, 1, false);
  };

  const onEndReached = () => {
    if (loadingMore || loading || refreshing) return;
    if (page >= totalPages) return;
    setPage((p) => p + 1);
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/(tabs)/${orderId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#0EA5E9';
      case 'accepted':
        return '#2563EB';
      case 'delivered':
        return '#34C759';
      case 'payment_collected':
        return '#7C3AED';
      case 'payment_transferred_to_shop':
        return '#16A34A';
      default:
        return '#F59E0B';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Tasdiqlangan';
      case 'accepted':
        return 'Qabul qilingan';
      case 'delivered':
        return 'Yetkazib berilgan';
      case 'payment_collected':
        return 'To\'lov olingan';
      case 'payment_transferred_to_shop':
        return 'Do\'konga topshirilgan';
      default:
        return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Buyurtmalar yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, mode === 'today' && styles.filterButtonActive]}
          onPress={() => {
            setMode('today');
            setPage(1);
          }}
        >
          <Text style={[styles.filterText, mode === 'today' && styles.filterTextActive]}>
            Bugungi buyurtmalar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, mode === 'history' && styles.filterButtonActive]}
          onPress={() => {
            setMode('history');
            setPage(1);
          }}
        >
          <Text style={[styles.filterText, mode === 'history' && styles.filterTextActive]}>
            Buyurtmalar tarixi
          </Text>
        </TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Buyurtmalar topilmadi</Text>
          <Text style={styles.emptyText}>
            {mode === 'today' ? 'Bugungi buyurtmalar hozircha yo\'q' : 'Tarixda buyurtmalar topilmadi'}
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={refreshing}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
            <Text style={styles.refreshButtonText}>Yangilash</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => handleOrderPress(item._id)}
              activeOpacity={0.7}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderNumberContainer}>
                  <Ionicons name="receipt" size={18} color="#007AFF" />
                  <Text style={styles.orderNumber}>Buyurtma #{item.id || item._id}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
              </View>

              <View style={styles.orderInfo}>
                <View style={styles.customerInfo}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.customerPhone}>
                    {new Date(item.createdAt).toLocaleString('uz-UZ')}
                  </Text>
                </View>
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="cube" size={16} color="#6B7280" />
                  <Text style={styles.itemsCount}>{item.items.length} ta mahsulot</Text>
                </View>
                <Text style={styles.totalPrice}>{formatPrice(item.totalPrice || 0)}</Text>
              </View>

              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color="#007AFF" />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#6B7280' },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterButtonActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  filterText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  listContent: { padding: 16, gap: 12, alignSelf: 'center', width: '100%', maxWidth: 980 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  orderNumberContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderNumber: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.3 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  orderInfo: { marginBottom: 16, gap: 8 },
  customerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  customerPhone: { fontSize: 15, color: '#6B7280' },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemsCount: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  totalPrice: { fontSize: 18, fontWeight: '700', color: '#007AFF', letterSpacing: -0.3 },
  arrowContainer: { position: 'absolute', right: 20, top: '50%', marginTop: -10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  refreshButtonText: { fontSize: 15, fontWeight: '600', color: '#007AFF' },
  footerLoading: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
