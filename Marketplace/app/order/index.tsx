import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import apiService, { Order, PaymentTransaction } from '../../services/api';

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { unreadCount } = useNotification();
  const { showSuccess, showError, showInfo } = useSnackbar();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, PaymentTransaction | null>>({});
  const [payingOrders, setPayingOrders] = useState<Record<string, boolean>>({});

  const checkPaymentStatus = useCallback(async (orderId: string) => {
    if (!token) return;

    try {
      const response = await apiService.getPaymentStatus(orderId, token);
      if (response.success && response.transaction) {
        setPaymentStatuses((prev) => ({
          ...prev,
          [orderId]: response.transaction!,
        }));
      } else {
        // Payment not found or not paid yet
        setPaymentStatuses((prev) => ({
          ...prev,
          [orderId]: null,
        }));
      }
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      // If payment not found, it's okay - order hasn't been paid yet
      setPaymentStatuses((prev) => ({
        ...prev,
        [orderId]: null,
      }));
    }
  }, [token]);

  const loadOrders = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!token) return;

    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await apiService.getOrders(
        {
          page: pageNum,
          limit: 20,
        },
        token
      );

      if (append) {
        setOrders((prev) => [...prev, ...response.data]);
      } else {
        setOrders(response.data);
      }

      setPage(response.page);
      setHasMore(response.page < response.totalPages);

      // Check payment status for confirmed orders
      if (token) {
        const confirmedOrders = response.data.filter(
          (order) => order.status === 'confirmed_by_customer'
        );
        
        for (const order of confirmedOrders) {
          checkPaymentStatus(order._id);
        }
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
      showError(error.message || 'Buyurtmalarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [token, checkPaymentStatus]);

  const handlePayment = useCallback(async (order: Order) => {
    if (!token) return;

    // Check if order is confirmed by customer
    if (order.status !== 'confirmed_by_customer') {
      showError('To\'lov qilish uchun buyurtma mijoz tomonidan tasdiqlangan bo\'lishi kerak');
      return;
    }

    // Check if already paid
    if (order.paymentStatus === 'paid') {
      showInfo('Bu buyurtma uchun to\'lov allaqachon qilingan');
      return;
    }

    Alert.alert(
      'To\'lov qilish',
      `To'lov summa: ${formatPrice(order.totalPrice)}\nTo'lov usuli: ${order.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}\n\nTo'lov qilishni tasdiqlaysizmi?`,
      [
        {
          text: 'Bekor qilish',
          style: 'cancel',
        },
        {
          text: 'To\'lov qilish',
          onPress: async () => {
            try {
              setPayingOrders((prev) => ({ ...prev, [order._id]: true }));
              const response = await apiService.payOrder(order._id, token);
              
              if (response.success && response.transaction) {
                showSuccess('To\'lov muvaffaqiyatli amalga oshirildi');
                
                // Update payment status
                setPaymentStatuses((prev) => ({
                  ...prev,
                  [order._id]: response.transaction!,
                }));

                // Refresh orders to update payment status
                loadOrders(page, false);
              }
            } catch (error: any) {
              console.error('Error making payment:', error);
              showError(error.message || 'To\'lov qilishda xatolik yuz berdi');
            } finally {
              setPayingOrders((prev) => {
                const newState = { ...prev };
                delete newState[order._id];
                return newState;
              });
            }
          },
        },
      ]
    );
  }, [token, page, loadOrders]);

  useEffect(() => {
    if (token) {
      loadOrders(1, false);
    }
  }, [token, loadOrders]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadOrders(1, false);
  }, [loadOrders]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadOrders(page + 1, true);
    }
  }, [loadingMore, hasMore, page, loadOrders]);

  const handleOrderPress = (order: Order) => {
    router.push(`/order/${order._id}` as any);
  };

  const handleNotificationPress = () => {
    router.push('/notifications' as any);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'confirmed_by_punkt':
        return '#007AFF';
      case 'requested_to_contragent':
        return '#5856D6';
      case 'accepted_by_contragent':
        return '#5AC8FA';
      case 'delivered_to_punkt':
        return '#AF52DE';
      case 'assigned_to_agent':
        return '#FF2D55';
      case 'confirmed_by_agent':
        return '#34C759';
      case 'confirmed_by_customer':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Kutilmoqda';
      case 'confirmed_by_punkt':
        return 'Punkt tomonidan tasdiqlandi';
      case 'requested_to_contragent':
        return 'Kontragentga so\'rov yuborildi';
      case 'accepted_by_contragent':
        return 'Kontragent tomonidan qabul qilindi';
      case 'delivered_to_punkt':
        return 'Punktga yetkazildi';
      case 'assigned_to_agent':
        return 'Agentga tayinlandi';
      case 'confirmed_by_agent':
        return 'Agent tomonidan tasdiqlandi';
      case 'confirmed_by_customer':
        return 'Mijoz tomonidan tasdiqlandi';
      case 'cancelled':
        return 'Bekor qilingan';
      default:
        return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ').format(price) + ' so\'m';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Kutilmoqda';
      case 'collected':
        return 'Qabul qilindi';
      case 'submitted':
        return 'Topshirildi';
      case 'received':
        return 'Qabul qilindi';
      case 'confirmed':
        return 'Tasdiqlandi';
      case 'rejected':
        return 'Rad etildi';
      default:
        return status;
    }
  };

  const renderItem = ({ item }: { item: Order }) => {
    const paymentTransaction = paymentStatuses[item._id];
    const isPaying = payingOrders[item._id];
    const shouldShowPaymentButton = 
      item.status === 'confirmed_by_customer' && 
      item.paymentStatus === 'pending' && 
      !paymentTransaction;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.orderInfoRow}>
            <Ionicons name="cube-outline" size={16} color="#666" />
            <Text style={styles.orderInfoText}>
              {item.itemCount} ta mahsulot
            </Text>
          </View>
          <View style={styles.orderInfoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.orderInfoText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>{formatPrice(item.totalPrice)}</Text>
          {item.paymentStatus === 'paid' && (
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.paidText}>To'langan</Text>
            </View>
          )}
        </View>

        {/* Payment Section */}
        {shouldShowPaymentButton && (
          <TouchableOpacity
            style={styles.paymentButton}
            onPress={(e) => {
              e.stopPropagation();
              handlePayment(item);
            }}
            disabled={isPaying}
          >
            {isPaying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="card-outline" size={18} color="#fff" />
                <Text style={styles.paymentButtonText}>To'lov qilish</Text>
              </>
            )}
          </TouchableOpacity>
        )}

      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Buyurtmalar topilmadi</Text>
        <Text style={styles.emptySubtext}>
          Siz hali hech qanday buyurtma bermadingiz
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Buyurtmalarim"
        showBackButton
        onBackPress={() => router.push('/(tabs)/profile')}
        onNotificationPress={handleNotificationPress}
        unreadCount={unreadCount}
      />

      {loading && orders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    marginBottom: 12,
    gap: 8,
  },
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderInfoText: {
    fontSize: 14,
    color: '#666',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e7',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paidText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentStatusContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  paymentStatusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  paymentStatusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentStatusNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

