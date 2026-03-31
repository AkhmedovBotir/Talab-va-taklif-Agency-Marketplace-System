import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { WebDateInput } from './components/WebDateInput';
import { useDialog } from './contexts/DialogContext';
import { apiService, KpiTransaction } from './services/api';

type PaymentFilter = 'all' | 'paid' | 'unpaid';

export default function KPIScreen() {
  const { showAlert } = useDialog();
  const [transactions, setTransactions] = useState<KpiTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  // Filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return 'Tanlash';
    return date.toLocaleDateString('uz-UZ');
  };

  const loadTransactions = useCallback(async (pageNum = 1) => {
    try {
      const params: any = {
        page: pageNum,
        limit: 20,
      };
      
      if (startDate) {
        params.startDate = formatDate(startDate);
      }
      if (endDate) {
        params.endDate = formatDate(endDate);
      }
      if (paymentFilter !== 'all') {
        params.isPaid = paymentFilter === 'paid';
      }

      const response = await apiService.getKpiTransactions(params);

      if (response.success) {
        if (pageNum === 1) {
          setTransactions(response.data);
        } else {
          setTransactions((prev) => [...prev, ...response.data]);
        }
        setTotalPages(response.totalPages);
        setPage(response.page);
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'KPI transaksiyalarni yuklashda xatolik';
      await showAlert({
        title: 'Xatolik',
        message: msg || 'KPI transaksiyalarni yuklashda xatolik',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate, paymentFilter, showAlert]);

  useEffect(() => {
    loadTransactions(1);
  }, [loadTransactions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions(1);
  };

  const applyFilters = () => {
    setShowFilterModal(false);
    setLoading(true);
    loadTransactions(1);
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setPaymentFilter('all');
    setShowFilterModal(false);
    setLoading(true);
  };

  const hasActiveFilters = startDate !== null || endDate !== null || paymentFilter !== 'all';

  const loadMore = () => {
    if (!loading && page < totalPages) {
      loadTransactions(page + 1);
    }
  };

  const renderTransactionItem = ({ item }: { item: KpiTransaction }) => (
    <TouchableOpacity style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionHeaderLeft}>
          <Ionicons
            name={item.isPaid ? 'checkmark-circle' : 'time'}
            size={24}
            color={item.isPaid ? '#34C759' : '#FF9500'}
          />
          <View style={styles.transactionInfo}>
            <Text style={styles.orderNumber}>#{item.order.orderNumber}</Text>
            <Text style={styles.productName}>{item.orderItem.product.name}</Text>
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, item.isPaid && styles.amountPaid]}>
            {item.punktAmount.toLocaleString()} so'm
          </Text>
          <View style={[styles.statusBadge, item.isPaid ? styles.statusPaid : styles.statusUnpaid]}>
            <Text style={styles.statusText}>
              {item.isPaid ? "To'langan" : "To'lanmagan"}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="cube" size={16} color="#666" />
          <Text style={styles.detailLabel}>Miqdor:</Text>
          <Text style={styles.detailValue}>{item.orderItem.quantity} dona</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#666" />
          <Text style={styles.detailLabel}>Narx:</Text>
          <Text style={styles.detailValue}>{item.orderItem.price.toLocaleString()} so'm</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="percent" size={16} color="#666" />
          <Text style={styles.detailLabel}>KPI foizi:</Text>
          <Text style={styles.detailValue}>%{item.orderItem.kpiBonusPercent}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailLabel}>Sana:</Text>
          <Text style={styles.detailValue}>
            {new Date(item.createdAt).toLocaleDateString('uz-UZ')}
          </Text>
        </View>
        {item.bonusType !== 'regular' && (
          <View style={styles.detailRow}>
            <Ionicons
              name={item.bonusType === 'from_punkt' ? 'arrow-forward' : 'arrow-back'}
              size={16}
              color="#666"
            />
            <Text style={styles.detailLabel}>Bonus turi:</Text>
            <Text style={styles.detailValue}>
              {item.bonusType === 'from_punkt'
                ? 'Yuborilgan (from_punkt)'
                : 'Qabul qilingan (to_punkt)'}
            </Text>
          </View>
        )}
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

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtrlar</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Date Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sana oralig'i</Text>
            <View style={styles.dateRow}>
              {Platform.OS === 'web' ? (
                <>
                  <View style={styles.webDateWrap}>
                    <WebDateInput
                      value={startDate}
                      onChange={setStartDate}
                      maximumDate={endDate || undefined}
                    />
                  </View>
                  <Text style={styles.dateSeparator}>—</Text>
                  <View style={styles.webDateWrap}>
                    <WebDateInput
                      value={endDate}
                      onChange={setEndDate}
                      minimumDate={startDate || undefined}
                      maximumDate={new Date()}
                    />
                  </View>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#007AFF" />
                    <Text style={styles.dateButtonText}>
                      {formatDisplayDate(startDate)}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.dateSeparator}>—</Text>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#007AFF" />
                    <Text style={styles.dateButtonText}>
                      {formatDisplayDate(endDate)}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Payment Status */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>To'lov holati</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  paymentFilter === 'all' && styles.filterChipActive,
                ]}
                onPress={() => setPaymentFilter('all')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    paymentFilter === 'all' && styles.filterChipTextActive,
                  ]}
                >
                  Barchasi
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  paymentFilter === 'paid' && styles.filterChipActive,
                ]}
                onPress={() => setPaymentFilter('paid')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    paymentFilter === 'paid' && styles.filterChipTextActive,
                  ]}
                >
                  To'langan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  paymentFilter === 'unpaid' && styles.filterChipActive,
                ]}
                onPress={() => setPaymentFilter('unpaid')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    paymentFilter === 'unpaid' && styles.filterChipTextActive,
                  ]}
                >
                  To'lanmagan
                </Text>
              </TouchableOpacity>
            </View>
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

      {/* Date Pickers (native only; web uses WebDateInput) */}
      {Platform.OS !== 'web' && showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
          maximumDate={endDate || new Date()}
        />
      )}
      {Platform.OS !== 'web' && showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
          minimumDate={startDate || undefined}
          maximumDate={new Date()}
        />
      )}
    </Modal>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'KPI Bonus',
          headerShown: true,
          headerBackTitle: 'Orqaga',
          headerRight: () => (
            <TouchableOpacity
              style={styles.filterHeaderButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons
                name="filter"
                size={22}
                color={hasActiveFilters ? '#007AFF' : '#333'}
              />
              {hasActiveFilters && <View style={styles.filterBadge} />}
            </TouchableOpacity>
          ),
        }}
      />
      {renderFilterModal()}
      <View style={styles.container}>
        {/* Active Filters Display */}
        {hasActiveFilters && (
          <View style={styles.activeFiltersBar}>
            {startDate && (
              <View style={styles.activeFilterTag}>
                <Text style={styles.activeFilterText}>
                  Dan: {formatDisplayDate(startDate)}
                </Text>
                <TouchableOpacity onPress={() => setStartDate(null)}>
                  <Ionicons name="close-circle" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            {endDate && (
              <View style={styles.activeFilterTag}>
                <Text style={styles.activeFilterText}>
                  Gacha: {formatDisplayDate(endDate)}
                </Text>
                <TouchableOpacity onPress={() => setEndDate(null)}>
                  <Ionicons name="close-circle" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            {paymentFilter !== 'all' && (
              <View style={styles.activeFilterTag}>
                <Text style={styles.activeFilterText}>
                  {paymentFilter === 'paid' ? "To'langan" : "To'lanmagan"}
                </Text>
                <TouchableOpacity onPress={() => setPaymentFilter('all')}>
                  <Ionicons name="close-circle" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>KPI transaksiyalari topilmadi</Text>
            </View>
          }
          ListFooterComponent={
            loading && transactions.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            ) : null
          }
        />
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
              onPress={() => {
                if (page > 1) {
                  loadTransactions(page - 1);
                }
              }}
              disabled={page === 1}
            >
              <Text style={styles.pageButtonText}>Oldingi</Text>
            </TouchableOpacity>
            <Text style={styles.pageInfo}>
              {page} / {totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
              onPress={() => {
                if (page < totalPages) {
                  loadTransactions(page + 1);
                }
              }}
              disabled={page === totalPages}
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
  listContent: {
    padding: 16,
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
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
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
  filterHeaderButton: {
    padding: 8,
    marginRight: 8,
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
  activeFiltersBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingBottom: 0,
    gap: 8,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#1976D2',
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
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  webDateWrap: {
    flex: 1,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  dateSeparator: {
    fontSize: 16,
    color: '#999',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

