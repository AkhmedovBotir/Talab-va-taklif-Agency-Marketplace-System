// Finance Screen
import { Ionicons } from '@expo/vector-icons';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import { DatePickerField } from '../../components/DatePickerField';
import { apiService } from '../../services/api';
import type {
  GetPaymentTransactionsParams,
  OrderForPayment,
  OrdersForPaymentResponse,
  PaymentBalanceResponse,
  PaymentTransaction,
  PaymentTransactionType,
  PaymentTransactionsResponse,
} from '../../types/api';

type PaymentFilter = 'all' | 'income' | 'expense';
type CategoryFilter = 'all' | 'agent_paid_to_punkt' | 'agent_received_from_customer';
type TabType = 'transactions' | 'payments';

export default function FinanceScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [ordersForPayment, setOrdersForPayment] = useState<OrderForPayment[]>([]);
  const [balance, setBalance] = useState<PaymentBalanceResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [filters, setFilters] = useState<GetPaymentTransactionsParams>({
    page: 1,
    limit: 50,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  // Filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [typeFilter, setTypeFilter] = useState<PaymentFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const buildQueryParams = useCallback((): GetPaymentTransactionsParams => {
    const params: GetPaymentTransactionsParams = {
      ...filters,
    };
    if (startDate) {
      params.startDate = startDate.toISOString();
    }
    if (endDate) {
      params.endDate = endDate.toISOString();
    }
    if (typeFilter === 'income') {
      params.type = 'income';
    } else if (typeFilter === 'expense') {
      params.type = 'expense';
    }
    if (categoryFilter !== 'all') {
      params.category = categoryFilter;
    }
    return params;
  }, [filters, startDate, endDate, typeFilter, categoryFilter]);

  const loadTransactions = useCallback(async (params?: GetPaymentTransactionsParams) => {
    try {
      const queryParams: GetPaymentTransactionsParams = {
        ...buildQueryParams(),
        ...params,
      };

      const response = await apiService.getPaymentTransactions(queryParams);
      if (response.success) {
        setTransactions(response.data);
        setTotalPages(response.totalPages);
        setCurrentPage(response.page);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'Tranzaksiyalarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildQueryParams]);

  const loadBalance = useCallback(async () => {
    try {
      const response = await apiService.getPaymentBalance();
      if (response.success) {
        setBalance(response.data);
      }
    } catch (error: any) {
      console.error('Balance load error:', error);
    }
  }, []);

  const loadOrdersForPayment = useCallback(async () => {
    try {
      setLoadingPayments(true);
      const response = await apiService.getOrdersForPayment();
      if (response.success) {
        setOrdersForPayment(response.data);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'To\'lov qilish kerak bo\'lgan buyurtmalarni yuklashda xatolik');
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  const handlePayToPunkt = async (orderId: string) => {
    const order = ordersForPayment.find(o => o._id === orderId);
    if (!order) return;

    Alert.alert(
      'Punktga to\'lov qilish',
      `Haqiqatan ham punktga ${(order.totalPrice || 0).toLocaleString()} so'm to'lov qilmoqchimisiz?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'To\'lov qilish',
          style: 'default',
          onPress: async () => {
            setPayingOrderId(orderId);
            try {
              const response = await apiService.payToPunkt(orderId);
              if (response.success) {
                Alert.alert('Muvaffaqiyatli', response.message || 'To\'lov muvaffaqiyatli amalga oshirildi');
                loadOrdersForPayment();
                loadBalance();
              }
            } catch (error: any) {
              const errorMessage = error.response?.data?.message || 'To\'lov qilishda xatolik';
              Alert.alert('Xatolik', errorMessage);
            } finally {
              setPayingOrderId(null);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadTransactions();
    loadBalance();
    if (activeTab === 'payments') {
      loadOrdersForPayment();
    }
  }, [loadTransactions, loadBalance, activeTab, loadOrdersForPayment]);

  const onRefresh = () => {
    setRefreshing(true);
    setLoading(true);
    if (activeTab === 'transactions') {
      loadTransactions({ page: 1 });
    } else {
      loadOrdersForPayment();
    }
    loadBalance();
  };

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const applyFilters = () => {
    setShowFilterModal(false);
    setLoading(true);
    loadTransactions({ page: 1 });
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setTypeFilter('all');
    setCategoryFilter('all');
    setShowFilterModal(false);
    setFilters({ ...filters, page: 1 });
  };

  const hasActiveFilters = startDate || endDate || typeFilter !== 'all' || categoryFilter !== 'all';

  const getTransactionIcon = (type: PaymentTransactionType) => {
    return type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle';
  };

  const getTransactionColor = (type: PaymentTransactionType) => {
    return type === 'income' ? '#34C759' : '#FF3B30';
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'agent_paid_to_punkt':
        return 'Punktga to\'lov';
      case 'agent_received_from_customer':
        return 'Mijozdan to\'lov';
      default:
        return category;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTransactionItem = ({ item }: { item: PaymentTransaction }) => (
    <TouchableOpacity style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getTransactionColor(item.type) + '20' }]}>
          <Ionicons
            name={getTransactionIcon(item.type)}
            size={24}
            color={getTransactionColor(item.type)}
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionCategory}>{getCategoryText(item.category)}</Text>
          {item.order && (
            <Text style={styles.orderNumber}>#{item.order.orderNumber}</Text>
          )}
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: getTransactionColor(item.type) }]}>
            {item.type === 'income' ? '+' : '-'}{(item.amount || 0).toLocaleString()} so'm
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#34C759' : '#FF9500' }]}>
            <Text style={styles.statusText}>
              {item.status === 'completed' ? 'To\'langan' : item.status}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.transactionFooter}>
        <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
        {item.completedAt && (
          <Text style={styles.completedDate}>
            Tugatilgan: {formatDate(item.completedAt)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Ma'lumotlar yuklanmoqda...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Balance Cards */}
        {balance && (
          <View style={styles.balanceContainer}>
            <View style={[styles.balanceCard, styles.incomeCard]}>
              <View style={styles.balanceHeader}>
                <Ionicons name="arrow-down-circle" size={24} color="#34C759" />
                <Text style={styles.balanceLabel}>Kirim</Text>
              </View>
              <Text style={[styles.balanceAmount, { color: '#34C759' }]}>
                {(balance.totalIncome || 0).toLocaleString()} so'm
              </Text>
            </View>
            <View style={[styles.balanceCard, styles.expenseCard]}>
              <View style={styles.balanceHeader}>
                <Ionicons name="arrow-up-circle" size={24} color="#FF3B30" />
                <Text style={styles.balanceLabel}>Chiqim</Text>
              </View>
              <Text style={[styles.balanceAmount, { color: '#FF3B30' }]}>
                {(balance.totalExpense || 0).toLocaleString()} so'm
              </Text>
            </View>
          </View>
        )}

        {/* Balance Summary */}
        {balance && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Jami balans</Text>
            <Text style={[styles.summaryAmount, { color: balance.balance >= 0 ? '#34C759' : '#FF3B30' }]}>
              {(balance.balance || 0).toLocaleString()} so'm
            </Text>
            {balance.qarz > 0 && (
              <View style={styles.debtContainer}>
                <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.debtText}>Qarz: {(balance.qarz || 0).toLocaleString()} so'm</Text>
              </View>
            )}
            {balance.haq > 0 && (
              <View style={styles.creditContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.creditText}>Haq: {(balance.haq || 0).toLocaleString()} so'm</Text>
              </View>
            )}
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
            onPress={() => setActiveTab('transactions')}
          >
            <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
              Tranzaksiyalar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
            onPress={() => setActiveTab('payments')}
          >
            <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
              To'lov qilish
            </Text>
            {ordersForPayment.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{ordersForPayment.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Filter Button - Only for transactions */}
        {activeTab === 'transactions' && (
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="filter" size={20} color={hasActiveFilters ? '#007AFF' : '#666'} />
              <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>
                Filtr
              </Text>
              {hasActiveFilters && <View style={styles.filterBadge} />}
            </TouchableOpacity>
          </View>
        )}

        {/* Transactions List */}
        {activeTab === 'transactions' && (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Tranzaksiyalar topilmadi</Text>
            </View>
          }
        />
        )}

        {/* Orders For Payment List */}
        {activeTab === 'payments' && (
          <>
            {loadingPayments ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Yuklanmoqda...</Text>
              </View>
            ) : (
              <FlatList
                data={ordersForPayment}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.paymentOrderCard}
                    onPress={() => router.push(`/order/${item._id}`)}
                  >
                    <View style={styles.paymentOrderHeader}>
                      <View style={styles.paymentOrderInfo}>
                        <Text style={styles.paymentOrderNumber}>#{item.orderNumber}</Text>
                        <Text style={styles.paymentOrderCustomer}>
                          {item.user?.name || 'Mijoz'} • {item.user?.phone || item.deliveryViloyat?.name}
                        </Text>
                        <Text style={styles.paymentOrderLocation}>
                          {item.deliveryViloyat?.name}
                          {item.deliveryTuman && `, ${item.deliveryTuman.name}`}
                        </Text>
                      </View>
                      <View style={styles.paymentOrderAmount}>
                        <Text style={styles.paymentOrderAmountText}>
                          {(item.totalPrice || 0).toLocaleString()} so'm
                        </Text>
                      </View>
                    </View>
                    {item.assignedByPunkt && (
                      <View style={styles.paymentOrderPunkt}>
                        <Ionicons name="storefront" size={16} color="#666" />
                        <Text style={styles.paymentOrderPunktText}>
                          {typeof item.assignedByPunkt === 'object' ? item.assignedByPunkt.name : 'Punkt'}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[styles.payButton, payingOrderId === item._id && styles.payButtonDisabled]}
                      onPress={() => handlePayToPunkt(item._id)}
                      disabled={payingOrderId === item._id}
                    >
                      {payingOrderId === item._id ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="wallet" size={18} color="#fff" />
                          <Text style={styles.payButtonText}>To'lov qilish</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>To'lov qilish kerak bo'lgan buyurtmalar yo'q</Text>
                  </View>
                }
              />
            )}
          </>
        )}

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filtrlar</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Tranzaksiya turi</Text>
                <View style={styles.filterOptions}>
                  {(['all', 'income', 'expense'] as PaymentFilter[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterOption,
                        typeFilter === type && styles.filterOptionActive,
                      ]}
                      onPress={() => setTypeFilter(type)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          typeFilter === type && styles.filterOptionTextActive,
                        ]}
                      >
                        {type === 'all' ? 'Barchasi' : type === 'income' ? 'Kirim' : 'Chiqim'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Kategoriya</Text>
                <View style={styles.filterOptions}>
                  {(['all', 'agent_paid_to_punkt', 'agent_received_from_customer'] as CategoryFilter[]).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterOption,
                        categoryFilter === category && styles.filterOptionActive,
                      ]}
                      onPress={() => setCategoryFilter(category)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          categoryFilter === category && styles.filterOptionTextActive,
                        ]}
                      >
                        {category === 'all' ? 'Barchasi' : getCategoryText(category)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date Filters */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sana oralig'i</Text>
                <View style={styles.datePickerContainer}>
                  {Platform.OS === 'web' ? (
                    <>
                      <DatePickerField
                        value={startDate}
                        onChange={handleStartDateChange}
                        visible
                      />
                      <DatePickerField
                        value={endDate}
                        onChange={handleEndDateChange}
                        visible
                      />
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowStartPicker(true)}
                      >
                        <Ionicons name="calendar" size={20} color="#007AFF" />
                        <Text style={styles.dateButtonText}>
                          {startDate
                            ? startDate.toLocaleDateString('uz-UZ')
                            : 'Boshlanish sanasi'}
                        </Text>
                      </TouchableOpacity>
                      <DatePickerField
                        value={startDate}
                        onChange={handleStartDateChange}
                        visible={showStartPicker}
                      />
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowEndPicker(true)}
                      >
                        <Ionicons name="calendar" size={20} color="#007AFF" />
                        <Text style={styles.dateButtonText}>
                          {endDate ? endDate.toLocaleDateString('uz-UZ') : 'Tugash sanasi'}
                        </Text>
                      </TouchableOpacity>
                      <DatePickerField
                        value={endDate}
                        onChange={handleEndDateChange}
                        visible={showEndPicker}
                      />
                    </>
                  )}
                </View>
              </View>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.clearButton]}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearButtonText}>Tozalash</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.applyButton]}
                  onPress={applyFilters}
                >
                  <Text style={styles.applyButtonText}>Qo'llash</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  balanceContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  debtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  debtText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
  creditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  creditText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#007AFF',
  },
  filterBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginLeft: 'auto',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  tabActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  paymentOrderCard: {
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
  paymentOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentOrderInfo: {
    flex: 1,
  },
  paymentOrderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  paymentOrderCustomer: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  paymentOrderLocation: {
    fontSize: 12,
    color: '#666',
  },
  paymentOrderAmount: {
    alignItems: 'flex-end',
  },
  paymentOrderAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentOrderPunkt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paymentOrderPunktText: {
    fontSize: 14,
    color: '#666',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  transactionCard: {
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
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 12,
    color: '#666',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  transactionFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  completedDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  filterOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  datePickerContainer: {
    gap: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
