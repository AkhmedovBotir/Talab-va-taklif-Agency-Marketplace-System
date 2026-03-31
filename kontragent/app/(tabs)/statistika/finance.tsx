import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useState } from 'react';
import { DatePickerWeb } from '../../../components/DatePickerWeb';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { apiService, FinanceTransaction, FinanceTransactionsSummary, ZakladInfoData } from '../../../services/api';
import { formatNumberDisplay } from '../../../utils/formatNumber';

type TransactionType = 'all' | 'income' | 'expense';

export default function FinanceScreen() {
  const insets = useSafeAreaInsets();
  const [activeType, setActiveType] = useState<TransactionType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [summary, setSummary] = useState<FinanceTransactionsSummary | null>(null);
  const [zakladInfo, setZakladInfo] = useState<ZakladInfoData | null>(null);
  const [loadingZaklad, setLoadingZaklad] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Date filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatCurrency = (num: number): string => {
    return formatNumberDisplay(num) + ' so\'m';
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateForApi = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date: Date | null): string => {
    if (!date) return 'Tanlang';
    return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getCategoryLabel = (category: string): string => {
    const labels: { [key: string]: string } = {
      contragent_received_zaklad: 'Zaklad',
      contragent_received_final_payment: 'Qolgan asl narx',
      contragent_received_profit: 'Sof foyda',
      contragent_received_full_payment: 'To\'liq to\'lov',
    };
    return labels[category] || category;
  };

  const fetchTransactions = async (isRefresh = false, isLoadMore = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const currentPage = isRefresh ? 1 : page;
      const params: {
        type?: 'income' | 'expense';
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
      } = {
        page: currentPage,
        limit: 20,
      };

      if (activeType !== 'all') {
        params.type = activeType;
      }
      if (startDate) {
        params.startDate = formatDateForApi(startDate);
      }
      if (endDate) {
        params.endDate = formatDateForApi(endDate);
      }

      const response = await apiService.getFinanceTransactions(params);

      if (isRefresh || currentPage === 1) {
        setTransactions(response.data);
      } else {
        setTransactions((prev) => [...prev, ...response.data]);
      }

      setSummary(response.summary);
      setHasMore(response.data.length === params.limit && currentPage < response.totalPages);
      if (!isLoadMore) {
        setPage(currentPage);
      }
    } catch (err: any) {
      setError(err.message || 'Tranzaksiyalarni yuklashda xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const fetchZakladInfo = async () => {
    try {
      setLoadingZaklad(true);
      const response = await apiService.getZakladInfo();
      setZakladInfo(response.data);
    } catch (err: any) {
      // Silent fail for zaklad info
    } finally {
      setLoadingZaklad(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
      fetchZakladInfo();
    }, [activeType, startDate, endDate])
  );

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setPage((prev) => {
        fetchTransactions(false, true);
        return prev + 1;
      });
    }
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const renderTransaction = ({ item }: { item: FinanceTransaction }) => {
    const isIncome = item.type === 'income';
    const fromUserName = item.fromUser?.userId && typeof item.fromUser.userId === 'object'
      ? item.fromUser.userId.name
      : 'Noma\'lum';

    return (
      <TouchableOpacity style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={[styles.typeIndicator, isIncome ? styles.incomeIndicator : styles.expenseIndicator]}>
            <Ionicons
              name={isIncome ? 'arrow-down' : 'arrow-up'}
              size={16}
              color={isIncome ? '#34C759' : '#FF3B30'}
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionCategory}>{getCategoryLabel(item.category)}</Text>
            <Text style={styles.transactionDescription}>{item.description}</Text>
            {item.order && (
              <Text style={styles.transactionOrder}>Buyurtma: {item.order.orderNumber}</Text>
            )}
            {fromUserName !== 'Noma\'lum' && (
              <Text style={styles.transactionFrom}>Dan: {fromUserName}</Text>
            )}
          </View>
          <View style={styles.transactionAmount}>
            <Text style={[styles.amountText, isIncome ? styles.incomeAmount : styles.expenseAmount]}>
              {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>
            <Text style={styles.transactionDate}>{formatDateTime(item.completedAt || item.createdAt)}</Text>
          </View>
        </View>
        {item.zakladPercentage && (
          <View style={styles.zakladInfo}>
            <Text style={styles.zakladText}>Zaklad: {item.zakladPercentage}%</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="wallet-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Tranzaksiyalar topilmadi</Text>
      </View>
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

  if (loading && transactions.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Balance Summary */}
      {summary && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="arrow-down-circle" size={24} color="#34C759" />
                <Text style={styles.summaryLabel}>Kirim</Text>
                <Text style={[styles.summaryValue, styles.incomeAmount]}>
                  {formatCurrency(summary.totalIncome)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Ionicons name="arrow-up-circle" size={24} color="#FF3B30" />
                <Text style={styles.summaryLabel}>Chiqim</Text>
                <Text style={[styles.summaryValue, styles.expenseAmount]}>
                  {formatCurrency(summary.totalExpense)}
                </Text>
              </View>
            </View>
            <View style={[styles.summaryRow, { marginTop: 12 }]}>
              <View style={styles.summaryItem}>
                <Ionicons name="wallet" size={24} color="#007AFF" />
                <Text style={styles.summaryLabel}>Balans</Text>
                <Text style={[styles.summaryValue, { color: '#007AFF' }]}>
                  {formatCurrency(summary.balance)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Ionicons 
                  name={summary.qarz > 0 ? "trending-down" : "trending-up"} 
                  size={24} 
                  color={summary.qarz > 0 ? "#FF3B30" : "#34C759"} 
                />
                <Text style={styles.summaryLabel}>
                  {summary.qarz > 0 ? 'Qarz' : 'Haq'}
                </Text>
                <Text style={[
                  styles.summaryValue, 
                  { color: summary.qarz > 0 ? '#FF3B30' : '#34C759' }
                ]}>
                  {formatCurrency(summary.qarz > 0 ? summary.qarz : summary.haq)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Zaklad Info Section */}
      {zakladInfo && (
        <View style={styles.zakladSection}>
          <View style={styles.zakladCard}>
            <View style={styles.zakladHeader}>
              <Ionicons name="cash-outline" size={24} color="#FF9500" />
              <Text style={styles.zakladSectionTitle}>Zaklad ma'lumotlari</Text>
            </View>
            <View style={styles.zakladStats}>
              <View style={styles.zakladStatItem}>
                <Text style={styles.zakladStatLabel}>Olingan zaklad</Text>
                <Text style={[styles.zakladStatValue, styles.incomeAmount]}>
                  {formatCurrency(zakladInfo.zakladTotal)}
                </Text>
              </View>
              <View style={styles.zakladStatDivider} />
              <View style={styles.zakladStatItem}>
                <Text style={styles.zakladStatLabel}>Kutilayotgan</Text>
                <Text style={[styles.zakladStatValue, { color: '#FF9500' }]}>
                  {formatCurrency(zakladInfo.summary.pendingZakladTotal)}
                </Text>
                <Text style={styles.zakladStatSubtext}>
                  ({zakladInfo.summary.pendingZakladCount} ta buyurtma)
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Type Filter Tabs */}
      <View style={styles.typeTabsContainer}>
        <TouchableOpacity
          style={[styles.typeTab, activeType === 'all' && styles.typeTabActive]}
          onPress={() => setActiveType('all')}
        >
          <Text style={[styles.typeTabText, activeType === 'all' && styles.typeTabTextActive]}>
            Barchasi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeTab, activeType === 'income' && styles.typeTabActive]}
          onPress={() => setActiveType('income')}
        >
          <Text style={[styles.typeTabText, activeType === 'income' && styles.typeTabTextActive]}>
            Kirim
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeTab, activeType === 'expense' && styles.typeTabActive]}
          onPress={() => setActiveType('expense')}
        >
          <Text style={[styles.typeTabText, activeType === 'expense' && styles.typeTabTextActive]}>
            Chiqim
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Filter */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#007AFF" />
            <Text style={styles.dateButtonText}>
              {startDate ? formatDateDisplay(startDate) : 'Boshlanish'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.dateSeparator}>—</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color="#007AFF" />
            <Text style={styles.dateButtonText}>
              {endDate ? formatDateDisplay(endDate) : 'Tugash'}
            </Text>
          </TouchableOpacity>

          {(startDate || endDate) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Date Pickers */}
      {showStartPicker && (
        Platform.OS === 'web' ? (
          <DatePickerWeb
            visible
            value={startDate || new Date()}
            maximumDate={endDate || new Date()}
            title="Boshlanish sanasi"
            onConfirm={(date) => {
              setStartDate(date);
              setShowStartPicker(false);
            }}
            onClose={() => setShowStartPicker(false)}
          />
        ) : Platform.OS === 'ios' ? (
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
        Platform.OS === 'web' ? (
          <DatePickerWeb
            visible
            value={endDate || new Date()}
            minimumDate={startDate || undefined}
            maximumDate={new Date()}
            title="Tugash sanasi"
            onConfirm={(date) => {
              setEndDate(date);
              setShowEndPicker(false);
            }}
            onClose={() => setShowEndPicker(false)}
          />
        ) : Platform.OS === 'ios' ? (
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

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchTransactions(true)}>
            <Text style={styles.retryButtonText}>Qayta urinish</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Transactions List */}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchTransactions(true)} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryCard: {
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  typeTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#f5f7fa',
  },
  typeTabActive: {
    backgroundColor: '#007AFF',
  },
  typeTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
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
  clearButton: {
    padding: 4,
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
  errorContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  incomeIndicator: {
    backgroundColor: '#E8F5E9',
  },
  expenseIndicator: {
    backgroundColor: '#FFEBEE',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  transactionOrder: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  transactionFrom: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  incomeAmount: {
    color: '#34C759',
  },
  expenseAmount: {
    color: '#FF3B30',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  zakladInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  zakladText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  zakladSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  zakladCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  zakladHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  zakladSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  zakladStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zakladStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  zakladStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#FFE082',
  },
  zakladStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  zakladStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  zakladStatSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
});
