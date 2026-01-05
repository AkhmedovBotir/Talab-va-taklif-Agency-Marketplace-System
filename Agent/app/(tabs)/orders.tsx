// Orders List Screen
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
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type { GetOrdersParams, KPISummaryResponse, Order, OrderStatus, PaymentStatus, PaymentMethod } from '../../types/api';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<GetOrdersParams>({
    page: 1,
    limit: 20,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [kpiBalance, setKpiBalance] = useState<KPISummaryResponse['data'] | null>(null);
  const [loadingKPI, setLoadingKPI] = useState(true);
  const router = useRouter();
  const { role } = useAuth();

  const loadOrders = useCallback(async (params?: GetOrdersParams) => {
    try {
      const queryParams: GetOrdersParams = {
        ...filters,
        ...params,
        search: searchQuery || undefined,
        page: params?.page || filters.page || 1,
        limit: params?.limit || filters.limit || 20,
      };
      
      const response = await apiService.getOrders(queryParams);
      if (response.success) {
        setOrders(response.data || []);
        setTotalPages(response.totalPages || 1);
        setCurrentPage(response.page || 1);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'Buyurtmalarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    loadOrders();
    loadKPIBalance();
  }, [loadOrders]);

  const loadKPIBalance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiService.getKPISummary({ date: today });
      if (response.success) {
        setKpiBalance(response.data);
        console.log('KPI balance:', response);
      }
    } catch (error: any) {
      // Silently fail - KPI is optional
      console.log('KPI balance load error:', error);
    } finally {
      setLoadingKPI(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setLoadingKPI(true);
    loadOrders({ page: 1 });
    loadKPIBalance();
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setCurrentPage(1);
  };

  const handleSearchSubmit = () => {
    loadOrders({ page: 1, search: searchQuery || undefined });
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/order/${orderId}`);
  };

  const handleConfirmOrder = async (orderId: string) => {
    if (role !== 'mfy') {
      return;
    }

    Alert.alert(
      'Buyurtmani tasdiqlash',
      'Haqiqatan ham bu buyurtmani foydalanuvchiga yetkazganingizni tasdiqlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Tasdiqlash',
          onPress: async () => {
            try {
              const response = await apiService.confirmOrder(orderId);
              if (response.success) {
                Alert.alert('Muvaffaqiyatli', response.message || 'Buyurtma muvaffaqiyatli tasdiqlandi');
                loadOrders({ page: currentPage });
              }
            } catch (error: any) {
              Alert.alert('Xatolik', error.response?.data?.message || 'Buyurtmani tasdiqlashda xatolik');
            }
          },
        },
      ]
    );
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
        <View>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <Text style={styles.customerName}>{item.user.name}</Text>
          <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
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
        {item.assignedToAgent && (
          <View style={styles.infoRow}>
            <Ionicons name="person" size={16} color="#666" />
            <Text style={styles.infoText}>
              Agent: {item.assignedToAgent.name}
            </Text>
          </View>
        )}
      </View>

      {item.agentConfirmedAt && (
        <View style={styles.confirmedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#34C759" />
          <Text style={styles.confirmedText}>
            Agent tasdiqladi: {new Date(item.agentConfirmedAt).toLocaleDateString('uz-UZ')}
          </Text>
        </View>
      )}
      {item.customerConfirmed && (
        <View style={[styles.confirmedBadge, styles.customerConfirmedBadge]}>
          <Ionicons name="checkmark-done-circle" size={16} color="#34C759" />
          <Text style={styles.confirmedText}>
            Mijoz tasdiqladi: {item.customerConfirmedAt ? new Date(item.customerConfirmedAt).toLocaleDateString('uz-UZ') : ''}
          </Text>
        </View>
      )}
      
      {/* MFY Agent uchun tasdiqlash tugmasi */}
      {role === 'mfy' && item.status === 'assigned_to_agent' && !item.agentConfirmedAt && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => handleConfirmOrder(item._id)}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.confirmButtonText}>Tasdiqlash</Text>
        </TouchableOpacity>
      )}
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Buyurtmalar</Text>
        </View>
      {!loadingKPI && kpiBalance && (
        <TouchableOpacity 
          style={styles.kpiBalanceCard}
          onPress={() => router.push('/kpi')}
        >
          <View style={styles.kpiBalanceHeader}>
            <Ionicons name="wallet" size={20} color="#007AFF" />
            <Text style={styles.kpiBalanceTitle}>Kunlik KPI balansi</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" style={styles.kpiBalanceArrow} />
          </View>
          <View style={styles.kpiBalanceRow}>
            <View style={styles.kpiBalanceItem}>
              <Text style={styles.kpiBalanceLabel}>Jami</Text>
              <Text style={styles.kpiBalanceValue}>
                {kpiBalance.summary.totalAmount.toLocaleString()} so'm
              </Text>
            </View>
            <View style={styles.kpiBalanceDivider} />
            <View style={styles.kpiBalanceItem}>
              <Text style={styles.kpiBalanceLabel}>To'langan</Text>
              <Text style={[styles.kpiBalanceValue, styles.kpiBalancePaid]}>
                {kpiBalance.summary.paidAmount.toLocaleString()} so'm
              </Text>
            </View>
            <View style={styles.kpiBalanceDivider} />
            <View style={styles.kpiBalanceItem}>
              <Text style={styles.kpiBalanceLabel}>To'lanmagan</Text>
              <Text style={[styles.kpiBalanceValue, styles.kpiBalanceUnpaid]}>
                {kpiBalance.summary.unpaidAmount.toLocaleString()} so'm
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buyurtma raqami yoki telefon raqami bo'yicha qidirish..."
          value={searchQuery}
          onChangeText={handleSearch}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            loadOrders({ page: 1 });
          }}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

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
            <Text style={styles.emptyText}>Buyurtmalar topilmadi</Text>
          </View>
        }
      />

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
            onPress={() => {
              if (currentPage > 1) {
                loadOrders({ page: currentPage - 1 });
              }
            }}
            disabled={currentPage === 1}
          >
            <Text style={styles.pageButtonText}>Oldingi</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>
            {currentPage} / {totalPages}
          </Text>
          <TouchableOpacity
            style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
            onPress={() => {
              if (currentPage < totalPages) {
                loadOrders({ page: currentPage + 1 });
              }
            }}
            disabled={currentPage === totalPages}
          >
            <Text style={styles.pageButtonText}>Keyingi</Text>
          </TouchableOpacity>
        </View>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 12,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  confirmedText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  customerConfirmedBadge: {
    backgroundColor: '#E8F5E9',
    marginTop: 4,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  pageButtonDisabled: {
    backgroundColor: '#ccc',
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
  },
  kpiBalanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  kpiBalanceArrow: {
    marginLeft: 'auto',
  },
  kpiBalanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  kpiBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiBalanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiBalanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  kpiBalanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  kpiBalancePaid: {
    color: '#34C759',
  },
  kpiBalanceUnpaid: {
    color: '#FF9500',
  },
  kpiBalanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#eee',
    marginHorizontal: 8,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

