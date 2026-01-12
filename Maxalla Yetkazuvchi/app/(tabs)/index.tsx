import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { apiService, Order } from '../../services/api';
import { useDeliveryProviderAuth } from '../../contexts/DeliveryProviderAuthContext';
import { formatPhoneForDisplay } from '../../utils/phoneFormatter';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { token } = useDeliveryProviderAuth();
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, [statusFilter, token]);

  const loadOrders = async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await apiService.getOrders(token, {
        status: statusFilter,
        page: 1,
        limit: 50,
      });

      if (response.success) {
        // API response data array bo'lishi mumkin yoki data ichida bo'lishi mumkin
        const ordersData = Array.isArray(response.data) 
          ? response.data 
          : (response.data && Array.isArray(response.data.data) 
            ? response.data.data 
            : []);
        setOrders(ordersData);
      } else {
        setOrders([]);
        if (response.message) {
          console.log('API Message:', response.message);
        }
      }
    } catch (error: any) {
      console.error('Orders loading error:', error);
      setOrders([]);
      // Faqat xatolik bo'lsa alert ko'rsatish
      if (error.message && !error.message.includes('Network')) {
        Alert.alert('Xatolik', error.message || 'Buyurtmalarni yuklashda xatolik yuz berdi');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/(tabs)/${orderId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed_by_customer':
        return '#34C759';
      case 'accepted_by_contragent':
        return '#007AFF';
      case 'requested_to_contragent':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed_by_customer':
        return 'Yetkazib berilgan';
      case 'accepted_by_contragent':
        return 'Qabul qilingan';
      case 'requested_to_contragent':
        return 'So\'rov yuborilgan';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed_by_customer':
        return 'checkmark-circle';
      case 'accepted_by_contragent':
        return 'checkmark';
      case 'requested_to_contragent':
        return 'time';
      default:
        return 'ellipse';
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
          style={[
            styles.filterButton,
            !statusFilter && styles.filterButtonActive,
          ]}
          onPress={() => setStatusFilter(undefined)}
        >
          <Text
            style={[
              styles.filterText,
              !statusFilter && styles.filterTextActive,
            ]}
          >
            Barchasi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === 'accepted_by_contragent' && styles.filterButtonActive,
          ]}
          onPress={() => setStatusFilter('accepted_by_contragent')}
        >
          <Text
            style={[
              styles.filterText,
              statusFilter === 'accepted_by_contragent' && styles.filterTextActive,
            ]}
          >
            Qabul qilingan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === 'confirmed_by_customer' && styles.filterButtonActive,
          ]}
          onPress={() => setStatusFilter('confirmed_by_customer')}
        >
          <Text
            style={[
              styles.filterText,
              statusFilter === 'confirmed_by_customer' && styles.filterTextActive,
            ]}
          >
            Yetkazib berilgan
          </Text>
        </TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Buyurtmalar topilmadi</Text>
          <Text style={styles.emptyText}>
            {statusFilter 
              ? 'Bu holatdagi buyurtmalar hozircha yo\'q' 
              : 'Sizga hali buyurtmalar yuborilmagan'}
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
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
                  <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(item.status) },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(item.status) as any}
                    size={14}
                    color="#fff"
                  />
                  <Text style={styles.statusText}>
                    {getStatusText(item.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.orderInfo}>
                <View style={styles.customerInfo}>
                  <Ionicons name="person" size={16} color="#6B7280" />
                  <Text style={styles.customerName}>
                    {item.user.firstName} {item.user.lastName}
                  </Text>
                </View>
                <View style={styles.customerInfo}>
                  <Ionicons name="call" size={16} color="#6B7280" />
                  <Text style={styles.customerPhone}>
                    {formatPhoneForDisplay(item.user.phone)}
                  </Text>
                </View>
              </View>

              <View style={styles.orderDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="cube" size={16} color="#6B7280" />
                  <Text style={styles.itemsCount}>
                    {item.items.length} ta mahsulot
                  </Text>
                </View>
                <Text style={styles.totalPrice}>
                  {formatPrice(item.totalPrice)}
                </Text>
              </View>

              <View style={styles.deliveryInfo}>
                <Ionicons name="location" size={14} color="#9CA3AF" />
                <Text style={styles.deliveryAddress} numberOfLines={1}>
                  {item.deliveryViloyat.name}
                  {item.deliveryTuman && `, ${item.deliveryTuman.name}`}
                  {item.deliveryMfy && `, ${item.deliveryMfy.name}`}
                </Text>
              </View>

              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  orderInfo: {
    marginBottom: 16,
    gap: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  customerPhone: {
    fontSize: 15,
    color: '#6B7280',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: -0.3,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  deliveryAddress: {
    fontSize: 13,
    color: '#9CA3AF',
    flex: 1,
  },
  arrowContainer: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
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
  refreshButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
});
