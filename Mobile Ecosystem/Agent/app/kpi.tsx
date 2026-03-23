// KPI Transactions Screen
import { Ionicons } from '@expo/vector-icons';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
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
} from 'react-native';
import { DatePickerField } from '../components/DatePickerField';
import { apiService } from '../services/api';
import type { GetKPIParams, KPISummaryResponse, KPITransaction } from '../types/api';

type PaymentFilter = 'all' | 'paid' | 'unpaid';

export default function KPIScreen() {
  const [transactions, setTransactions] = useState<KPITransaction[]>([]);
  const [summary, setSummary] = useState<KPISummaryResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<GetKPIParams>({
    page: 1,
    limit: 20,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  // Filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const buildQueryParams = useCallback((): GetKPIParams => {
    const params: GetKPIParams = {
      ...filters,
    };
    if (startDate) {
      params.startDate = startDate.toISOString();
    }
    if (endDate) {
      params.endDate = endDate.toISOString();
    }
    if (paymentFilter === 'paid') {
      params.isPaid = true;
    } else if (paymentFilter === 'unpaid') {
      params.isPaid = false;
    }
    return params;
  }, [filters, startDate, endDate, paymentFilter]);

  const loadTransactions = useCallback(async (params?: GetKPIParams) => {
    try {
      const queryParams: GetKPIParams = {
        ...buildQueryParams(),
        ...params,
      };
      
      const response = await apiService.getKPITransactions(queryParams);
      if (response.success) {
        setTransactions(response.data);
        setTotalPages(response.totalPages);
        setCurrentPage(response.page);
      }
    } catch (error: any) {
      Alert.alert('Xatolik', error.response?.data?.message || 'KPI transaksiyalarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildQueryParams]);

  const loadSummary = useCallback(async () => {
    try {
      const params: GetKPIParams = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();
      if (paymentFilter === 'paid') params.isPaid = true;
      else if (paymentFilter === 'unpaid') params.isPaid = false;

      const response = await apiService.getKPISummary(params);
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.log('Summary error:', error);
    }
  }, [startDate, endDate, paymentFilter]);

  useEffect(() => {
    loadTransactions();
    loadSummary();
  }, [loadTransactions, loadSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions({ page: 1 });
    loadSummary();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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
    loadSummary();
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setPaymentFilter('all');
    setShowFilterModal(false);
    setFilters({ ...filters, page: 1 });
  };

  const hasActiveFilters = startDate || endDate || paymentFilter !== 'all';

  const renderTransactionItem = ({ item }: { item: KPITransaction }) => (
    <TouchableOpacity style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionHeaderLeft}>
          <Ionicons 
            name={item.isPaid ? "checkmark-circle" : "time"} 
            size={24} 
            color={item.isPaid ? "#34C759" : "#FF9500"} 
          />
          <View style={styles.transactionInfo}>
            <Text style={styles.orderNumber}>#{item.order.orderNumber}</Text>
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, item.isPaid && styles.amountPaid]}>
            {(item.amount || 0).toLocaleString()} so'm
          </Text>
          <View style={[styles.statusBadge, item.isPaid ? styles.statusPaid : styles.statusUnpaid]}>
            <Text style={styles.statusText}>
              {item.isPaid ? 'To\'langan' : 'To\'lanmagan'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailLabel}>Sana:</Text>
          <Text style={styles.detailValue}>
            {new Date(item.createdAt).toLocaleDateString('uz-UZ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && transactions.length === 0) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'KPI Bonus',
            headerShown: true,
            headerBackTitle: 'Orqaga',
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'KPI Bonus',
          headerShown: true,
          headerBackTitle: 'Orqaga',
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowFilterModal(true)} style={styles.headerButton}>
              <Ionicons 
                name="filter" 
                size={24} 
                color={hasActiveFilters ? "#007AFF" : "#333"} 
              />
              {hasActiveFilters && <View style={styles.filterBadge} />}
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {/* Summary Card */}
        {summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Umumiy ma'lumot</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Jami</Text>
                <Text style={styles.summaryValue}>{(summary.totalAmount || 0).toLocaleString()} so'm</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>To'langan</Text>
                <Text style={[styles.summaryValue, { color: '#34C759' }]}>{(summary.paidAmount || 0).toLocaleString()} so'm</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>To'lanmagan</Text>
                <Text style={[styles.summaryValue, { color: '#FF9500' }]}>{(summary.unpaidAmount || 0).toLocaleString()} so'm</Text>
              </View>
            </View>
            {hasActiveFilters && (
              <View style={styles.activeFiltersRow}>
                <Ionicons name="funnel" size={14} color="#666" />
                <Text style={styles.activeFiltersText}>
                  {startDate && `${formatDate(startDate)}`}
                  {startDate && endDate && ' - '}
                  {endDate && `${formatDate(endDate)}`}
                  {paymentFilter !== 'all' && ` | ${paymentFilter === 'paid' ? "To'langan" : "To'lanmagan"}`}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filterlar</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {/* Date Filters */}
              <Text style={styles.filterLabel}>Boshlanish sanasi</Text>
              {Platform.OS === 'web' ? (
                <DatePickerField
                  value={startDate}
                  onChange={handleStartDateChange}
                  visible
                  maximumDate={endDate || new Date()}
                />
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.dateButton} 
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Ionicons name="calendar" size={20} color="#666" />
                    <Text style={styles.dateButtonText}>
                      {startDate ? formatDate(startDate) : 'Tanlang'}
                    </Text>
                    {startDate && (
                      <TouchableOpacity onPress={() => setStartDate(null)}>
                        <Ionicons name="close-circle" size={20} color="#999" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                  <DatePickerField
                    value={startDate}
                    onChange={handleStartDateChange}
                    visible={showStartPicker}
                    maximumDate={endDate || new Date()}
                  />
                </>
              )}

              <Text style={styles.filterLabel}>Tugash sanasi</Text>
              {Platform.OS === 'web' ? (
                <DatePickerField
                  value={endDate}
                  onChange={handleEndDateChange}
                  visible
                  minimumDate={startDate || undefined}
                  maximumDate={new Date()}
                />
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.dateButton} 
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Ionicons name="calendar" size={20} color="#666" />
                    <Text style={styles.dateButtonText}>
                      {endDate ? formatDate(endDate) : 'Tanlang'}
                    </Text>
                    {endDate && (
                      <TouchableOpacity onPress={() => setEndDate(null)}>
                        <Ionicons name="close-circle" size={20} color="#999" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                  <DatePickerField
                    value={endDate}
                    onChange={handleEndDateChange}
                    visible={showEndPicker}
                    minimumDate={startDate || undefined}
                    maximumDate={new Date()}
                  />
                </>
              )}

              {/* Payment Status Filter */}
              <Text style={styles.filterLabel}>To'lov holati</Text>
              <View style={styles.paymentFilterRow}>
                <TouchableOpacity
                  style={[styles.paymentFilterButton, paymentFilter === 'all' && styles.paymentFilterActive]}
                  onPress={() => setPaymentFilter('all')}
                >
                  <Text style={[styles.paymentFilterText, paymentFilter === 'all' && styles.paymentFilterTextActive]}>Barchasi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.paymentFilterButton, paymentFilter === 'paid' && styles.paymentFilterActive]}
                  onPress={() => setPaymentFilter('paid')}
                >
                  <Text style={[styles.paymentFilterText, paymentFilter === 'paid' && styles.paymentFilterTextActive]}>To'langan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.paymentFilterButton, paymentFilter === 'unpaid' && styles.paymentFilterActive]}
                  onPress={() => setPaymentFilter('unpaid')}
                >
                  <Text style={[styles.paymentFilterText, paymentFilter === 'unpaid' && styles.paymentFilterTextActive]}>To'lanmagan</Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                  <Text style={styles.clearButtonText}>Tozalash</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                  <Text style={styles.applyButtonText}>Qo'llash</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Date Pickers (native only) */}
        <DatePickerField
          value={startDate}
          onChange={handleStartDateChange}
          visible={showStartPicker}
          maximumDate={endDate || new Date()}
        />
        <DatePickerField
          value={endDate}
          onChange={handleEndDateChange}
          visible={showEndPicker}
          minimumDate={startDate || undefined}
          maximumDate={new Date()}
        />

        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>KPI transaksiyalari topilmadi</Text>
            </View>
          }
        />

        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
              onPress={() => {
                if (currentPage > 1) {
                  loadTransactions({ page: currentPage - 1 });
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
                  loadTransactions({ page: currentPage + 1 });
                }
              }}
              disabled={currentPage === totalPages}
            >
              <Text style={styles.pageButtonText}>Keyingi</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
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
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 6,
  },
  activeFiltersText: {
    fontSize: 12,
    color: '#666',
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
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  paymentFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentFilterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  paymentFilterActive: {
    backgroundColor: '#007AFF',
  },
  paymentFilterText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  paymentFilterTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    color: '#666',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: 4,
  },
  amountPaid: {
    color: '#34C759',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPaid: {
    backgroundColor: '#E8F5E9',
  },
  statusUnpaid: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
  },
  transactionDetails: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    minWidth: 80,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
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
});

