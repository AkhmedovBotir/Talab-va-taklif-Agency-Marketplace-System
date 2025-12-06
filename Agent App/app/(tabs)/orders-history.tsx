// Orders History Screen
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiService } from '../../services/api';
import type { GetOrdersHistoryParams, Order } from '../../types/api';

export default function OrdersHistoryScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  const formatDateForApi = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const loadOrders = useCallback(async (page: number = 1) => {
    try {
      const params: GetOrdersHistoryParams = {
        page,
        limit: 20,
      };
      
      if (startDate) {
        params.startDate = formatDateForApi(startDate);
      }
      if (endDate) {
        params.endDate = formatDateForApi(endDate);
      }
      
      const response = await apiService.getOrdersHistory(params);
      if (response.success) {
        setOrders(response.data);
        setTotalPages(response.totalPages);
        setCurrentPage(response.page);
        setTotal(response.total);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'Buyurtmalarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders(1);
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/order/${orderId}`);
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'processing':
        return '#007AFF';
      case 'shipped':
        return '#5856D6';
      case 'delivered':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      case 'confirmed_by_punkt':
        return '#34C759';
      case 'requested_to_contragent':
        return '#FF9500';
      case 'accepted_by_contragent':
        return '#007AFF';
      case 'delivered_to_punkt':
        return '#5856D6';
      case 'assigned_to_agent':
        return '#007AFF';
      case 'confirmed_by_agent':
        return '#34C759';
      case 'confirmed_by_customer':
        return '#34C759';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Kutilmoqda',
      processing: 'Jarayonda',
      shipped: 'Yuborilgan',
      delivered: 'Yetkazilgan',
      cancelled: 'Bekor qilingan',
      confirmed_by_punkt: 'Punkt tomonidan tasdiqlangan',
      requested_to_contragent: 'Kontragentga so\'rov yuborilgan',
      accepted_by_contragent: 'Kontragent tomonidan qabul qilingan',
      delivered_to_punkt: 'Punktga yetkazilgan',
      assigned_to_agent: 'Agentga tayinlangan',
      confirmed_by_agent: 'Agent tomonidan tasdiqlangan',
      confirmed_by_customer: 'Mijoz tomonidan tasdiqlangan',
    };
    return statusMap[status] || status;
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleOrderPress(item._id)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <Text style={styles.customerName}>{item.user.name}</Text>
          <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('uz-UZ')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.deliveryViloyat.name}
            {item.deliveryTuman && `, ${item.deliveryTuman.name}`}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cash" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.totalPrice.toLocaleString()} so'm
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#007AFF" />
            <Text style={styles.dateButtonText}>
              {startDate ? formatDateForDisplay(startDate) : 'Dan'}
            </Text>
          </TouchableOpacity>

          <Ionicons name="arrow-forward" size={18} color="#999" />

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#007AFF" />
            <Text style={styles.dateButtonText}>
              {endDate ? formatDateForDisplay(endDate) : 'Gacha'}
            </Text>
          </TouchableOpacity>

          {(startDate || endDate) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Ionicons name="close-circle" size={22} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.totalText}>Jami: {total} ta buyurtma</Text>
      </View>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
          maximumDate={endDate || new Date()}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndDateChange}
          minimumDate={startDate || undefined}
          maximumDate={new Date()}
        />
      )}

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Buyurtmalar tarixi topilmadi</Text>
          </View>
        }
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
            onPress={() => {
              if (currentPage > 1) {
                loadOrders(currentPage - 1);
              }
            }}
            disabled={currentPage === 1}
          >
            <Ionicons name="chevron-back" size={18} color="#fff" />
            <Text style={styles.pageButtonText}>Oldingi</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>
            {currentPage} / {totalPages}
          </Text>
          <TouchableOpacity
            style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
            onPress={() => {
              if (currentPage < totalPages) {
                loadOrders(currentPage + 1);
              }
            }}
            disabled={currentPage === totalPages}
          >
            <Text style={styles.pageButtonText}>Keyingi</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  totalText: {
    fontSize: 13,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: 120,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  orderInfo: {
    gap: 8,
    marginTop: 8,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  pageButtonDisabled: {
    backgroundColor: '#ccc',
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});








